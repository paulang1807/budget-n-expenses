export const SortFilter = {
  options: [
    { id: 'date', label: 'Date' },
    { id: 'amount', label: 'Amount' },
    { id: 'retailer', label: 'Retailer' },
    { id: 'category', label: 'Category' },
    { id: 'subcategory', label: 'Subcategory' }
  ],

  render(currentSorts) {
    // Ensure we have at least one sort level
    const sorts = currentSorts && currentSorts.length > 0 ? currentSorts : [{ field: 'date', order: 'desc' }];

    return `
      <div id="sort-filter-modal" class="modal">
        <div class="modal-content">
          <h3>Sort Transactions</h3>
          <p class="modal-subtitle">Define primary, secondary, and tertiary sorting levels.</p>
          
          <div id="sort-levels-container" class="sort-levels-container">
            ${sorts.map((sort, index) => this.renderSortRow(sort, index)).join('')}
          </div>

          <button id="add-sort-level" class="btn secondary btn-sm" style="margin-top: 1rem;">
            <span>+ Add Level</span>
          </button>

          <div class="modal-actions">
            <button id="close-sort-filter" class="btn">Cancel</button>
            <button id="apply-sort-filter" class="btn primary">Apply</button>
          </div>
        </div>
      </div>
    `;
  },

  renderSortRow(sort, index) {
    return `
      <div class="sort-level-row" data-index="${index}">
        <div class="sort-field-group">
          <label>${index === 0 ? 'Sort by' : 'Then by'}</label>
          <select class="sort-field">
            ${this.options.map(opt => `
              <option value="${opt.id}" ${sort.field === opt.id ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        </div>
        <div class="sort-order-group">
          <label>Order</label>
          <select class="sort-order">
            <option value="desc" ${sort.order === 'desc' ? 'selected' : ''}>Descending</option>
            <option value="asc" ${sort.order === 'asc' ? 'selected' : ''}>Ascending</option>
          </select>
        </div>
        ${index > 0 ? `
          <button class="remove-sort-level" title="Remove level">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        ` : '<div style="width: 32px;"></div>'}
      </div>
    `;
  },

  setup(onApply) {
    const modal = document.getElementById('sort-filter-modal');
    if (!modal) return;

    const container = document.getElementById('sort-levels-container');
    const addBtn = document.getElementById('add-sort-level');
    const applyBtn = document.getElementById('apply-sort-filter');
    const closeBtn = document.getElementById('close-sort-filter');

    addBtn.addEventListener('click', () => {
      const nextIndex = container.children.length;
      const newRowHtml = this.renderSortRow({ field: 'date', order: 'desc' }, nextIndex);
      container.insertAdjacentHTML('beforeend', newRowHtml);
      this.attachRowListeners(container.lastElementChild);
    });

    // Attach listeners to initial rows
    Array.from(container.children).forEach(row => this.attachRowListeners(row));

    applyBtn.addEventListener('click', () => {
      const sorts = Array.from(container.querySelectorAll('.sort-level-row')).map(row => ({
        field: row.querySelector('.sort-field').value,
        order: row.querySelector('.sort-order').value
      }));
      onApply(sorts);
      modal.remove();
    });

    closeBtn.addEventListener('click', () => modal.remove());
  },

  attachRowListeners(row) {
    const removeBtn = row.querySelector('.remove-sort-level');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        row.remove();
        // Re-index remaining rows for labels
        const container = document.getElementById('sort-levels-container');
        Array.from(container.children).forEach((child, idx) => {
          child.dataset.index = idx;
          const label = child.querySelector('label');
          if (label) label.textContent = idx === 0 ? 'Sort by' : 'Then by';
        });
      });
    }
  }
};
