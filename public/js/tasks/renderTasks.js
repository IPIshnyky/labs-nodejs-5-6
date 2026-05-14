const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const renderTasks = (tasks, meta) => {
  const tableEl = document.getElementById("task-table");
  const listEl = document.getElementById("task-list");
  const emptyEl = document.getElementById("empty-state");

  emptyEl.hidden = meta.totalItems !== 0;
  tableEl.hidden = meta.totalItems === 0;
  emptyEl.textContent = meta.hasFilters
    ? "No tasks match the selected filters."
    : "No tasks yet.";

  listEl.innerHTML = tasks
    .map((task) => {
      const title = escapeHtml(task.title);
      const date = escapeHtml(task.date);
      const priority = escapeHtml(task.priority);
      const status = task.completed ? "Done" : "Pending";
      const action = task.completed ? "Undo" : "Complete";

      return `
        <tr class="${task.completed ? "row-done" : ""}">
          <td>${title}</td>
          <td>${date}</td>
          <td><span class="badge badge-${priority}">${priority}</span></td>
          <td>${status}</td>
          <td>
            <div class="actions">
              <button type="button" data-action="toggle" data-id="${task.id}" data-completed="${task.completed}">${action}</button>
              <a href="/tasks/${task.id}/edit">Edit</a>
              <button type="button" data-action="delete" data-id="${task.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
};

export const renderError = (message) => {
  const tableEl = document.getElementById("task-table");
  const emptyEl = document.getElementById("empty-state");

  tableEl.hidden = true;
  emptyEl.hidden = false;
  emptyEl.textContent = message;
};
