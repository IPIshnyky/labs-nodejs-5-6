import sequelize from "../db/index.js";
import PriorityModel from "./Priority.js";
import TaskModel from "./Task.js";

const models = {
  Priority: PriorityModel(sequelize),
  Task: TaskModel(sequelize),
};

for (const model of Object.values(models)) {
  model.associate?.(models);
}

const { Priority, Task } = models;

export { Priority, Task };
export default models;
