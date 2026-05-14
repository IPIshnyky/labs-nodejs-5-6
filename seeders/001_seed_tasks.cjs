const tasks = [
  {
    title: "Finish Lab 4 Node.js",
    due_date: "2026-05-03",
    priority: 3,
    is_done: false,
  },
  {
    title: "Review pull requests",
    due_date: "2026-05-06",
    priority: 3,
    is_done: false,
  },
  {
    title: "Buy groceries",
    due_date: "2026-05-01",
    priority: 2,
    is_done: false,
  },
  {
    title: "Write unit tests",
    due_date: "2026-05-05",
    priority: 2,
    is_done: false,
  },
  {
    title: "Update project dependencies",
    due_date: "2026-04-28",
    priority: 1,
    is_done: false,
  },
  {
    title: "Team sync meeting",
    due_date: "2026-05-09",
    priority: 2,
    is_done: false,
  },
  {
    title: "Submit weekly report",
    due_date: "2026-05-11",
    priority: 1,
    is_done: false,
  },
  {
    title: "Prepare exam revision",
    due_date: "2026-05-20",
    priority: 3,
    is_done: false,
  },
  {
    title: "Read PostgreSQL documentation",
    due_date: "2026-04-29",
    priority: 1,
    is_done: true,
  },
];

const taskTitles = tasks.map((task) => task.title);

module.exports = {
  async up(queryInterface, Sequelize, transaction) {
    await queryInterface.bulkDelete(
      "tasks",
      {
        title: {
          [Sequelize.Op.in]: taskTitles,
        },
      },
      { transaction },
    );

    await queryInterface.bulkInsert("tasks", tasks, { transaction });
  },

  async down(queryInterface, Sequelize, transaction) {
    await queryInterface.bulkDelete(
      "tasks",
      {
        title: {
          [Sequelize.Op.in]: taskTitles,
        },
      },
      { transaction },
    );
  },
};
