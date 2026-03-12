import { buildExportData } from './export-import-utils.js';

export const Settings = {
  activeTab: 'accounts',
  render(container, state) {
    container.innerHTML = `
      <div class="settings-view">
        <div class="settings-tabs">
          <button class="s-tab ${this.activeTab === 'accounts' ? 'active' : ''}" data-stab="accounts">Accounts</button>
          <button class="s-tab ${this.activeTab === 'categories' ? 'active' : ''}" data-stab="categories">Categories</button>
          <button class="s-tab ${this.activeTab === 'retailers' ? 'active' : ''}" data-stab="retailers">Retailers</button>
          <button class="s-tab ${this.activeTab === 'icons' ? 'active' : ''}" data-stab="icons">Icons</button>
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
        </div>
      `;
    } else if (tab === 'categories') {
      content.innerHTML = `
        <div class="settings-list">
          ${state.categories.map(c => `
            <div class="settings-category card">
              <div class="category-header">
                <div class="category-info">
                  <strong>${c.icon} ${c.name}</strong>
                  <span class="category-type-badge ${c.type}">${c.type || 'expense'}</span>
                </div>
                <div class="item-actions">
                  <button class="btn-icon edit-entity-btn" data-type="category" data-id="${c.id}" title="Edit Category">✏️</button>
                  <button class="btn-icon delete-entity-btn" data-type="category" data-id="${c.id}" title="Delete Category">🗑️</button>
                  <button class="btn-icon add-sub-btn" data-catid="${c.id}" title="Add Subcategory">➕</button>
                </div>
              </div>
              ${(c.subcategories && c.subcategories.length > 0) ? `
                <div class="sub-list-container">
                  <div class="sub-list">
                    ${c.subcategories.map(s => `
                      <div class="sub-item">
                        <span>${s.icon} ${s.name}</span>
                        <div class="sub-actions">
                          <button class="btn-icon edit-sub-btn" data-catid="${c.id}" data-id="${s.id}" title="Edit">✏️</button>
                          <button class="btn-icon delete-sub-btn" data-catid="${c.id}" data-id="${s.id}" title="Delete">🗑️</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else if (tab === 'retailers') {
      content.innerHTML = `
        <div class="settings-list">
          <div class="retailer-grid">
            ${state.retailers.map(r => `
              <div class="retailer-card">
                <div class="retailer-info">
                  <span class="retailer-icon">${r.icon || '🏪'}</span>
                  <span class="retailer-name">${r.name}</span>
                </div>
                <div class="retailer-actions">
                  <button class="btn-icon edit-entity-btn" data-type="retailer" data-id="${r.id}" title="Edit">✏️</button>
                  <button class="btn-icon delete-entity-btn" data-type="retailer" data-id="${r.id}" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (tab === 'icons') {
      content.innerHTML = `
          <div class="settings-list">
            <div class="icon-grid-manager">
              ${state.icons.map(icon => `
                <div class="icon-item-card">
                  <span class="managed-icon">${icon.emoji}</span>
                  <button class="btn-icon delete-icon-btn" data-id="${icon.id}" title="Delete Icon">🗑️</button>
                </div>
              `).join('')}
              <div class="add-icon-card">
                <input type="text" id="new-icon-input" placeholder="✨" maxlength="2">
                <button id="add-icon-btn" class="btn primary">Add</button>
              </div>
            </div>
          </div>
        `;
      document.getElementById('add-icon-btn').onclick = async () => {
        const emoji = document.getElementById('new-icon-input').value.trim();
        if (emoji) {
          window.dispatchEvent(new CustomEvent('managed-icon-action', {
            detail: { action: 'add', data: { emoji } }
          }));
        }
      };
      content.querySelectorAll('.delete-icon-btn').forEach(btn => {
        btn.onclick = () => {
          window.dispatchEvent(new CustomEvent('managed-icon-action', {
            detail: { action: 'delete', id: btn.dataset.id }
          }));
        };
      });
    } else if (tab === 'export') {
      content.innerHTML = `
        <div class="export-import-container">
          <!-- TOGGLE CONTROL -->
          <div class="ei-toggle-container">
            <button class="ei-toggle-btn active" data-mode="export">Export</button>
            <button class="ei-toggle-btn" data-mode="import">Import</button>
          </div>

          <!-- EXPORT SECTION -->
          <div id="export-section" class="ei-section-wrapper">
            <div class="ei-section-card">
              <h3 class="ei-section-title">Export Data</h3>
              <p class="ei-section-desc">
                Select the data entities you want to export. Optionally set a date range for transactions.
              </p>
              
              <div class="form-group" style="margin-bottom: 2rem;">
                <label>Time Range (Transactions only)</label>
                <div class="form-row">
                  <input type="date" id="export-start-date" title="Start Date" class="ei-format-select" value="${state.filter?.startDate || ''}">
                  <input type="date" id="export-end-date" title="End Date" class="ei-format-select" value="${state.filter?.endDate || ''}">
                </div>
              </div>

              <div class="form-group">
                <label style="margin-bottom: 1rem; display: block;">Select Entities & Attributes</label>
                   
                   <!-- Transactions Accordion -->
                   <div class="ei-accordion" id="acc-transactions">
                     <div class="ei-accordion-header">
                       <span class="ei-entity-toggle">
                         <label class="switch">
                           <input type="checkbox" id="exp-cb-transactions" checked>
                           <span class="slider"></span>
                         </label>
                         Transactions
                       </span>
                       <span class="ei-collapse-icon">▼</span>
                     </div>
                     <div class="ei-accordion-content">
                       <div class="ei-attributes-grid" id="attrs-transactions">
                         ${['id', 'date', 'amount', 'description', 'type', 'category', 'subcategory', 'retailer', 'accountId'].map(attr =>
        `<label class="ei-attr-label"><input type="checkbox" class="attr-cb-transactions" value="${attr}" checked> ${attr}</label>`
      ).join('')}
                       </div>
                     </div>
                   </div>

                   <!-- Accounts Accordion -->
                   <div class="ei-accordion" id="acc-accounts">
                     <div class="ei-accordion-header">
                       <span class="ei-entity-toggle">
                         <label class="switch">
                           <input type="checkbox" id="exp-cb-accounts" checked>
                           <span class="slider"></span>
                         </label>
                         Accounts
                       </span>
                       <span class="ei-collapse-icon">▼</span>
                     </div>
                     <div class="ei-accordion-content">
                       <div class="ei-attributes-grid" id="attrs-accounts">
                         ${['id', 'name', 'type', 'balance', 'icon'].map(attr =>
        `<label class="ei-attr-label"><input type="checkbox" class="attr-cb-accounts" value="${attr}" checked> ${attr}</label>`
      ).join('')}
                       </div>
                     </div>
                   </div>

                   <!-- Categories Accordion -->
                   <div class="ei-accordion" id="acc-categories">
                     <div class="ei-accordion-header">
                       <span class="ei-entity-toggle">
                         <label class="switch">
                           <input type="checkbox" id="exp-cb-categories" checked>
                           <span class="slider"></span>
                         </label>
                         Categories
                       </span>
                       <span class="ei-collapse-icon">▼</span>
                     </div>
                     <div class="ei-accordion-content">
                       <div class="ei-attributes-grid" id="attrs-categories">
                         ${['id', 'name', 'type', 'icon', 'subcategories'].map(attr =>
        `<label class="ei-attr-label"><input type="checkbox" class="attr-cb-categories" value="${attr}" checked> ${attr}</label>`
      ).join('')}
                       </div>
                     </div>
                   </div>

                   <!-- Retailers Accordion -->
                   <div class="ei-accordion" id="acc-retailers">
                     <div class="ei-accordion-header">
                       <span class="ei-entity-toggle">
                         <label class="switch">
                           <input type="checkbox" id="exp-cb-retailers" checked>
                           <span class="slider"></span>
                         </label>
                         Retailers
                       </span>
                       <span class="ei-collapse-icon">▼</span>
                     </div>
                     <div class="ei-accordion-content">
                       <div class="ei-attributes-grid" id="attrs-retailers">
                         ${['id', 'name', 'icon'].map(attr =>
        `<label class="ei-attr-label"><input type="checkbox" class="attr-cb-retailers" value="${attr}" checked> ${attr}</label>`
      ).join('')}
                       </div>
                     </div>
                   </div>

                   <!-- Budgets Accordion -->
                   <div class="ei-accordion" id="acc-budgets">
                     <div class="ei-accordion-header">
                       <span class="ei-entity-toggle">
                         <label class="switch">
                           <input type="checkbox" id="exp-cb-budgets" checked>
                           <span class="slider"></span>
                         </label>
                         Budgets
                       </span>
                       <span class="ei-collapse-icon">▼</span>
                     </div>
                     <div class="ei-accordion-content">
                       <div class="ei-attributes-grid" id="attrs-budgets">
                         ${['id', 'category', 'allocated', 'spent', 'color'].map(attr =>
        `<label class="ei-attr-label"><input type="checkbox" class="attr-cb-budgets" value="${attr}" checked> ${attr}</label>`
      ).join('')}
                       </div>
                     </div>
                   </div>

              </div>

              <div class="form-group" style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem;">
                <label style="margin: 0;">Export Format</label>
                <select id="export-format" class="ei-format-select">
                  <option value="json">JSON (.json)</option>
                  <option value="csv">CSV (.csv)</option>
                </select>
              </div>

              <button id="do-export-btn" class="btn primary" style="width: 100%; margin-top: 1rem; padding: 0.75rem;">Export Data</button>
            </div>
          </div>

          <!-- IMPORT SECTION -->
          <div id="import-section" class="ei-section-wrapper hidden">
            <div class="ei-section-card">
              <h3 class="ei-section-title">Import Data</h3>
              <p class="ei-section-desc">
                Select a JSON file containing previously exported budget data. Incoming data will be securely merged with your existing records.
              </p>
              <div class="ei-file-upload">
                <input type="file" id="import-file" accept=".json,.csv">
                <label for="import-file" class="ei-file-label">
                  <span class="icon">📁</span>
                  <span>Choose File</span>
                </label>
                <div id="file-name-preview" class="ei-file-name">No file selected</div>
                <button id="do-import-btn" class="btn secondary" style="width: 100%; margin-top: 0.5rem;">Import File</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Setup Toggle Logic
      const toggleBtns = document.querySelectorAll('.ei-toggle-btn');
      const exportSec = document.getElementById('export-section');
      const importSec = document.getElementById('import-section');

      toggleBtns.forEach(btn => {
        btn.onclick = () => {
          const mode = btn.dataset.mode;
          toggleBtns.forEach(b => b.classList.toggle('active', b === btn));
          exportSec.classList.toggle('hidden', mode !== 'export');
          importSec.classList.toggle('hidden', mode !== 'import');
        };
      });

      // Setup Export UI

      // File Import Preview Logic
      const fileInput = document.getElementById('import-file');
      const fileNamePreview = document.getElementById('file-name-preview');
      if (fileInput && fileNamePreview) {
        fileInput.addEventListener('change', (e) => {
          const fileName = e.target.files[0]?.name || 'No file selected';
          fileNamePreview.textContent = fileName;
          fileNamePreview.style.color = e.target.files[0] ? 'var(--primary)' : 'var(--text-secondary)';
        });
      }

      // Accordion Toggle
      document.querySelectorAll('.ei-accordion-header').forEach(header => {
        header.addEventListener('click', (e) => {
          // Prevent toggling accordion when clicking the switch itself
          if (e.target.closest('.ei-entity-toggle')) return;
          const accordion = header.closest('.ei-accordion');
          accordion.classList.toggle('expanded');
        });
      });

      // Entity Switch Toggle
      const toggleAttrs = (entityId, accordionId) => {
        document.getElementById(entityId).addEventListener('change', (e) => {
          const checked = e.target.checked;
          const accordion = document.getElementById(accordionId);
          const content = accordion.querySelector('.ei-accordion-content');

          if (!checked) {
            accordion.classList.remove('expanded');
          }

          content.style.opacity = checked ? '1' : '0.5';
          content.style.pointerEvents = checked ? 'auto' : 'none';
          content.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
        });
      };

      toggleAttrs('exp-cb-transactions', 'acc-transactions');
      toggleAttrs('exp-cb-accounts', 'acc-accounts');
      toggleAttrs('exp-cb-categories', 'acc-categories');
      toggleAttrs('exp-cb-retailers', 'acc-retailers');
      toggleAttrs('exp-cb-budgets', 'acc-budgets');

      document.getElementById('do-export-btn').onclick = async () => {
        try {
          console.log('Export button clicked');
          const options = {
            startDate: document.getElementById('export-start-date').value,
            endDate: document.getElementById('export-end-date').value,
            format: document.getElementById('export-format').value,
            entities: {}
          };

          const entityNames = ['transactions', 'accounts', 'categories', 'retailers', 'budgets'];
          entityNames.forEach(entity => {
            const cb = document.getElementById(`exp-cb-${entity}`);
            if (!cb) {
              console.warn(`Checkbox for entity ${entity} not found`);
              return;
            }
            const selected = cb.checked;
            const attributes = Array.from(document.querySelectorAll(`.attr-cb-${entity}:checked`)).map(cb => cb.value);
            options.entities[entity] = { selected, attributes };
          });

          console.log('Export options:', options);
          const exportResult = buildExportData(state, options);
          console.log('Export data result:', exportResult);

          if (!exportResult || !exportResult.content) {
            console.error('Export failed: content is empty', exportResult);
            const msg = 'Failed to generate export data. Please ensure at least one entity is selected.';
            if (window.showAlert) await window.showAlert(msg);
            else alert(msg);
            return;
          }

          const blob = new Blob([exportResult.content], { type: `${exportResult.type};charset=utf-8` });
          const url = URL.createObjectURL(blob);
          const downloadAnchorNode = document.createElement('a');

          // Improved visibility for better browser compatibility
          downloadAnchorNode.style.position = 'fixed';
          downloadAnchorNode.style.top = '-100px';
          downloadAnchorNode.style.left = '-100px';
          downloadAnchorNode.style.opacity = '0';

          downloadAnchorNode.setAttribute("href", url);
          downloadAnchorNode.setAttribute("download", exportResult.filename);
          document.body.appendChild(downloadAnchorNode);

          console.log('Triggering download for:', exportResult.filename);
          downloadAnchorNode.click();

          // Delay cleanup significantly
          setTimeout(() => {
            if (document.body.contains(downloadAnchorNode)) {
              document.body.removeChild(downloadAnchorNode);
            }
            URL.revokeObjectURL(url);
            console.log('Cleanup completed for:', exportResult.filename);
          }, 600000); // Increased to 10 minutes for better persistence

          const successMsg = `Data exported successfully!\n\nFile: ${exportResult.filename}\n\nIt should be in your Downloads folder.`;
          if (window.showAlert) await window.showAlert(successMsg);
          else alert(successMsg);
        } catch (err) {
          console.error('Export exception:', err);
          const errMsg = `Export error: ${err.message}`;
          if (window.showAlert) await window.showAlert(errMsg);
          else alert(errMsg);
        }
      };

      // Setup Import UI
      document.getElementById('do-import-btn').onclick = async () => {
        const fileInput = document.getElementById('import-file');
        if (!fileInput.files || fileInput.files.length === 0) {
          alert('Please select a file to import.');
          return;
        }
        const file = fileInput.files[0];
        try {
          const { handleImport } = await import('./export-import-utils.js');
          await handleImport(file, window.API_URL || 'http://localhost:3001/api');
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert(err.message || 'Failed to import data.');
        }
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
          window.dispatchEvent(new CustomEvent('settings-subtab-change', { detail: { tab: btn.dataset.stab } }));
        }
      });
      tabsContainer.dataset.listener = "true";
    }
  }
};
