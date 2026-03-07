export const GroupFilter = {
  options: [
    { id: 'retailer', label: 'Retailer' },
    { id: 'category', label: 'Category' },
    { id: 'subcategory', label: 'Subcategory' }
  ],

  render(currentGroups = []) {
    return `
      <div id="group-filter-modal" class="modal">
        <div class="modal-content">
          <h3>Group Transactions By</h3>
          <p class="modal-subtitle">Priority: Retailer > Category > Subcategory</p>
          <div class="multi-select-options">
            ${this.options.map(opt => `
              <label class="checkbox-label">
                <input type="checkbox" class="group-checkbox" value="${opt.id}" ${currentGroups.includes(opt.id) ? 'checked' : ''}>
                <span class="checkbox-custom"></span>
                ${opt.label}
              </label>
            `).join('')}
          </div>
          <div class="modal-actions">
            <button id="clear-group-filter" class="btn">None (Date Order)</button>
            <div class="action-right">
                <button id="close-group-filter" class="btn">Cancel</button>
                <button id="apply-group-filter" class="btn primary">Apply</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setup(onApply) {
    const modal = document.getElementById('group-filter-modal');
    if (!modal) return;

    const applyBtn = document.getElementById('apply-group-filter');
    const clearBtn = document.getElementById('clear-group-filter');
    const closeBtn = document.getElementById('close-group-filter');

    applyBtn.addEventListener('click', () => {
      const selected = Array.from(modal.querySelectorAll('.group-checkbox:checked')).map(cb => cb.value);
      // Sort by priority: Retailer > Category > Subcategory
      const priority = ['retailer', 'category', 'subcategory'];
      const sortedSelected = priority.filter(p => selected.includes(p));
      onApply(sortedSelected);
      modal.remove();
    });

    clearBtn.addEventListener('click', () => {
      onApply([]);
      modal.remove();
    });

    closeBtn.addEventListener('click', () => modal.remove());
  }
};
