import { stripIcon } from '../utils.js';

export const TransactionForm = {
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
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" name="date" value="${data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
                </div>
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <input type="text" name="description" placeholder="What was this for?" required value="${data.description || ''}">
              </div>
            </section>

            <section class="form-section categorization-section">
              <div class="section-header">Accounts & Categorization</div>
              
              <div id="standard-fields" class="form-grid" style="display: ${data.type === 'transfer' ? 'none' : 'grid'};">
                <div class="form-group">
                  <label>Account <button type="button" class="quick-add-btn" data-type="account" title="Add Account">+</button></label>
                  <select name="accountId" id="tx-account-select" ${data.type === 'transfer' ? 'disabled' : ''}>
                    ${accounts.map(a => `<option value="${a.id}" ${data.accountId === a.id ? 'selected' : ''}>${a.icon || '💰'} ${a.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Retailer <button type="button" class="quick-add-btn" data-type="retailer" title="Add Retailer">+</button></label>
                  <select name="retailer" id="tx-retailer-select">
                    <option value="">None</option>
                    ${retailers.map(r => `<option value="${r.name}" ${data.retailer === r.name ? 'selected' : ''}>${r.icon || '🏪'} ${r.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>Category <button type="button" class="quick-add-btn" data-type="category" title="Add Category">+</button></label>
                  <select name="category" id="tx-category-select">
                    <option value="">None</option>
                    ${categories.map(c => `<option value="${c.name}" ${data.category === c.name ? 'selected' : ''}>${c.icon || '📁'} ${c.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group" id="subcategory-group">
                  <label>Subcategory</label>
                  <select name="subcategory" id="tx-subcategory-select" ${data.type === 'transfer' ? 'disabled' : ''}>
                    <option value="">None</option>
                    ${(() => {
        const cat = categories.find(c => c.name === data.category);
        if (cat && cat.subcategories) {
          return cat.subcategories.map(s => `<option value="${s.name}" ${data.subcategory === s.name ? 'selected' : ''}>${s.icon || '🔹'} ${s.name}</option>`).join('');
        }
        return '';
      })()}
                  </select>
                </div>
              </div>

              <div id="transfer-fields" class="form-grid" style="display: ${data.type === 'transfer' ? 'grid' : 'none'};">
                <div class="form-group">
                  <label>From Account</label>
                  <select name="fromAccountId" ${data.type === 'transfer' ? '' : 'disabled'}>
                    ${accounts.map(a => `<option value="${a.id}" ${data.fromAccountId === a.id ? 'selected' : ''}>${a.icon || '💰'} ${a.name}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label>To Account</label>
                  <select name="toAccountId" ${data.type === 'transfer' ? '' : 'disabled'}>
                    ${accounts.map(a => `<option value="${a.id}" ${data.toAccountId === a.id ? 'selected' : ''}>${a.icon || '💰'} ${a.name}</option>`).join('')}
                  </select>
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

    typeSelect.addEventListener('change', (e) => updateView(e.target.value));
    updateView(typeSelect.value);

    const categorySelect = document.getElementById('tx-category-select');
    const subcategorySelect = document.getElementById('tx-subcategory-select');

    categorySelect.addEventListener('change', (e) => {
      const catName = stripIcon(e.target.value);
      const cat = categories.find(c => c.name === catName);
      let html = '<option value="">None</option>';
      if (cat && cat.subcategories) {
        html += cat.subcategories.map(s => `<option value="${s.name}">${s.icon || '🔹'} ${s.name}</option>`).join('');
      }
      subcategorySelect.innerHTML = html;
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

    form.addEventListener('submit', (e) => {
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
      document.getElementById('tx-form-modal').remove();
    });

    [document.getElementById('close-tx-form'), document.getElementById('close-tx-form-top')].forEach(btn => {
      btn?.addEventListener('click', () => {
        document.getElementById('tx-form-modal').remove();
      });
    });
  },

  updateDropdown(type, items) {
    const selects = {
      account: ['tx-account-select', 'select[name="fromAccountId"]', 'select[name="toAccountId"]'],
      category: ['tx-category-select'],
      retailer: ['tx-retailer-select']
    };

    const ids = selects[type];
    if (!ids) return;

    ids.forEach(id => {
      const select = id.startsWith('select') ? document.querySelector(id) : document.getElementById(id);
      if (!select) return;

      const currentValue = select.value;
      let html = '';

      if (type === 'retailer' || type === 'category') html = '<option value="">None</option>';

      html += items.map(item => {
        const val = type === 'account' ? item.id : item.name;
        const icon = item.icon || (type === 'account' ? '💰' : (type === 'category' ? '📁' : '🏪'));
        return `<option value="${val}">${icon} ${item.name}</option>`;
      }).join('');

      select.innerHTML = html;
      select.value = currentValue;
    });
  }
};

