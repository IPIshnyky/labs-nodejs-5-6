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

export const fetchTasks = () => requestJson("/api/tasks");

export const toggleTaskCompletion = (id, completed) => {
  return requestJson(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });
};

export const deleteTask = (id) => {
  return requestJson(`/api/tasks/${id}`, { method: "DELETE" });
};
