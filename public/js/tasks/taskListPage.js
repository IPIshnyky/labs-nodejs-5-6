import { deleteTask, fetchTasks, toggleTaskCompletion } from "./api.js";
import {
  getDefaultState,
  getStateFromUrl,
  hasActiveFilters,
  syncControls,
  writeStateToUrl,
} from "./taskFilters.js";
import { renderError, renderTasks } from "./renderTasks.js";
import { renderPagination } from "./renderPagination.js";

let state = getStateFromUrl();
let currentPage = {
  data: [],
  pagination: {
    page: state.page,
    limit: state.pageSize,
    total: 0,
    totalPages: 1,
  },
};

const render = () => {
  const meta = {
    page: currentPage.pagination.page,
    pageSize: currentPage.pagination.limit,
    totalItems: currentPage.pagination.total,
    totalPages: Math.max(1, currentPage.pagination.totalPages),
  };

  state = { ...state, page: meta.page };
  syncControls(state);
  writeStateToUrl(state);
  renderTasks(currentPage.data, {
    ...meta,
    hasFilters: hasActiveFilters(state),
  });
  renderPagination(meta);
};

const reloadTasks = async () => {
  currentPage = await fetchTasks(state);
  render();
};

document.getElementById("task-filters").addEventListener("input", (event) => {
  if (!event.target.name) return;

  const value =
    event.target.name === "pageSize"
      ? Number.parseInt(event.target.value, 10)
      : event.target.value;

  state = { ...state, [event.target.name]: value, page: 1 };
  reloadTasks().catch((error) => {
    renderError(error.message);
  });
});

document.getElementById("task-reset-filters").addEventListener("click", () => {
  state = getDefaultState();
  reloadTasks().catch((error) => {
    renderError(error.message);
  });
});

document
  .getElementById("task-pagination")
  .addEventListener("click", (event) => {
    const button = event.target.closest("button[data-page-action]");
    if (!button || button.disabled) return;

    const delta = button.dataset.pageAction === "next" ? 1 : -1;
    state = { ...state, page: state.page + delta };
    reloadTasks().catch((error) => {
      renderError(error.message);
    });
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
