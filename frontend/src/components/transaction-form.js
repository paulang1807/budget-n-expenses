export const TransactionForm = {
  render(accounts, categories, retailers, initialData = null) {
    const isEdit = initialData && initialData.id && !initialData.isCopy;
    const data = initialData || {};

    return `
      <div id="tx-form-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Transaction' : (data.isCopy ? 'Copy Transaction' : 'Add Transaction')}</h3>
          <form id="tx-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Type</label>
              <select id="tx-type" name="type">
                <option value="expense" ${data.type === 'expense' ? 'selected' : ''}>Expense</option>
                <option value="income" ${data.type === 'income' ? 'selected' : ''}>Income</option>
                <option value="transfer" ${data.type === 'transfer' ? 'selected' : ''}>Transfer</option>
              </select>
            </div>

            <div id="standard-fields" style="display: ${data.type === 'transfer' ? 'none' : 'block'};">
              <div class="form-group">
                <label>Account <button type="button" class="quick-add-btn" data-type="account">+</button></label>
                <select name="accountId" id="tx-account-select">
                  ${accounts.map(a => `<option value="${a.id}" ${data.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Category <button type="button" class="quick-add-btn" data-type="category">+</button></label>
                <select name="category" id="tx-category-select">
                  ${categories.map(c => `<option value="${c.name}" ${data.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" id="subcategory-group">
                <label>Subcategory</label>
                <select name="subcategory" id="tx-subcategory-select">
                  <option value="">None</option>
                  ${(() => {
        const cat = categories.find(c => c.name === data.category);
        if (cat && cat.subcategories) {
          return cat.subcategories.map(s => `<option value="${s.name}" ${data.subcategory === s.name ? 'selected' : ''}>${s.name}</option>`).join('');
        }
        return '';
      })()}
                </select>
              </div>
              <div class="form-group">
                <label>Retailer <button type="button" class="quick-add-btn" data-type="retailer">+</button></label>
                <select name="retailer" id="tx-retailer-select">
                  <option value="">None</option>
                  ${retailers.map(r => `<option value="${r.name}" ${data.retailer === r.name ? 'selected' : ''}>${r.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div id="transfer-fields" style="display: ${data.type === 'transfer' ? 'block' : 'none'};">
              <div class="form-group">
                <label>From Account</label>
                <select name="fromAccountId">
                  ${accounts.map(a => `<option value="${a.id}" ${data.fromAccountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>To Account</label>
                <select name="toAccountId">
                  ${accounts.map(a => `<option value="${a.id}" ${data.toAccountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Price</label>
                <input type="number" id="tx-price" name="price" step="0.01" value="${data.price || ''}">
              </div>
              <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="tx-quantity" name="quantity" value="${data.quantity || 1}">
              </div>
            </div>

            <div class="form-group">
              <label>Amount</label>
              <input type="number" id="tx-amount" name="amount" step="0.01" required value="${data.amount || ''}">
            </div>

            <div class="form-group">
              <label>Description</label>
              <input type="text" name="description" required value="${data.description || ''}">
            </div>

            <div class="form-group">
              <label>Date</label>
              <input type="date" name="date" value="${data.date ? data.date.split('T')[0] : new Date().toISOString().split('T')[0]}" required>
            </div>

            <div class="modal-actions">
              <button type="button" id="close-tx-form" class="btn">Cancel</button>
              <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'}</button>
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

    typeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'transfer') {
        standardFields.style.display = 'none';
        transferFields.style.display = 'block';
      } else {
        standardFields.style.display = 'block';
        transferFields.style.display = 'none';
      }
    });

    const categorySelect = document.getElementById('tx-category-select');
    const subcategorySelect = document.getElementById('tx-subcategory-select');

    categorySelect.addEventListener('change', (e) => {
      const catName = e.target.value;
      const cat = categories.find(c => c.name === catName);
      let html = '<option value="">None</option>';
      if (cat && cat.subcategories) {
        html += cat.subcategories.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
      }
      subcategorySelect.innerHTML = html;
    });

    const calculateAmount = () => {
      const price = parseFloat(priceInput.value) || 0;
      const qty = parseFloat(qtyInput.value) || 1;
      if (price > 0) amountInput.value = (price * qty).toFixed(2);
    };

    priceInput.addEventListener('input', calculateAmount);
    qtyInput.addEventListener('input', calculateAmount);

    // Handle quick-add buttons
    form.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        window.dispatchEvent(new CustomEvent('open-entity-modal', { detail: { type } }));
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      onSubmit(data);
      document.getElementById('tx-form-modal').remove();
    });

    document.getElementById('close-tx-form').addEventListener('click', () => {
      document.getElementById('tx-form-modal').remove();
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

      if (type === 'retailer') html = '<option value="">None</option>';

      html += items.map(item => {
        const val = type === 'account' ? item.id : item.name;
        return `<option value="${val}">${item.name}</option>`;
      }).join('');

      select.innerHTML = html;
      select.value = currentValue; // Try to preserve selection if possible
    });
  }
};
