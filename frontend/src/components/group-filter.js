export const GroupFilter = {
    options: [
        { id: 'none', label: 'None (Date Order)' },
        { id: 'category', label: 'Category' },
        { id: 'subcategory', label: 'Subcategory' },
        { id: 'retailer', label: 'Retailer' }
    ],

    render(currentGroupBy) {
        return `
      <div id="group-filter-modal" class="modal">
        <div class="modal-content">
          <h3>Group Transactions By</h3>
          <div class="preset-filters">
            ${this.options.map(opt => `
              <button class="preset-btn ${currentGroupBy === opt.id ? 'active' : ''}" data-group="${opt.id}">
                ${opt.label}
              </button>
            `).join('')}
          </div>
          <div class="modal-actions">
            <button id="close-group-filter" class="btn">Cancel</button>
          </div>
        </div>
      </div>
    `;
    },

    setup(onApply) {
        const modal = document.getElementById('group-filter-modal');
        if (!modal) return;

        modal.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const groupBy = e.target.dataset.group;
                onApply(groupBy);
                modal.remove();
            });
        });

        document.getElementById('close-group-filter').addEventListener('click', () => modal.remove());
    }
};
