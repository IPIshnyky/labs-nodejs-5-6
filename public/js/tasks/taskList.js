const includesSearch = (task, search) => {
  return task.title.toLowerCase().includes(search.trim().toLowerCase());
};

export const filterTasks = (tasks, state) => {
  return tasks.filter((task) => {
    const matchesSearch = !state.search || includesSearch(task, state.search);
    const matchesStatus =
      state.status === "all" ||
      (state.status === "done" && task.completed) ||
      (state.status === "pending" && !task.completed);
    const matchesPriority =
      state.priority === "all" || task.priority === state.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
};

export const paginateTasks = (tasks, state) => {
  const totalItems = tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
  const page = Math.min(state.page, totalPages);
  const start = (page - 1) * state.pageSize;

  return {
    items: tasks.slice(start, start + state.pageSize),
    meta: {
      page,
      pageSize: state.pageSize,
      totalItems,
      totalPages,
    },
  };
};
