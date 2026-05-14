import express from "express";
import morgan from "morgan";
import path from "path";

import { TaskRepo } from "./src/repositories/taskRepo.js";
import { TaskService } from "./src/services/taskService.js";
import { TaskController } from "./src/controllers/taskController.js";
import sequelize from "./src/db/index.js";

// Dependency injection composition root
const taskRepo = new TaskRepo();
const taskService = new TaskService(taskRepo);
const taskController = new TaskController(taskService);

const app = express();

app.use("/fonts/geist", express.static("node_modules/geist/dist/fonts"));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "src/views"));

app.get("/", (_req, res) => {
  res.render("index", { page: "home" });
});

app.get("/tasks/new", (_req, res) => {
  res.render("create", { page: "create" });
});

app.get("/tasks/reschedule-overdue", (_req, res) => {
  res.render("reschedule", {
    page: "reschedule",
    values: { maxPerDay: 3, windowDays: 14 },
  });
});

app.get("/tasks/:id/edit", (req, res) => {
  res.render("edit", { page: "edit", taskId: req.params.id });
});

// API Routes
app.get("/api/tasks", taskController.getAllTasks);
app.post("/api/tasks", taskController.createTask);
app.post(
  "/api/tasks/reschedule-overdue",
  taskController.rescheduleOverdueTasks,
);
app.get("/api/tasks/:id", taskController.getTask);
app.put("/api/tasks/:id", taskController.updateTask);
app.patch("/api/tasks/:id", taskController.patchTask);
app.delete("/api/tasks/:id", taskController.deleteTask);

app.use((_req, res) => {
  res.status(404).sendFile(path.join(import.meta.dirname, "public/404.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;

let server;

const shutdown = (signal) => {
  return (err) => {
    if (err) {
      console.error(`${signal} received with error:`, err);
    } else {
      console.log(`${signal} received, shutting down gracefully.`);
    }

    // Stop accepting new connections
    server.close(async (closeErr) => {
      if (closeErr) {
        console.error("Error during server close", closeErr);
        process.exit(1);
      }

      try {
        await sequelize.close();
        console.log("Database connection closed.");
      } catch (dbErr) {
        console.error("Error closing database connection:", dbErr);
      }

      console.log("Closed remaining connections, exiting.");
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      console.warn("Forcing shutdown due to timeout.");
      process.exit(1);
    }, 10000).unref();
  };
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    process.on("SIGTERM", shutdown("SIGTERM"));
    process.on("SIGINT", shutdown("SIGINT"));
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", err);
      shutdown("uncaughtException")(err);
    });
    process.on("unhandledRejection", (reason) => {
      console.error("Unhandled Rejection:", reason);
      shutdown("unhandledRejection")(reason);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
})();
