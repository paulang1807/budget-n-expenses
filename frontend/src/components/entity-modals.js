export const EntityModals = {
  renderIconSelector(icons, selectedIcon) {
    return `
      <div class="icon-selector">
        <label>Select Icon</label>
        <div class="icon-grid">
          ${icons.map(icon => `
            <div class="icon-option ${icon.emoji === selectedIcon ? 'selected' : ''}" data-icon="${icon.emoji}">
              ${icon.emoji}
            </div>
          `).join('')}
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
    return `
      <div id="entity-modal" class="modal">
        <div class="modal-content">
          <h3>${isEdit ? 'Edit Budget' : 'Add New Budget'}</h3>
          <form id="entity-form">
            ${isEdit ? `<input type="hidden" name="id" value="${data.id}">` : ''}
            <div class="form-group">
              <label>Category</label>
              <select name="category">
                ${categories.map(c => `<option value="${c.name}" ${data.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Allocated Amount</label>
              <input type="number" name="allocated" step="0.01" required value="${data.allocated || ''}">
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
              <input type="text" name="name" required placeholder="e.g. Apple" value="${data.name || ''}">
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

  clearModals() {
    document.querySelector('#entity-modal')?.remove();
  },

  setup(onSubmit) {
    const modal = document.querySelector('#entity-modal');
    const form = modal?.querySelector('#entity-form');

    if (!form) {
      console.error('Entity form not found');
      return;
    }

    const handleSubmit = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Entity form submitted');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
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
  }
};
