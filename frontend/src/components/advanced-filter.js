export const AdvancedFilter = {
  render(state, currentFilters) {
    const { categories, retailers, accounts } = state;
    const subcategories = categories.flatMap(cat => (cat.subcategories || []).map(sub => ({ ...sub, categoryName: cat.name })));

    const selectedCats = currentFilters.categories || [];
    const selectedSubs = currentFilters.subcategories || [];
    const selectedRets = currentFilters.retailers || [];
    const selectedAccs = currentFilters.accounts || [];
    const minAmount = currentFilters.minAmount !== null ? currentFilters.minAmount : '';
    const maxAmount = currentFilters.maxAmount !== null ? currentFilters.maxAmount : '';

    const renderSection = (title, name, items, selectedIds) => `
            <div class="filter-group" data-section="${name}">
                <div class="group-header-row">
                    <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-light); text-transform: uppercase;">${title}</label>
                    <span class="selection-count" id="${name}-count" style="${selectedIds.length > 0 ? '' : 'display: none'}">${selectedIds.length}</span>
                </div>
                <div class="modal-search-container">
                    <input type="text" class="in-modal-search" data-search="${name}" placeholder="Search ${title}...">
                </div>
                <div class="multi-select-grid" id="${name}-grid">
                  ${items.map(item => {
      const val = name === 'account' ? item.id : item.name;
      const isSelected = selectedIds.includes(val);
      return `
                    <label class="checkbox-label ${isSelected ? 'highlighted' : ''}" data-label="${item.name.toLowerCase()}">
                      <input type="checkbox" name="${name}" value="${val}" ${isSelected ? 'checked' : ''}>
                      <span>${item.name} ${item.categoryName ? `<small>(${item.categoryName})</small>` : ''}</span>
                    </label>
                  `;
    }).join('')}
                </div>
            </div>
        `;

    return `
      <div id="advanced-filter-modal" class="modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content advanced-filter-content">
          <h3>Advanced Filters</h3>
          
          ${renderSection('Categories', 'category', categories, selectedCats)}
          ${renderSection('Subcategories', 'subcategory', subcategories, selectedSubs)}
          ${renderSection('Retailers', 'retailer', retailers, selectedRets)}
          ${renderSection('Accounts', 'account', state.accounts, selectedAccs)}

          <div class="filter-group">
            <div class="group-header-row">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-light); text-transform: uppercase;">Amount Range ($)</label>
            </div>
            <div class="amount-range-inputs">
              <input type="number" id="min-amount" placeholder="Min" value="${minAmount}">
              <span>to</span>
              <input type="number" id="max-amount" placeholder="Max" value="${maxAmount}">
            </div>
            <p class="helper-text">Expenses are negative (e.g., -50 to 0)</p>
          </div>

          <div class="modal-actions">
            <button id="reset-advanced-filter" class="btn secondary">Reset All</button>
            <div class="right-actions">
              <button id="close-advanced-filter" class="btn">Cancel</button>
              <button id="apply-advanced-filter" class="btn primary">Apply Filters</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  setup(onApply) {
    const modal = document.getElementById('advanced-filter-modal');
    if (!modal) return;

    const applyBtn = document.getElementById('apply-advanced-filter');
    const resetBtn = document.getElementById('reset-advanced-filter');
    const closeBtn = document.getElementById('close-advanced-filter');
    const backdrop = modal.querySelector('.modal-backdrop');

    const updateCount = (name) => {
      const count = modal.querySelectorAll(`input[name="${name}"]:checked`).length;
      const countBadge = document.getElementById(`${name}-count`);
      if (countBadge) {
        countBadge.textContent = count;
        countBadge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    };

    // Real-time search logic
    modal.querySelectorAll('.in-modal-search').forEach(input => {
      input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const section = e.target.dataset.search;
        const grid = document.getElementById(`${section}-grid`);
        grid.querySelectorAll('.checkbox-label').forEach(label => {
          const text = label.dataset.label;
          label.style.display = text.includes(term) ? 'flex' : 'none';
        });
      });
    });

    // Real-time highlight and count logic
    modal.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const label = e.target.closest('.checkbox-label');
        if (label) {
          label.classList.toggle('highlighted', e.target.checked);
        }
        updateCount(e.target.name);
      }
    });

    applyBtn.addEventListener('click', () => {
      const categories = Array.from(modal.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
      const subcategories = Array.from(modal.querySelectorAll('input[name="subcategory"]:checked')).map(cb => cb.value);
      const retailers = Array.from(modal.querySelectorAll('input[name="retailer"]:checked')).map(cb => cb.value);
      const accounts = Array.from(modal.querySelectorAll('input[name="account"]:checked')).map(cb => cb.value);

      const minAmountVal = document.getElementById('min-amount').value;
      const maxAmountVal = document.getElementById('max-amount').value;

      onApply({
        categories,
        subcategories,
        retailers,
        accounts,
        minAmount: minAmountVal === '' ? null : parseFloat(minAmountVal),
        maxAmount: maxAmountVal === '' ? null : parseFloat(maxAmountVal)
      });
      modal.remove();
    });

    resetBtn.addEventListener('click', () => {
      modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        cb.closest('.checkbox-label').classList.remove('highlighted');
      });
      ['category', 'subcategory', 'retailer', 'account'].forEach(updateCount);
      document.getElementById('min-amount').value = '';
      document.getElementById('max-amount').value = '';
    });

    const close = () => modal.remove();
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
  }
};
