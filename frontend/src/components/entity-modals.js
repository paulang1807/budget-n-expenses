export const EntityModals = {
  renderIconSelector(icons, selectedIcon) {
    return `
      <div class="icon-selector">
        <label>Select Icon</label>
        <div class="icon-grid">
          ${icons.map(icon => {
      const isSvg = icon.emoji.startsWith('<svg');
      return `
            <div class="icon-option ${icon.emoji === selectedIcon ? 'selected' : ''}" data-icon="${icon.emoji}">
              ${isSvg ? icon.emoji : icon.emoji}
            </div>
          `;
    }).join('')}
        </div>
        <div class="form-group custom-icon-group">
          <label>Or enter custom emoji</label>
          <input type="text" name="icon" value="${selectedIcon || ''}" class="icon-input">
        </div>
      </div>
    `;
  },

  renderAddAccount(icons, initialData = null) {
    this.clearModals();
    const data = initialData || {};
    const isEdit = !!data.id;
    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Account' : 'Add New Account'}</h3>
          <form id="entity-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Account Name</label>
              <input type="text" name="name" required placeholder="e.g. Savings" value="${data.name || ''}">
            </div>
            <div class="form-group">
              <label>Type</label>
              <select name="type">
                <option value="cash" ${data.type === 'cash' ? 'selected' : ''}>Cash</option>
                <option value="checking" ${data.type === 'checking' ? 'selected' : ''}>Checking</option>
                <option value="savings" ${data.type === 'savings' ? 'selected' : ''}>Savings</option>
                <option value="credit" ${data.type === 'credit' ? 'selected' : ''}>Credit Card</option>
                <option value="investment" ${data.type === 'investment' ? 'selected' : ''}>Investment</option>
                <option value="crypto" ${data.type === 'crypto' ? 'selected' : ''}>Crypto</option>
                <option value="401k" ${data.type === '401k' ? 'selected' : ''}>401K</option>
              </select>
            </div>
            <div class="form-group">
              <label>Initial Balance</label>
              <input type="number" name="balance" step="0.01" value="${data.balance || 0}">
            </div>
            ${this.renderIconSelector(icons, data.icon || '💰')}
            <div class="modal-actions">
              <button type="button" class="btn cancel-btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'} Account</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddCategory(icons, initialData = null) {
    this.clearModals();
    const data = initialData || {};
    const isEdit = !!data.id;
    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Category' : 'Add New Category'}</h3>
          <form id="entity-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Category Name</label>
              <input type="text" name="name" required placeholder="e.g. Health" value="${data.name || ''}">
            </div>
            <div class="form-group">
              <label>Transaction Type</label>
              <select name="type" required>
                <option value="expense" ${data.type === 'expense' ? 'selected' : ''}>Expense</option>
                <option value="income" ${data.type === 'income' ? 'selected' : ''}>Income</option>
              </select>
            </div>
            ${this.renderIconSelector(icons, data.icon || '📁')}
            ${!isEdit ? '<p><small>Subcategories can be added later in Settings.</small></p>' : ''}
            <div class="modal-actions">
              <button type="button" class="btn cancel-btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'} Category</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddRetailer(icons, initialData = null) {
    this.clearModals();
    const data = initialData || {};
    const isEdit = !!data.id;
    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Retailer' : 'Add New Retailer'}</h3>
          <form id="entity-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Retailer Name</label>
              <input type="text" name="name" required placeholder="e.g. Target" value="${data.name || ''}">
            </div>
            ${this.renderIconSelector(icons, data.icon || '🏪')}
            <div class="modal-actions">
              <button type="button" class="btn cancel-btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'} Retailer</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddSubcategory(icons, categoryId, initialData = null) {
    this.clearModals();
    const data = initialData || {};
    const isEdit = !!data.id;
    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Subcategory' : 'Add New Subcategory'}</h3>
          <form id="entity-form">
            <input type="hidden" name="categoryId" value="${categoryId}">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Subcategory Name</label>
              <input type="text" name="name" required placeholder="e.g. Electricity" value="${data.name || ''}">
            </div>
            ${this.renderIconSelector(icons, data.icon || '🔹')}
            <div class="modal-actions">
              <button type="button" class="btn cancel-btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'} Subcategory</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderAddBudget(categories, initialData = null) {
    this.clearModals();
    const data = initialData || {};
    const isEdit = !!data.id;
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const lineItems = data.lineItems || [];

    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content budget-modal-content">
          <h3>${isEdit ? 'Edit Budget' : 'Add New Budget'}</h3>
          <form id="entity-form" data-type="budget">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            
            <div class="budget-period-row">
              <div class="form-group">
                <label>Year</label>
                <div class="select-wrapper">
                  <select name="year">
                    ${years.map(y => `<option value="${y}" ${(data.year || currentYear) === y ? 'selected' : ''}>${y}</option>`).join('')}
                  </select>
                  <div class="select-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>Month</label>
                <div class="select-wrapper">
                  <select name="month">
                    ${months.map((m, i) => `<option value="${i + 1}" ${(data.month || new Date().getMonth() + 1) === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                  </select>
                  <div class="select-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Category</label>
              <div class="select-wrapper">
                <select name="category">
                  ${categories.map(c => {
                    const subsAttr = c.subcategories ? `data-subs='${JSON.stringify(c.subcategories).replace(/'/g, "&apos;")}'` : "data-subs='[]'";
                    return `<option value="${c.name}" ${data.category === c.name ? 'selected' : ''} ${subsAttr}>${c.name}</option>`;
                  }).join('')}
                </select>
                <div class="select-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div class="budget-subcategories-section">
              <div class="subcategory-header">
                <h4>Subcategories & Line Items</h4>
                <button type="button" id="add-subcategory-btn" class="btn secondary btn-sm">+ Add Subcategory</button>
              </div>
              <div id="budget-subcategories-container">
                ${(data.subcategories || []).map(sub => {
                  let subSelectHtml = `
                    <div class="select-wrapper">
                      <input type="text" name="sub-name" class="sub-name-input" value="${sub.name}" required placeholder="Subcategory Name">
                    </div>
                  `;
                  
                  const lineItemsHtml = (sub.lineItems || []).map(li => `
                    <div class="line-item-row">
                      <input type="text" name="li-name" placeholder="Item Name" value="${li.name}" required>
                      <input type="number" name="li-amount" placeholder="0.00" step="0.01" value="${li.amount}" required class="li-amount-input">
                      <button type="button" class="btn-icon remove-li-btn" title="Remove Item">🗑️</button>
                    </div>
                  `).join('');

                  return `
                    <div class="budget-subcategory-card" data-existing="true">
                      <div class="subcategory-card-header">
                        ${subSelectHtml}
                        <input type="number" name="sub-amount" class="sub-name-input sub-amount-input" step="0.01" value="${sub.amount || 0}" ${(sub.lineItems && sub.lineItems.length > 0) ? 'readonly' : ''} placeholder="0.00">
                        <button type="button" class="btn-icon remove-subcategory-btn">🗑️</button>
                      </div>
                      <div class="subcategory-line-items">
                         ${lineItemsHtml}
                         <button type="button" class="btn secondary btn-sm add-line-item-btn">+ Add Line Item</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
              <label>Total Allocated Amount</label>
              <input type="number" id="budget-allocated" name="allocated" step="0.01" required value="${data.allocated || ''}" ${(data.subcategories && data.subcategories.length > 0) ? 'readonly' : ''}>
            </div>
            
            <div class="form-group">
              <label>Color</label>
              <input type="color" name="color" value="${data.color || '#36A2EB'}">
            </div>

            <div class="modal-actions">
              <button type="button" class="btn cancel-btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'} Budget</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderLineItemRow(item = { name: '', amount: '' }) {
    return `
      <div class="line-item-row">
        <input type="text" name="li-name" placeholder="Item Name" value="${item.name}" required>
        <input type="number" name="li-amount" placeholder="0.00" step="0.01" value="${item.amount}" required class="li-amount-input">
        <button type="button" class="remove-li-btn" title="Remove Item">
           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <polyline points="3 6 5 6 21 6"></polyline>
             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
             <line x1="10" y1="11" x2="10" y2="17"></line>
             <line x1="14" y1="11" x2="14" y2="17"></line>
           </svg>
        </button>
      </div>
    `;
  },

  setup(onSubmit) {
    const modal = document.querySelector('#entity-modal');
    const form = modal?.querySelector('#entity-form');

    if (!form) {
      console.error('Entity form not found');
      return;
    }

    const type = form.dataset.type;

    // Budget-specific dynamic listeners
    if (type === 'budget') {
      const categorySelect = modal.querySelector('select[name="category"]');
      const subcategoriesContainer = modal.querySelector('#budget-subcategories-container');
      const allocatedInput = modal.querySelector('#budget-allocated');
      const addSubBtn = modal.querySelector('#add-subcategory-btn');

      const calculateTotal = () => {
        let total = 0;
        const subCards = Array.from(modal.querySelectorAll('.budget-subcategory-card'));
        
        if (subCards.length === 0) {
          allocatedInput.readOnly = false;
          return;
        }

        allocatedInput.readOnly = true;
        subCards.forEach(card => {
          let cardTotal = 0;
          const rows = Array.from(card.querySelectorAll('.line-item-row'));
          const subAmountInput = card.querySelector('input[name="sub-amount"]');
          
          if (rows.length > 0) {
            rows.forEach(row => {
              const amt = parseFloat(row.querySelector('.li-amount-input').value) || 0;
              cardTotal += amt;
            });
            subAmountInput.value = cardTotal.toFixed(2);
            subAmountInput.readOnly = true;
          } else {
            subAmountInput.readOnly = false;
            cardTotal = parseFloat(subAmountInput.value) || 0;
          }
          
          total += cardTotal;
        });
        allocatedInput.value = total.toFixed(2);
      };

      const renderLineItemRow = (item = { name: '', amount: '' }) => {
        return `
          <div class="line-item-row">
            <input type="text" name="li-name" placeholder="Item Name" value="${item.name}" required>
            <input type="number" name="li-amount" placeholder="0.00" step="0.01" value="${item.amount}" required class="li-amount-input">
            <button type="button" class="btn-icon remove-li-btn" title="Remove Item">🗑️</button>
          </div>
        `;
      };

      const renderSubcategoryCard = (sub = { name: '', lineItems: [] }, availableSubs = []) => {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'budget-subcategory-card';
        
        let subSelectHtml = `
          <div class="select-wrapper">
            <input type="text" name="sub-name" class="sub-name-input" value="${sub.name}" required placeholder="Subcategory Name">
          </div>
        `;
        if (availableSubs && availableSubs.length > 0) {
            subSelectHtml = `
              <div class="select-wrapper">
                <select name="sub-name" class="sub-name-input" required>
                  <option value="" disabled ${!sub.name ? 'selected' : ''}>Select Subcategory...</option>
                  ${availableSubs.map(s => `<option value="${s.name}" ${sub.name === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
                <div class="select-arrow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </div>
              </div>
            `;
        }

        tempDiv.innerHTML = `
          <div class="subcategory-card-header">
            ${subSelectHtml}
            <input type="number" name="sub-amount" class="sub-name-input sub-amount-input" step="0.01" value="${sub.amount || 0}" ${(sub.lineItems && sub.lineItems.length > 0) ? 'readonly' : ''} placeholder="0.00">
            <button type="button" class="btn-icon remove-subcategory-btn">🗑️</button>
          </div>
          <div class="subcategory-line-items">
             ${(sub.lineItems || []).map(li => renderLineItemRow(li)).join('')}
             <button type="button" class="btn secondary btn-sm add-line-item-btn">+ Add Line Item</button>
          </div>
        `;

        const subAmtInput = tempDiv.querySelector('input[name="sub-amount"]');
        subAmtInput.addEventListener('input', calculateTotal);

        // Attach listeners to this card
        tempDiv.querySelector('.remove-subcategory-btn').addEventListener('click', () => {
          tempDiv.remove();
          calculateTotal();
        });

        const lineItemsContainer = tempDiv.querySelector('.subcategory-line-items');
        const addLiBtn = tempDiv.querySelector('.add-line-item-btn');
        
        addLiBtn.addEventListener('click', () => {
             addLiBtn.insertAdjacentHTML('beforebegin', renderLineItemRow());
             const newRow = addLiBtn.previousElementSibling;
             newRow.querySelector('.remove-li-btn').addEventListener('click', () => {
               newRow.remove();
               calculateTotal();
             });
             newRow.querySelector('.li-amount-input').addEventListener('input', calculateTotal);
             calculateTotal();
        });

        // Existing rows listeners
        tempDiv.querySelectorAll('.line-item-row').forEach(row => {
           row.querySelector('.remove-li-btn').addEventListener('click', () => {
             row.remove();
             calculateTotal();
           });
           row.querySelector('.li-amount-input').addEventListener('input', calculateTotal);
        });

        return tempDiv;
      };

      addSubBtn.addEventListener('click', () => {
        // Find current category's available subcategories (this is a hack since we don't have scope of categories array easily)
        const selectedCatName = categorySelect.value;
        const catOption = Array.from(categorySelect.options).find(o => o.value === selectedCatName);
        let availableSubs = [];
        try {
           const catDataStr = catOption.getAttribute('data-subs');
           if (catDataStr) availableSubs = JSON.parse(catDataStr);
        } catch(e) {}
        
        const card = renderSubcategoryCard({name: '', lineItems: []}, availableSubs);
        subcategoriesContainer.appendChild(card);
        calculateTotal();
      });

      // Attach to existing setup
      Array.from(subcategoriesContainer.children).forEach(card => {
         card.querySelector('.remove-subcategory-btn').addEventListener('click', () => {
           card.remove();
           calculateTotal();
         });
         card.querySelector('input[name="sub-amount"]').addEventListener('input', calculateTotal);
         const addLiBtn = card.querySelector('.add-line-item-btn');
         addLiBtn.addEventListener('click', () => {
             addLiBtn.insertAdjacentHTML('beforebegin', renderLineItemRow());
             const newRow = addLiBtn.previousElementSibling;
             newRow.querySelector('.remove-li-btn').addEventListener('click', () => {
               newRow.remove();
               calculateTotal();
             });
             newRow.querySelector('.li-amount-input').addEventListener('input', calculateTotal);
             calculateTotal();
         });
         card.querySelectorAll('.line-item-row').forEach(row => {
           row.querySelector('.remove-li-btn').addEventListener('click', () => {
             row.remove();
             calculateTotal();
           });
           row.querySelector('.li-amount-input').addEventListener('input', calculateTotal);
         });
      });
      calculateTotal();
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // Special handling for budget hierarchical structure
      if (type === 'budget') {
        const subCards = Array.from(modal.querySelectorAll('.budget-subcategory-card'));
        data.subcategories = subCards.map(card => {
          const subNameInput = card.querySelector('.sub-name-input[name="sub-name"]');
          const subName = subNameInput ? subNameInput.value : '';
          const subAmount = parseFloat(card.querySelector('input[name="sub-amount"]').value) || 0;
          const rowNodes = Array.from(card.querySelectorAll('.line-item-row'));
          const lineItems = rowNodes.map(row => ({
            name: row.querySelector('input[name="li-name"]').value,
            amount: parseFloat(row.querySelector('input[name="li-amount"]').value) || 0
          }));
          return { name: subName, amount: subAmount, lineItems };
        });
        
        // Remove legacy flat lineItems to switch fully to subcategories struct
        delete data.lineItems;

        data.allocated = parseFloat(data.allocated) || 0;
        data.month = parseInt(data.month);
        data.year = parseInt(data.year);
      }

      onSubmit(data);
      modal.remove();
    };

    form.addEventListener('submit', handleSubmit);

    // Handle icon selection
    modal.querySelectorAll('.icon-option').forEach(opt => {
      opt.addEventListener('click', () => {
        modal.querySelector('.icon-option.selected')?.classList.remove('selected');
        opt.classList.add('selected');
        const iconInput = modal.querySelector('.icon-input');
        if (iconInput) iconInput.value = opt.dataset.icon;
      });
    });

    modal.querySelector('.cancel-btn').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modal.remove();
    });
  },

  clearModals() {
    document.querySelector('#entity-modal')?.remove();
  }
};
