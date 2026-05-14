const defaultState = {
  search: "",
  status: "all",
  priority: "all",
  page: 1,
  pageSize: 10,
};

const allowedStatuses = ["all", "pending", "done"];
const allowedPriorities = ["all", "low", "medium", "high"];
const allowedPageSizes = [5, 10, 20];

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toAllowedValue = (value, allowedValues, fallback) => {
  return allowedValues.includes(value) ? value : fallback;
};

const toAllowedPageSize = (value) => {
  const parsed = toPositiveInteger(value, defaultState.pageSize);
  return allowedPageSizes.includes(parsed) ? parsed : defaultState.pageSize;
};

export const getStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    search: params.get("search") || defaultState.search,
    status: toAllowedValue(
      params.get("status"),
      allowedStatuses,
      defaultState.status,
    ),
    priority: toAllowedValue(
      params.get("priority"),
      allowedPriorities,
      defaultState.priority,
    ),
    page: toPositiveInteger(params.get("page"), defaultState.page),
    pageSize: toAllowedPageSize(params.get("pageSize")),
  };
};

export const writeStateToUrl = (state) => {
  const params = new URLSearchParams();

  if (state.search) params.set("search", state.search);
  if (state.status !== defaultState.status) params.set("status", state.status);
  if (state.priority !== defaultState.priority) {
    params.set("priority", state.priority);
  }
  if (state.page !== defaultState.page) params.set("page", state.page);
  if (state.pageSize !== defaultState.pageSize) {
    params.set("pageSize", state.pageSize);
  }

  const query = params.toString();
  const url = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState({}, "", url);
};

export const syncControls = (state) => {
  document.getElementById("task-search").value = state.search;
  document.getElementById("task-status").value = state.status;
  document.getElementById("task-priority").value = state.priority;
  document.getElementById("task-page-size").value = String(state.pageSize);
};

export const hasActiveFilters = (state) => {
  return (
    state.search !== defaultState.search ||
    state.status !== defaultState.status ||
    state.priority !== defaultState.priority
  );
};

export const getDefaultState = () => ({ ...defaultState });
