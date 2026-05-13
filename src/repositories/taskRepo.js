import { Op, Transaction } from "sequelize";

import sequelize from "../db/index.js";
import { Task, Priority } from "../models/index.js";

export class TaskRepo {
  #dateToDateOnly(value) {
    if (!value) return null;

    if (value instanceof Date) {
      return value.toISOString().split("T")[0];
    }

    return String(value).split("T")[0];
  }

  #mapTaskToDTO(taskInstance) {
    if (!taskInstance) return null;

    const priorityMap = {
      1: "low",
      2: "medium",
      3: "high",
    };

    const priority =
      taskInstance.priorityData?.code ||
      priorityMap[taskInstance.priority] ||
      "low";

    return {
      id: String(taskInstance.id),
      title: taskInstance.title,
      date: this.#dateToDateOnly(taskInstance.dueDate),
      priority,
      completed: taskInstance.isDone,
    };
  }

  #priorityToInt(priority) {
    const map = {
      low: 1,
      medium: 2,
      high: 3,
    };
    return map[priority] || 1;
  }

  async getAll() {
    const tasks = await Task.findAll({
      include: [{ model: Priority, as: "priorityData" }],
      order: [["createdAt", "DESC"]],
    });

    return tasks.map((task) => this.#mapTaskToDTO(task));
  }

  async getById(id) {
    const task = await Task.findByPk(id, {
      include: [{ model: Priority, as: "priorityData" }],
    });

    return task ? this.#mapTaskToDTO(task) : null;
  }

  async add(task) {
    const transaction = await sequelize.transaction();
    try {
      const priorityInt = this.#priorityToInt(task.priority);
      const newTask = await Task.create(
        {
          title: task.title,
          dueDate: task.date || null,
          priority: priorityInt,
          isDone: false,
        },
        { transaction },
      );

      await transaction.commit();

      const createdTask = await Task.findByPk(newTask.id, {
        include: [{ model: Priority, as: "priorityData" }],
      });

      return this.#mapTaskToDTO(createdTask);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id, updates) {
    const transaction = await sequelize.transaction();
    try {
      const updateData = {};

      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }

      if (updates.date !== undefined) {
        updateData.dueDate = updates.date || null;
      }

      if (updates.priority !== undefined) {
        updateData.priority = this.#priorityToInt(updates.priority);
      }

      if (updates.completed !== undefined) {
        updateData.isDone = updates.completed;
      }

      if (Object.keys(updateData).length === 0) {
        const existingTask = await Task.findByPk(id, {
          include: [{ model: Priority, as: "priorityData" }],
        });
        await transaction.rollback();
        return existingTask ? this.#mapTaskToDTO(existingTask) : null;
      }

      const [affectedCount] = await Task.update(updateData, {
        where: { id },
        transaction,
      });

      if (affectedCount === 0) {
        await transaction.rollback();
        return null;
      }

      await transaction.commit();

      const updatedTask = await Task.findByPk(id, {
        include: [{ model: Priority, as: "priorityData" }],
      });

      return this.#mapTaskToDTO(updatedTask);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rescheduleOverdue(maxPerDay = 3, windowDays = 14) {
    const transaction = await sequelize.transaction();
    try {
      const today = new Date().toISOString().split("T")[0];

      const overdue = await Task.findAll({
        where: {
          dueDate: {
            [Op.lt]: today,
          },
          isDone: false,
        },
        attributes: [
          "id",
          "title",
          "dueDate",
          "priority",
          "isDone",
          "createdAt",
        ],
        include: [{ model: Priority, as: "priorityData" }],
        order: [
          [{ model: Priority, as: "priorityData" }, "weight", "DESC"],
          ["dueDate", "ASC"],
        ],
        transaction,
      });

      if (overdue.length === 0) {
        await transaction.commit();
        return [];
      }

      const windowEnd = new Date();
      windowEnd.setDate(windowEnd.getDate() + windowDays);
      const windowEndDate = windowEnd.toISOString().split("T")[0];

      // Snapshot of how many tasks are already filling each future day.
      const existing = await Task.findAll({
        attributes: [
          "dueDate",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        where: {
          dueDate: {
            [Op.gte]: today,
            [Op.lt]: windowEndDate,
          },
          isDone: false,
        },
        group: ["dueDate"],
        raw: true,
        transaction,
      });

      const slotMap = new Map(
        existing.map((r) => {
          return [this.#dateToDateOnly(r.dueDate), Number(r.count)];
        }),
      );

      const updated = [];
      for (const row of overdue) {
        // Find the nearest future day within the window that still has capacity.
        // Each placement updates slotMap so subsequent tasks see accurate counts.
        let targetDate = null;
        for (let d = 1; d <= windowDays; d++) {
          const candidate = new Date();
          candidate.setDate(candidate.getDate() + d);
          const key = candidate.toISOString().split("T")[0];
          if ((slotMap.get(key) ?? 0) < maxPerDay) {
            targetDate = key;
            slotMap.set(key, (slotMap.get(key) ?? 0) + 1);
            break;
          }
        }

        // Business logic abort: backlog exceeds planning capacity.
        // The throw triggers ROLLBACK, undoing every placement made so far.
        if (!targetDate) {
          const err = new Error(
            `Capacity exceeded: cannot fit all ${overdue.length} overdue tasks ` +
              `within ${windowDays} days at ${maxPerDay} tasks/day. No tasks were rescheduled.`,
          );
          err.status = 422;
          throw err;
        }

        const currentPriorityWeight = row.priorityData?.weight ?? 1;
        const nextPriorityWeight = Math.min(currentPriorityWeight + 1, 3);
        const nextPriority = await Priority.findOne({
          where: { weight: nextPriorityWeight },
          transaction,
        });

        await row.update(
          {
            dueDate: targetDate,
            priority: nextPriority?.id ?? row.priority,
          },
          { transaction },
        );

        const updatedTask = await Task.findByPk(row.id, {
          include: [{ model: Priority, as: "priorityData" }],
          transaction,
        });

        updated.push(this.#mapTaskToDTO(updatedTask));
      }

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(id) {
    const transaction = await sequelize.transaction();
    try {
      const result = await Task.destroy({
        where: { id },
        transaction,
      });

      await transaction.commit();
      return result > 0 ? String(id) : null;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getWithFilters({
    page = 1,
    limit = 10,
    priority,
    completed,
    dateFrom,
    dateTo,
  }) {
    const offset = (page - 1) * limit;
    const taskWhere = {};
    const priorityInclude = {
      model: Priority,
      as: "priorityData",
      required: true,
    };

    if (priority) {
      priorityInclude.where = { code: priority };
    }

    if (completed !== undefined) {
      taskWhere.isDone = completed;
    }

    if (dateFrom) {
      taskWhere.dueDate = {
        ...(taskWhere.dueDate ?? {}),
        [Op.gte]: dateFrom,
      };
    }

    if (dateTo) {
      taskWhere.dueDate = {
        ...(taskWhere.dueDate ?? {}),
        [Op.lte]: dateTo,
      };
    }

    return sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
      async (transaction) => {
        const tasks = await Task.findAll({
          where: taskWhere,
          include: [priorityInclude],
          order: [["createdAt", "DESC"]],
          limit,
          offset,
          transaction,
        });

        const total = await Task.count({
          where: taskWhere,
          include: [priorityInclude],
          transaction,
        });

        return {
          tasks: tasks.map((task) => this.#mapTaskToDTO(task)),
          total,
        };
      },
    );
  }
}
