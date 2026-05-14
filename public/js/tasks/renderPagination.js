export const renderPagination = (meta) => {
  const paginationEl = document.getElementById("task-pagination");
  const summaryEl = document.getElementById("task-page-summary");
  const previousEl = paginationEl.querySelector(
    '[data-page-action="previous"]',
  );
  const nextEl = paginationEl.querySelector('[data-page-action="next"]');

  paginationEl.hidden = meta.totalItems === 0;
  summaryEl.textContent = `Page ${meta.page} of ${meta.totalPages} (${meta.totalItems} tasks)`;

  previousEl.disabled = meta.page <= 1;
  nextEl.disabled = meta.page >= meta.totalPages;
};
