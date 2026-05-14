import { deleteTask, fetchTasks, toggleTaskCompletion } from "./api.js";
import {
  getDefaultState,
  getStateFromUrl,
  hasActiveFilters,
  syncControls,
  writeStateToUrl,
} from "./taskFilters.js";
import { filterTasks, paginateTasks } from "./taskList.js";
import { renderError, renderTasks } from "./renderTasks.js";
import { renderPagination } from "./renderPagination.js";

let tasks = [];
let state = getStateFromUrl();

const render = () => {
  const filteredTasks = filterTasks(tasks, state);
  const result = paginateTasks(filteredTasks, state);

  state = { ...state, page: result.meta.page };
  syncControls(state);
  writeStateToUrl(state);
  renderTasks(result.items, {
    ...result.meta,
    hasFilters: hasActiveFilters(state),
  });
  renderPagination(result.meta);
};

const reloadTasks = async () => {
  tasks = await fetchTasks();
  render();
};

document.getElementById("task-filters").addEventListener("input", (event) => {
  if (!event.target.name) return;

  const value =
    event.target.name === "pageSize"
      ? Number.parseInt(event.target.value, 10)
      : event.target.value;

  state = { ...state, [event.target.name]: value, page: 1 };
  render();
});

document.getElementById("task-reset-filters").addEventListener("click", () => {
  state = getDefaultState();
  render();
});

document
  .getElementById("task-pagination")
  .addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page-action]");
    if (!button || button.disabled) return;

    const delta = button.dataset.pageAction === "next" ? 1 : -1;
    state = { ...state, page: state.page + delta };
    render();
  });

document
  .getElementById("task-list")
  .addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = button.dataset.id;
    if (button.dataset.action === "toggle") {
      await toggleTaskCompletion(id, button.dataset.completed !== "true");
    }

    if (button.dataset.action === "delete") {
      await deleteTask(id);
    }

    await reloadTasks();
  });

reloadTasks().catch((error) => {
  renderError(error.message);
});
