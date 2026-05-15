export const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
};

export const fetchTasks = (state) => {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.pageSize),
  });

  if (state.search) params.set("search", state.search);
  if (state.status !== "all") params.set("status", state.status);
  if (state.priority !== "all") params.set("priority", state.priority);

  return requestJson(`/api/tasks?${params.toString()}`);
};

export const toggleTaskCompletion = (id, completed) => {
  return requestJson(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
};

export const deleteTask = (id) => {
  return requestJson(`/api/tasks/${id}`, { method: "DELETE" });
};
