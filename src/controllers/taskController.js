import { badRequest, parsePositiveInteger } from "../utils/queryParsers.js";

export class TaskController {
  #service;

  constructor(service) {
    this.#service = service;
  }

  #hasAdvancedQuery(query) {
    return ["page", "limit", "pageSize", "search", "status", "priority"].some(
      (key) => query[key] !== undefined,
    );
  }

  #parseListQuery(query) {
    const statusMap = {
      pending: false,
      done: true,
    };

    if (query.status !== undefined && query.status !== "all") {
      if (!Object.hasOwn(statusMap, query.status)) {
        throw badRequest("Status must be all, pending, or done");
      }
    }

    if (
      query.priority !== undefined &&
      query.priority !== "all" &&
      !["low", "medium", "high"].includes(query.priority)
    ) {
      throw badRequest("Priority must be all, low, medium, or high");
    }

    return {
      page: parsePositiveInteger(query.page, "Page", 1),
      limit: parsePositiveInteger(query.limit ?? query.pageSize, "Limit", 10),
      search: typeof query.search === "string" ? query.search.trim() : "",
      completed:
        query.status !== undefined && query.status !== "all"
          ? statusMap[query.status]
          : undefined,
      priority:
        query.priority !== undefined && query.priority !== "all"
          ? query.priority
          : undefined,
    };
  }

  getAllTasks = async (req, res, next) => {
    try {
      if (this.#hasAdvancedQuery(req.query)) {
        const result = await this.#service.fetchTasksAdvanced(
          this.#parseListQuery(req.query),
        );
        res.json(result);
        return;
      }

      const tasks = await this.#service.fetchAllTasks();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  };

  getTask = async (req, res, next) => {
    try {
      const task = await this.#service.getTaskById(req.params.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req, res, next) => {
    try {
      const newTask = await this.#service.createTask(req.body);
      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req, res, next) => {
    try {
      const updatedTask = await this.#service.updateTaskData(
        req.params.id,
        req.body,
      );
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  patchTask = async (req, res, next) => {
    try {
      const existingTask = await this.#service.getTaskById(req.params.id);
      const mergedTask = {
        title:
          req.body.title !== undefined ? req.body.title : existingTask.title,
        date: req.body.date !== undefined ? req.body.date : existingTask.date,
        priority:
          req.body.priority !== undefined
            ? req.body.priority
            : existingTask.priority,
        completed:
          req.body.completed !== undefined
            ? req.body.completed
            : existingTask.completed,
      };
      const updatedTask = await this.#service.updateTaskData(
        req.params.id,
        mergedTask,
      );
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  };

  rescheduleOverdueTasks = async (req, res, next) => {
    try {
      const updatedTasks = await this.#service.rescheduleOverdueTasks(
        req.body.maxPerDay,
        req.body.windowDays,
      );
      res.json(updatedTasks);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req, res, next) => {
    try {
      await this.#service.removeTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
