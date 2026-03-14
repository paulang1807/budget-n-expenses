import { stripIcon } from '../utils.js';

export const TransactionForm = {
  renderCustomSelect(id, name, items, selectedValue, placeholder = 'Select...', iconType = '💰') {
    const selectedItem = items.find(item => (item.id === selectedValue || item.name === selectedValue));
    const initialIcon = selectedItem ? (selectedItem.icon || iconType) : (items.length > 0 && !placeholder ? (items[0].icon || iconType) : iconType);
    const initialText = selectedItem ? selectedItem.name : (placeholder || (items.length > 0 ? items[0].name : 'Select...'));
    const initialValue = selectedItem ? (selectedItem.id || selectedItem.name) : (items.length > 0 && !placeholder ? (items[0].id || items[0].name) : (selectedValue || ''));

    return `
      <div class="custom-select" id="${id}-wrapper" data-name="${name}">
        <input type="hidden" name="${name}" value="${initialValue}" id="${id}-input">
        <div class="custom-select-trigger" id="${id}-trigger">
          <div class="trigger-icon">${initialIcon}</div>
          <span class="trigger-text">${initialText}</span>
          <div class="trigger-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </div>
        </div>
        <div class="custom-select-options">
          ${(placeholder ? `<div class="custom-option" data-value="" data-icon="${iconType}">
            <div class="option-icon">${iconType}</div>
            <span>${placeholder}</span>
          </div>` : '')}
          ${items.map(item => {
      const val = item.id || item.name;
      const isSelected = val === selectedValue;
      const icon = item.icon || iconType;
      return `
              <div class="custom-option ${isSelected ? 'selected' : ''}" data-value="${val}" data-icon='${icon.replace(/'/g, "&apos;")}'>
                <div class="option-icon">${icon}</div>
                <span>${item.name}</span>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;
  },

  render(accounts, categories, retailers, initialData = null) {
    const isEdit = initialData && initialData.id && !initialData.isCopy;
    const data = initialData || {};

    return `
      <div id="tx-form-modal" class="modal">
        <div class="modal-content transaction-form-modal">
          <header class="modal-header">
            <h3>${isEdit ? 'Edit Transaction' : (data.isCopy ? 'Copy Transaction' : 'Add Transaction')}</h3>
            <button type="button" id="close-tx-form-top" class="close-btn">&times;</button>
          </header>
          
          <form id="tx-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            
            <section class="form-section basics-section">
              <div class="section-header">Basics</div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Type</label>
                  <select id="tx-type" name="type">
                    <option value="expense" ${data.type === 'expense' ? 'selected' : ''}>Expense</option>
                    <option value="income" ${data.type === 'income' ? 'selected' : ''}>Income</option>
                    <option value="transfer" ${data.type === 'transfer' ? 'selected' : ''}>Transfer</option>
                  </select>
                </div>
                <div class="form-group" style="position: relative; z-index: 10;">
                  <label>Date</label>
                  <input type="date" name="date" value="${data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                </div>
              </div>
            </section>

            <section class="form-section categorization-section">
              <div class="section-header">Accounts & Categorization</div>
              
              <div id="standard-fields" class="form-grid" style="display: ${data.type === 'transfer' ? 'none' : 'grid'};">
                <div class="form-group">
                  <label>Account <button type="button" class="quick-add-btn" data-type="account" title="Add Account">+</button></label>
                  ${this.renderCustomSelect('tx-account-select', 'accountId', accounts, data.accountId, '', '💰')}
                </div>
                <div class="form-group">
                  <label>Retailer <button type="button" class="quick-add-btn" data-type="retailer" title="Add Retailer">+</button></label>
                  ${this.renderCustomSelect('tx-retailer-select', 'retailer', retailers, data.retailer, 'None', '🏪')}
                </div>
                <div class="form-group">
                  <label>Category <button type="button" class="quick-add-btn" data-type="category" title="Add Category">+</button></label>
                  ${this.renderCustomSelect('tx-category-select', 'category', categories.filter(c => c.type === (data.type || 'expense')), data.category, 'None', '📁')}
                </div>
                <div class="form-group" id="subcategory-group">
                  <label>Subcategory</label>
                  ${(() => {
        const cat = categories.find(c => (c.id === data.category || c.name === data.category));
        const subItems = cat && cat.subcategories ? cat.subcategories : [];
        return this.renderCustomSelect('tx-subcategory-select', 'subcategory', subItems, data.subcategory, 'None', '🔹');
      })()}
                </div>
              </div>

              <div id="transfer-fields" class="form-grid" style="display: ${data.type === 'transfer' ? 'grid' : 'none'};">
                <div class="form-group">
                  <label>From Account</label>
                  ${this.renderCustomSelect('tx-from-account-select', 'fromAccountId', accounts, data.fromAccountId, '', '💰')}
                </div>
                <div class="form-group">
                  <label>To Account</label>
                  ${this.renderCustomSelect('tx-to-account-select', 'toAccountId', accounts, data.toAccountId, '', '💰')}
                </div>
              </div>
            </section>

            <section class="form-section amount-details-section">
              <div class="section-header">Amount & Details</div>
              <div class="form-grid">
                <div class="form-group">
                  <label>Price</label>
                  <div class="input-with-icon">
                    <span class="currency-symbol">$</span>
                    <input type="number" id="tx-price" name="price" step="0.01" placeholder="0.00" value="${data.price || ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label>Quantity</label>
                  <input type="number" id="tx-quantity" name="quantity" placeholder="1" value="${data.quantity || 1}">
                </div>
                <div class="form-group full-width highlighted-amount">
                  <label>Total Amount</label>
                  <div class="input-with-icon large">
                    <span class="currency-symbol">$</span>
                    <input type="number" id="tx-amount" name="amount" step="0.01" required placeholder="0.00" value="${data.amount || ''}">
                  </div>
                </div>
              </div>
              <div class="form-group full-width" style="margin-top: 1rem;">
                <label>Description (Optional)</label>
                <input type="text" name="description" placeholder="What was this for?" value="${data.description || ''}">
              </div>
            </section>

            <div class="modal-actions">
              <button type="button" id="close-tx-form" class="btn secondary">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update Transaction' : 'Save Transaction'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  setup(onSubmit, categories = []) {
    const form = document.getElementById('tx-form');
    const typeSelect = document.getElementById('tx-type');
    const standardFields = document.getElementById('standard-fields');
    const transferFields = document.getElementById('transfer-fields');
    const priceInput = document.getElementById('tx-price');
    const qtyInput = document.getElementById('tx-quantity');
    const amountInput = document.getElementById('tx-amount');

    // Custom Select Logic
    const initCustomSelects = (container) => {
      container.querySelectorAll('.custom-select').forEach(wrapper => {
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const options = wrapper.querySelector('.custom-select-options');
        const input = wrapper.querySelector('input[type="hidden"]');
        const triggerIcon = wrapper.querySelector('.trigger-icon');
        const triggerText = wrapper.querySelector('.trigger-text');

        trigger.onclick = (e) => {
          e.stopPropagation();
          const isActive = wrapper.classList.contains('active');
          document.querySelectorAll('.custom-select.active').forEach(s => s.classList.remove('active'));
          if (!isActive) wrapper.classList.add('active');
        };

        wrapper.querySelectorAll('.custom-option').forEach(opt => {
          opt.onclick = (e) => {
            e.stopPropagation();
            const val = opt.dataset.value;
            const icon = opt.dataset.icon;
            const text = opt.querySelector('span').innerText;

            input.value = val;
            triggerIcon.innerHTML = icon;
            triggerText.innerText = text;

            wrapper.classList.remove('active');
            wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');

            // Dispatch event for specialized logic
            wrapper.dispatchEvent(new CustomEvent('change', { detail: { value: val } }));
          };
        });
      });
    };

    initCustomSelects(form);

    // Global click listener to close selects
    const closeAllSelects = () => {
      document.querySelectorAll('.custom-select.active').forEach(s => s.classList.remove('active'));
    };
    document.addEventListener('click', closeAllSelects);

    const updateView = (type) => {
      if (type === 'transfer') {
        standardFields.style.display = 'none';
        transferFields.style.display = 'grid';
        transferFields.querySelectorAll('select, input').forEach(el => el.disabled = false);
      } else {
        standardFields.style.display = 'grid';
        transferFields.style.display = 'none';
        standardFields.querySelectorAll('select, input').forEach(el => el.disabled = false);
        transferFields.querySelectorAll('select, input').forEach(el => el.disabled = true);
      }
    };

    const updateCategoriesByType = (type) => {
      if (type === 'transfer') return;
      const filtered = categories.filter(c => c.type === type);
      this.updateDropdown('category', filtered);
      // Reset subcategory when category list changes
      this.updateDropdown('subcategory', []);
    };

    typeSelect.addEventListener('change', (e) => {
      updateView(e.target.value);
      updateCategoriesByType(e.target.value);
    });
    updateView(typeSelect.value);

    const categoryWrapper = document.getElementById('tx-category-select-wrapper');
    const subcategoryWrapper = document.getElementById('tx-subcategory-select-wrapper');

    categoryWrapper?.addEventListener('change', (e) => {
      const catValue = e.detail.value;
      const cat = categories.find(c => (c.id === catValue || c.name === catValue));
      const subs = cat && cat.subcategories ? cat.subcategories : [];
      this.updateDropdown('subcategory', subs);
    });

    const calculateAmount = () => {
      const price = parseFloat(priceInput.value) || 0;
      const qty = parseFloat(qtyInput.value) || 1;
      if (price > 0) {
        amountInput.value = (price * qty).toFixed(2);
        amountInput.classList.add('calculated');
        setTimeout(() => amountInput.classList.remove('calculated'), 500);
      }
    };

    priceInput.addEventListener('input', calculateAmount);
    qtyInput.addEventListener('input', calculateAmount);

    form.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.closest('.quick-add-btn').dataset.type;
        window.dispatchEvent(new CustomEvent('open-entity-modal', { detail: { type } }));
      });
    });

    const onFormSubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      if (data.type === 'transfer') {
        delete data.accountId;
      } else {
        delete data.fromAccountId;
        delete data.toAccountId;
      }

      onSubmit(data);
      document.removeEventListener('click', closeAllSelects);
      document.getElementById('tx-form-modal').remove();
    };

    form.addEventListener('submit', onFormSubmit);

    [document.getElementById('close-tx-form'), document.getElementById('close-tx-form-top')].forEach(btn => {
      btn?.addEventListener('click', () => {
        document.removeEventListener('click', closeAllSelects);
        document.getElementById('tx-form-modal').remove();
      });
    });
  },

  updateDropdown(type, items) {
    const selects = {
      account: ['tx-account-select', 'tx-from-account-select', 'tx-to-account-select'],
      category: ['tx-category-select'],
      subcategory: ['tx-subcategory-select'],
      retailer: ['tx-retailer-select']
    };

    const ids = selects[type];
    if (!ids) return;

    ids.forEach(id => {
      const wrapper = document.getElementById(`${id}-wrapper`);
      if (!wrapper) return;

      const input = wrapper.querySelector('input[type="hidden"]');
      const triggerIcon = wrapper.querySelector('.trigger-icon');
      const triggerText = wrapper.querySelector('.trigger-text');
      const optionsContainer = wrapper.querySelector('.custom-select-options');

      const currentValue = input.value;
      let placeholder = (type === 'retailer' || type === 'category' || type === 'subcategory') ? 'None' : '';
      let iconType = type === 'account' ? '💰' : (type === 'category' ? '📁' : (type === 'subcategory' ? '🔹' : '🏪'));

      let html = '';
      if (placeholder) {
        html += `
          <div class="custom-option" data-value="" data-icon="${iconType}">
            <div class="option-icon">${iconType}</div>
            <span>${placeholder}</span>
          </div>
        `;
      }

      html += items.map(item => {
        const val = item.id || item.name;
        const isSelected = val === currentValue;
        const icon = item.icon || iconType;
        return `
          <div class="custom-option ${isSelected ? 'selected' : ''}" data-value="${val}" data-icon='${icon.replace(/'/g, "&apos;")}'>
            <div class="option-icon">${icon}</div>
            <span>${item.name}</span>
          </div>
        `;
      }).join('');

      optionsContainer.innerHTML = html;

      // Update trigger if current value is no longer available or if it's new
      const currentItem = items.find(item => (item.id === currentValue || item.name === currentValue));
      if (currentItem) {
        triggerIcon.innerHTML = currentItem.icon || iconType;
        triggerText.innerText = currentItem.name;
      } else {
        // Current value is no longer valid or was empty
        if (placeholder) {
          input.value = '';
          triggerIcon.innerHTML = iconType;
          triggerText.innerText = placeholder;
        } else if (items.length > 0) {
          // No placeholder (like Accounts), auto-select first
          const first = items[0];
          input.value = first.id || first.name;
          triggerIcon.innerHTML = first.icon || iconType;
          triggerText.innerText = first.name;
        }
      }

      // Re-attach option listeners
      optionsContainer.querySelectorAll('.custom-option').forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const val = opt.dataset.value;
          const icon = opt.dataset.icon;
          const text = opt.querySelector('span').innerText;

          input.value = val;
          triggerIcon.innerHTML = icon;
          triggerText.innerText = text;

          wrapper.classList.remove('active');
          optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          wrapper.dispatchEvent(new CustomEvent('change', { detail: { value: val } }));
        };
      });
    });
  }
};

