export const Settings = {
  activeTab: 'accounts',
  render(container, state) {
    container.innerHTML = `
      <div class="settings-view">
        <div class="settings-tabs">
          <button class="s-tab ${this.activeTab === 'accounts' ? 'active' : ''}" data-stab="accounts">Accounts</button>
          <button class="s-tab ${this.activeTab === 'categories' ? 'active' : ''}" data-stab="categories">Categories</button>
          <button class="s-tab ${this.activeTab === 'retailers' ? 'active' : ''}" data-stab="retailers">Retailers</button>
          <button class="s-tab ${this.activeTab === 'export' ? 'active' : ''}" data-stab="export">Export/Import</button>
        </div>
        <div id="settings-tab-content" class="settings-content">
          <!-- Sub-tab content here -->
        </div>
      </div>
    `;
    this.renderSubTab(this.activeTab, state);
    this.setupListeners(state);
  },

  renderSubTab(tab, state) {
    this.activeTab = tab;
    const content = document.getElementById('settings-tab-content');
    if (!content) return;

    if (tab === 'accounts') {
      content.innerHTML = `
        <div class="settings-list">
          ${state.accounts.map(a => `
            <div class="settings-item">
              <div class="item-info">
                <span class="item-icon">${a.icon}</span>
                <span class="item-name">${a.name} (${a.type})</span>
                <span class="item-balance">${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(a.balance)}</span>
              </div>
              <div class="item-actions">
                <button class="btn-icon edit-entity-btn" data-type="account" data-id="${a.id}" title="Edit">✏️</button>
                <button class="btn-icon delete-entity-btn" data-type="account" data-id="${a.id}" title="Delete">🗑️</button>
              </div>
            </div>
          `).join('')}
          <button class="btn primary add-entity-btn" data-type="account">Add Account</button>
        </div>
      `;
    } else if (tab === 'categories') {
      content.innerHTML = `
        <div class="settings-list">
          ${state.categories.map(c => `
            <div class="settings-category card">
              <div class="category-header">
                <strong>${c.icon} ${c.name}</strong>
                <div class="item-actions">
                  <button class="btn-icon edit-entity-btn" data-type="category" data-id="${c.id}" title="Edit Category">✏️</button>
                  <button class="btn-icon delete-entity-btn" data-type="category" data-id="${c.id}" title="Delete Category">🗑️</button>
                  <button class="btn-icon add-sub-btn" data-catid="${c.id}" title="Add Subcategory">➕</button>
                </div>
              </div>
              <div class="sub-list-container">
                <div class="sub-list">
                  ${(c.subcategories && c.subcategories.length > 0)
          ? c.subcategories.map(s => `
                        <div class="sub-item">
                          <span>${s.icon} ${s.name}</span>
                          <div class="sub-actions">
                            <button class="btn-icon edit-sub-btn" data-catid="${c.id}" data-id="${s.id}" title="Edit">✏️</button>
                            <button class="btn-icon delete-sub-btn" data-catid="${c.id}" data-id="${s.id}" title="Delete">🗑️</button>
                          </div>
                        </div>
                      `).join('')
          : '<span class="empty-msg">No subcategories</span>'}
                </div>
              </div>
            </div>
          `).join('')}
          <button class="btn primary add-entity-btn" data-type="category">Add Category</button>
        </div>
      `;
    } else if (tab === 'retailers') {
      content.innerHTML = `
        <div class="settings-list">
          <div class="retailer-grid">
            ${state.retailers.map(r => `
              <div class="settings-item">
                <div class="item-info">
                  <span class="item-icon">${r.icon || '🏪'}</span>
                  <span class="item-name">${r.name}</span>
                </div>
                <div class="item-actions">
                  <button class="btn-icon edit-entity-btn" data-type="retailer" data-id="${r.id}" title="Edit">✏️</button>
                  <button class="btn-icon delete-entity-btn" data-type="retailer" data-id="${r.id}" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
          <button class="btn primary add-entity-btn" data-type="retailer">Add Retailer</button>
        </div>
      `;
    } else if (tab === 'export') {
      content.innerHTML = `
        <div class="export-actions">
          <button id="export-json" class="btn">Export as JSON</button>
          <button id="export-csv" class="btn">Export as CSV</button>
        </div>
      `;
      document.getElementById('export-json').onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "budget_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      };
    }
  },

  setupListeners(state) {
    const tabsContainer = document.querySelector('.settings-tabs');
    if (tabsContainer && !tabsContainer.dataset.listener) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.s-tab');
        if (btn) {
          document.querySelector('.s-tab.active')?.classList.remove('active');
          btn.classList.add('active');
          this.renderSubTab(btn.dataset.stab, state);
        }
      });
      tabsContainer.dataset.listener = "true";
    }
  }
};
