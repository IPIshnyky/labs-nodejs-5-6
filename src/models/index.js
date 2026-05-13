import sequelize from "../config/sequelize.js";
import PriorityModel from "./Priority.js";
import TaskModel from "./Task.js";

const Priority = PriorityModel(sequelize);
const Task = TaskModel(sequelize);

Priority.hasMany(Task, { foreignKey: "priority", as: "tasks" });
Task.belongsTo(Priority, { foreignKey: "priority", as: "priorityData" });

export { Priority, Task, sequelize };
