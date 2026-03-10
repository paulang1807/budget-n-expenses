import { TimeFilter } from './components/time-filter.js';
import { TransactionForm } from './components/transaction-form.js';
import { EntityModals } from './components/entity-modals.js';
import { Reports } from './components/reports.js';
import { Settings } from './components/settings.js';
import { GroupFilter } from './components/group-filter.js';
import { SortFilter } from './components/sort-filter.js';
import { AdvancedFilter } from './components/advanced-filter.js';
import { formatCurrency, getFilteredTransactions, getFABContext, parseLocalDate, groupTransactions, sortTransactions } from './utils.js';

const API_URL = 'http://localhost:3001/api';

let state = {
    accounts: [],
    transactions: [],
    budgets: [],
    categories: [],
    retailers: [],
    currentTab: 'transactions',
    filter: {
        period: 'This Month',
        startDate: null,
        endDate: null,
        groupBy: [],
        sorts: [{ field: 'date', order: 'desc' }],
        search: '',
        categories: [],
        subcategories: [],
        retailers: [],
        accounts: [],
        minAmount: null,
        maxAmount: null
    },
    currentSubTab: 'accounts',
    icons: [],
    expandedGroups: new Set(),
    collapsedTypes: new Set()
};

// Custom Modal/Dialog System
function showModal(message, type = 'alert') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-box">
                <p>${message}</p>
                <div class="modal-btns">
                    ${type === 'confirm' ? '<button class="btn secondary" id="modal-cancel">Cancel</button>' : ''}
                    <button class="btn primary" id="modal-ok">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const okBtn = modal.querySelector('#modal-ok');
        const cancelBtn = modal.querySelector('#modal-cancel');

        okBtn.addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        }
    });
}

window.showAlert = async (msg) => {
    await showModal(msg, 'alert');
};

async function confirmAction(message) {
    return await showModal(message, 'confirm');
}

async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}?v=${Date.now()}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return [];
    }
}

async function putData(endpoint, id, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const result = await response.json();
            if (result.error) await showAlert(result.error);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${endpoint}:`, error);
        return null;
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const result = await response.json();
            if (result.error) await showAlert(result.error);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`Error creating ${endpoint}:`, error);
        return null;
    }
}

async function deleteData(endpoint, id) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 204) return true;

        // If not 204, try to get error message
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const result = await response.json();
            if (result.error) await showAlert(result.error);
        } else {
            const text = await response.text();
            await showAlert(`Error: ${text}`);
        }
        return response.ok;
    } catch (error) {
        console.error(`Error deleting ${endpoint}:`, error);
        await showAlert(`Network error deleting ${endpoint}`);
        return false;
    }
}

async function init() {
    initTheme();
    state.accounts = await fetchData('accounts');
    state.transactions = await fetchData('transactions');
    state.budgets = await fetchData('budgets');
    state.categories = await fetchData('categories');
    state.retailers = await fetchData('retailers');
    state.icons = await fetchData('icons');

    updateSummaryCards();
    renderCurrentTab();
    setupEventListeners();
    addAddButton();
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
    updateChartDefaults(theme);
}

function updateChartDefaults(theme) {
    if (typeof Chart !== 'undefined') {
        const textColor = theme === 'dark' ? '#f8f9fa' : '#333333';
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = theme === 'dark' ? '#475569' : '#e0e0e0';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    updateChartDefaults(newTheme);
    renderCurrentTab(); // Re-render to update charts
}

function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        btn.title = theme === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode';
    }
}

function updateSummaryCards() {
    const filteredTxs = getFilteredTransactions(state);

    const income = filteredTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = filteredTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const net = income - expense;

    const netEl = document.getElementById('net-balance');
    if (netEl) {
        netEl.textContent = formatCurrency(net);
        netEl.style.color = net >= 0 ? 'var(--success)' : 'var(--danger)';
    }
}

function renderCurrentTab() {
    const content = document.getElementById('main-content');
    content.innerHTML = `<h2>${state.currentTab.charAt(0).toUpperCase() + state.currentTab.slice(1)}</h2>`;

    if (state.currentTab === 'transactions') {
        renderTransactions(content);
        document.getElementById('group-by-btn').style.display = 'flex';
        document.getElementById('sort-btn').style.display = 'flex';
    } else {
        document.getElementById('group-by-btn').style.display = 'none';
        document.getElementById('sort-btn').style.display = 'none';
        if (state.currentTab === 'budgets') {
            renderBudgets(content);
        } else if (state.currentTab === 'reports') {
            Reports.render(content, getFilteredTransactions(state));
        } else if (state.currentTab === 'settings') {
            Settings.render(content, state);
        }
    }
}

function renderTransactions(container) {
    const filteredTxs = getFilteredTransactions(state);

    // Create the dual layout
    const layout = document.createElement('div');
    layout.className = 'transactions-layout';

    const sidebar = document.createElement('div');
    sidebar.className = 'accounts-sidebar';

    const mainContent = document.createElement('div');
    mainContent.className = 'transactions-main';

    layout.appendChild(sidebar);
    layout.appendChild(mainContent);
    container.appendChild(layout);

    // Render Sidebar
    renderAccountsSidebar(sidebar);

    if (filteredTxs.length === 0) {
        mainContent.innerHTML = '<div class="transaction-list"><p>No transactions found for this period.</p></div>';
        return;
    }

    const { groupBy, sorts } = state.filter;

    // Split transactions by type
    const incomeTxs = filteredTxs.filter(tx => tx.type === 'income');
    const expenseTxs = filteredTxs.filter(tx => tx.type === 'expense');
    const transferTxs = filteredTxs.filter(tx => tx.type === 'transfer');

    // Render sections in order: Income, Expense, Transfer
    renderTypeSection(mainContent, 'Income', 'income', incomeTxs, groupBy, sorts);
    renderTypeSection(mainContent, 'Expenses', 'expense', expenseTxs, groupBy, sorts);
    renderTypeSection(mainContent, 'Transfers', 'transfer', transferTxs, groupBy, sorts);
}

function renderAccountsSidebar(container) {
    const selectedAccounts = state.filter.accounts || [];
    const isAllSelected = selectedAccounts.length === 0;

    container.innerHTML = `
        <div class="sidebar-title">Filter by Account</div>
        <div class="account-tile-list">
            <div class="account-tile account-tile-all ${isAllSelected ? 'active' : ''}" id="tile-all-accounts">
                All Accounts
            </div>
            ${state.accounts.map(acc => {
        const isActive = selectedAccounts.includes(acc.id);
        return `
                    <div class="account-tile ${isActive ? 'active' : ''}" data-accid="${acc.id}">
                        <div class="account-tile-icon">${acc.icon || '💰'}</div>
                        <div class="account-tile-info">
                            <div class="account-tile-name">${acc.name}</div>
                            <div class="account-tile-balance">${formatCurrency(acc.balance)}</div>
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;

    // Listeners
    container.querySelector('#tile-all-accounts').onclick = () => {
        state.filter.accounts = [];
        renderCurrentTab();
    };

    container.querySelectorAll('.account-tile[data-accid]').forEach(tile => {
        tile.onclick = () => {
            const accId = tile.dataset.accid;
            // Single select for now as per "Clicking on the tile for an account should filter the transactions for the account"
            if (state.filter.accounts.length === 1 && state.filter.accounts[0] === accId) {
                state.filter.accounts = []; // Toggle off
            } else {
                state.filter.accounts = [accId];
            }
            renderCurrentTab();
        };
    });
}

function renderTypeSection(container, title, type, txs, groupBy, sorts) {
    if (txs.length === 0) return;

    const total = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const icon = type === 'income' ? '📈' : (type === 'expense' ? '📉' : '🔄');
    const isCollapsed = state.collapsedTypes.has(type);

    const section = document.createElement('div');
    section.className = `tx-type-section tx-type-${type}`;
    section.innerHTML = `
        <div class="tx-type-header ${isCollapsed ? '' : 'expanded'}" data-type-toggle="${type}">
            <h2>
                <span class="type-chevron">▶</span>
                <span class="section-icon">${icon}</span> 
                ${title}
            </h2>
            <span class="section-total">
                ${type === 'expense' ? '-' : (type === 'income' ? '+' : '')}${formatCurrency(total)}
            </span>
        </div>
    `;

    const list = document.createElement('div');
    list.className = `type-content ${isCollapsed ? 'collapsed' : ''}`;

    if (!groupBy || groupBy.length === 0) {
        list.classList.add('transaction-list');
        const sortedTxs = sortTransactions(txs, sorts);
        sortedTxs.forEach(tx => {
            const item = createTransactionItem(tx);
            list.appendChild(item);
        });
    } else {
        list.classList.add('transaction-list-grouped');
        const groups = groupTransactions(txs, groupBy, sorts);
        renderRecursive(list, groups, [], 0);
    }

    section.appendChild(list);
    container.appendChild(section);
}

function renderRecursive(container, groups, path = [], level = 0) {
    Object.keys(groups).sort().forEach(key => {
        const group = groups[key];
        const currentPath = [...path, key].join('|');
        const isExpanded = state.expandedGroups.has(currentPath);

        const groupWrapper = document.createElement('div');
        groupWrapper.className = `group-wrapper level-${level}`;

        const header = document.createElement('div');
        header.className = `group-header ${isExpanded ? 'expanded' : ''}`;
        header.dataset.groupPath = currentPath;
        header.innerHTML = `
            <div class="group-header-left">
                <span class="group-chevron">▶</span>
                <span>${key}</span>
            </div>
            <span class="group-total" style="color: ${group.total >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${group.total >= 0 ? '+' : ''}${formatCurrency(group.total)}
            </span>
        `;
        groupWrapper.appendChild(header);

        const content = document.createElement('div');
        content.className = `group-content ${isExpanded ? '' : 'collapsed'}`;

        if (group.groups) {
            renderRecursive(content, group.groups, [...path, key], level + 1);
        } else if (group.txs) {
            group.txs.forEach(tx => {
                const item = createTransactionItem(tx);
                content.appendChild(item);
            });
        }

        groupWrapper.appendChild(content);
        container.appendChild(groupWrapper);
    });
}

function createTransactionItem(tx) {
    const item = document.createElement('div');
    item.className = 'transaction-item';

    // Construct metadata line: Date • [Retailer •] Category [ - Subcategory]
    const metaParts = [parseLocalDate(tx.date).toLocaleDateString()];
    if (tx.retailer) metaParts.push(tx.retailer);

    if (tx.category) {
        metaParts.push(tx.category);
    } else if (tx.type !== 'transfer') {
        metaParts.push('No Category');
    }

    const metaText = metaParts.join(' • ') + (tx.subcategory ? ' - ' + tx.subcategory : '');

    item.innerHTML = `
        <div class="tx-info">
          <div class="tx-desc">${tx.description}</div>
          <div class="tx-meta">${metaText}</div>
        </div>
        <div class="tx-actions">
          <div class="tx-amount ${tx.type}">${tx.type === 'expense' ? '-' : '+'}${formatCurrency(tx.amount)}</div>
          <div class="action-btns">
            <button class="btn-icon edit-tx-btn" data-id="${tx.id}" title="Edit">✏️</button>
            <button class="btn-icon copy-tx-btn" data-id="${tx.id}" title="Copy">📋</button>
            <button class="btn-icon delete-tx-btn" data-id="${tx.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    return item;
}

function renderBudgets(container) {
    const list = document.createElement('div');
    list.className = 'budget-list';
    state.budgets.forEach(b => {
        const item = document.createElement('div');
        item.className = 'budget-item';
        item.innerHTML = `
      <div class="budget-info">
        <span>${b.category}</span>
        <span>${formatCurrency(b.allocated)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: 50%; background: ${b.color}"></div>
      </div>
    `;
        list.appendChild(item);
    });
    container.appendChild(list);
}

function renderReports(container) {
    container.innerHTML += '<p>Reports view with charts coming soon...</p>';
}

function renderSettings(container) {
    container.innerHTML += `
    <div class="settings-grid">
      <div class="card">Manage Accounts</div>
      <div class="card">Manage Categories</div>
      <div class="card">Manage Retailers</div>
      <div class="card">Export Data</div>
    </div>
  `;
}

function setupEventListeners() {
    document.querySelectorAll('.nav-tabs button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelector('.nav-tabs button.active').classList.remove('active');
            e.target.classList.add('active');
            state.currentTab = e.target.dataset.tab;
            renderCurrentTab();
            updateFAB();
        });
    });

    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);

    document.getElementById('group-by-btn').addEventListener('click', () => {
        const modalHtml = GroupFilter.render(state.filter.groupBy);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        GroupFilter.setup((groupBy) => {
            state.filter.groupBy = groupBy;
            state.expandedGroups.clear();
            const btnSpan = document.querySelector('#group-by-btn span');
            if (groupBy.length === 0) {
                btnSpan.textContent = 'Group By: None';
            } else if (groupBy.length === 1) {
                const label = GroupFilter.options.find(o => o.id === groupBy[0]).label;
                btnSpan.textContent = `Group By: ${label.split(' ')[0]}`;
            } else {
                btnSpan.textContent = `Group By: Multi (${groupBy.length})`;
            }
            renderCurrentTab();
        });
    });

    document.getElementById('sort-btn').addEventListener('click', () => {
        const modalHtml = SortFilter.render(state.filter.sorts);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        SortFilter.setup((sorts) => {
            state.filter.sorts = sorts;
            const btnSpan = document.querySelector('#sort-btn span');
            if (sorts.length === 0) {
                btnSpan.textContent = 'Sort: None';
            } else if (sorts.length === 1) {
                const fieldLabel = SortFilter.options.find(o => o.id === sorts[0].field).label;
                const orderLabel = sorts[0].order === 'asc' ? '↑' : '↓';
                btnSpan.textContent = `Sort: ${fieldLabel} ${orderLabel}`;
            } else {
                btnSpan.textContent = `Sort: Multi (${sorts.length})`;
            }
            renderCurrentTab();
        });
    });

    const searchInput = document.getElementById('transaction-search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.filter.search = e.target.value;
            renderCurrentTab();
            updateSummaryCards();
        }, 300);
    });

    document.getElementById('advanced-filter-btn').addEventListener('click', () => {
        const modalHtml = AdvancedFilter.render(state, state.filter);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        AdvancedFilter.setup((filters) => {
            state.filter = { ...state.filter, ...filters };
            const btnSpan = document.querySelector('#advanced-filter-btn span');

            // Count active filters
            let count = 0;
            if (filters.categories.length > 0) count++;
            if (filters.subcategories && filters.subcategories.length > 0) count++;
            if (filters.retailers.length > 0) count++;
            if (filters.accounts.length > 0) count++;
            if (filters.minAmount !== null || filters.maxAmount !== null) count++;

            btnSpan.textContent = count > 0 ? `Filters (${count})` : 'Filters';
            updateSummaryCards();
            renderCurrentTab();
        });
    });

    document.getElementById('time-filter-btn').addEventListener('click', () => {
        const modalHtml = TimeFilter.render();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        TimeFilter.setup((filter) => {
            state.filter = { ...state.filter, ...filter };
            const btnSpan = document.querySelector('#time-filter-btn span');
            if (filter.period === 'Custom Range') {
                btnSpan.textContent = `${filter.startDate || '...'} to ${filter.endDate || '...'}`;
            } else {
                btnSpan.textContent = filter.period;
            }
            // Refresh data or filter local state
            updateSummaryCards();
            renderCurrentTab();
        });
    });

    // Handle entity creation (Global listener for quick-add and settings)
    window.addEventListener('open-entity-modal', (e) => {
        const { type, initialData } = e.detail;
        renderEntityModal(type, initialData);
    });

    // Handle sub-tab changes from Settings
    window.addEventListener('settings-subtab-change', (e) => {
        state.currentSubTab = e.detail.tab;
        updateFAB();
    });

    // Handle managed icon actions
    window.addEventListener('managed-icon-action', async (e) => {
        const { action, id, data } = e.detail;
        if (action === 'add') {
            await postData('icons', data);
        } else if (action === 'delete') {
            if (await confirmAction('Are you sure you want to delete this icon from the library?')) {
                await deleteData('icons', id);
            } else {
                return;
            }
        }
        state.icons = await fetchData('icons');
        renderCurrentTab();
    });

    // Global click delegation
    document.addEventListener('click', async (e) => {
        try {
            const target = e.target;

            // 1. Transaction Type Toggle
            const typeToggle = target.closest('[data-type-toggle]');
            if (typeToggle) {
                const type = typeToggle.dataset.typeToggle;
                if (state.collapsedTypes.has(type)) state.collapsedTypes.delete(type);
                else state.collapsedTypes.add(type);
                renderCurrentTab();
                return;
            }

            // 2. Group Toggle
            const groupHeader = target.closest('.group-header');
            if (groupHeader) {
                const path = groupHeader.dataset.groupPath;
                if (state.expandedGroups.has(path)) state.expandedGroups.delete(path);
                else state.expandedGroups.add(path);
                renderCurrentTab();
                return;
            }

            // 3. Action Buttons
            const actionBtn = target.closest('.quick-add-btn, .edit-tx-btn, .copy-tx-btn, .delete-tx-btn, .edit-entity-btn, .delete-entity-btn, .add-sub-btn, .edit-sub-btn, .delete-sub-btn');
            if (!actionBtn) return;

            e.preventDefault();
            e.stopPropagation();

            if (actionBtn.classList.contains('quick-add-btn')) {
                renderEntityModal(actionBtn.dataset.type);
            } else if (actionBtn.classList.contains('edit-tx-btn')) {
                const tx = state.transactions.find(t => t.id === actionBtn.dataset.id);
                if (tx) renderTransactionForm(tx);
            } else if (actionBtn.classList.contains('copy-tx-btn')) {
                const tx = state.transactions.find(t => t.id === actionBtn.dataset.id);
                if (tx) renderTransactionForm({ ...tx, isCopy: true });
            } else if (actionBtn.classList.contains('delete-tx-btn')) {
                const id = actionBtn.dataset.id;
                if (await confirmAction('Are you sure you want to delete this transaction?')) {
                    if (await deleteData('transactions', id)) {
                        state.accounts = await fetchData('accounts');
                        state.transactions = await fetchData('transactions');
                        updateSummaryCards();
                        renderCurrentTab();
                    }
                }
            } else if (actionBtn.classList.contains('edit-entity-btn')) {
                const type = actionBtn.dataset.type;
                const id = actionBtn.dataset.id;
                const item = state[type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : 'retailers')].find(x => x.id === id);
                if (item) renderEntityModal(type, item);
            } else if (actionBtn.classList.contains('delete-entity-btn')) {
                const type = actionBtn.dataset.type;
                const id = actionBtn.dataset.id;
                const endpoint = type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : 'retailers');
                if (await confirmAction(`Are you sure you want to delete this ${type}?`)) {
                    if (await deleteData(endpoint, id)) {
                        state[endpoint] = await fetchData(endpoint);
                        renderCurrentTab();
                    }
                }
            } else if (actionBtn.classList.contains('add-sub-btn')) {
                renderSubcategoryModal(actionBtn.dataset.catid);
            } else if (actionBtn.classList.contains('edit-sub-btn')) {
                const cat = state.categories.find(c => c.id === actionBtn.dataset.catid);
                const sub = cat?.subcategories?.find(s => s.id === actionBtn.dataset.id);
                if (sub) renderSubcategoryModal(actionBtn.dataset.catid, sub);
            } else if (actionBtn.classList.contains('delete-sub-btn')) {
                const id = actionBtn.dataset.id;
                const catid = actionBtn.dataset.catid;
                if (await confirmAction('Are you sure you want to delete this subcategory?')) {
                    if (await deleteData(`categories/${catid}/subcategories`, id)) {
                        state.categories = await fetchData('categories');
                        renderCurrentTab();
                    }
                }
            }
        } catch (err) {
            await showAlert(`Interaction Error: ${err.message}`);
        }
    });
}

function renderTransactionForm(initialData = null) {
    const modalHtml = TransactionForm.render(state.accounts, state.categories, state.retailers, initialData);
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    TransactionForm.setup(async (txData) => {
        let result;
        if (initialData && initialData.id && !initialData.isCopy) {
            result = await putData('transactions', initialData.id, txData);
        } else {
            result = await postData('transactions', txData);
        }

        if (result) {
            state.accounts = await fetchData('accounts');
            state.transactions = await fetchData('transactions');
            updateSummaryCards();
            renderCurrentTab();
        }
    }, state.categories);
}

function renderEntityModal(type, initialData = null) {
    let modalHtml = '';
    if (type === 'account') modalHtml = EntityModals.renderAddAccount(state.icons, initialData);
    else if (type === 'category') modalHtml = EntityModals.renderAddCategory(state.icons, initialData);
    else if (type === 'retailer') modalHtml = EntityModals.renderAddRetailer(state.icons, initialData);
    else if (type === 'budget') modalHtml = EntityModals.renderAddBudget(state.categories, initialData);

    if (!modalHtml) return;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    EntityModals.setup(async (data) => {
        const endpoint = type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : (type === 'retailer' ? 'retailers' : 'budgets'));
        let result;
        if (initialData && initialData.id) {
            result = await putData(endpoint, initialData.id, data);
        } else {
            result = await postData(endpoint, data);
        }

        if (result) {
            let items = [];
            if (type === 'account') {
                state.accounts = await fetchData('accounts');
                items = state.accounts;
            } else if (type === 'category') {
                state.categories = await fetchData('categories');
                items = state.categories;
            } else if (type === 'retailer') {
                state.retailers = await fetchData('retailers');
                items = state.retailers;
            } else if (type === 'budget') {
                state.budgets = await fetchData('budgets');
                items = state.budgets;
            }

            // Sync with transaction form if open
            if (document.getElementById('tx-form-modal')) {
                TransactionForm.updateDropdown(type, items);
            }

            updateSummaryCards();
            renderCurrentTab();
        }
    });
}

function renderSubcategoryModal(categoryId, initialData = null) {
    const modalHtml = EntityModals.renderAddSubcategory(state.icons, categoryId, initialData);
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    EntityModals.setup(async (data) => {
        let result;
        if (initialData && initialData.id) {
            result = await putData(`categories/${categoryId}/subcategories`, initialData.id, data);
        } else {
            result = await postData(`categories/${categoryId}/subcategories`, data);
        }

        if (result) {
            state.categories = await fetchData('categories');
            renderCurrentTab();
        }
    });
}

function addAddButton() {
    const btn = document.createElement('button');
    btn.id = 'fab-button';
    btn.className = 'add-tx-btn';
    btn.innerHTML = `
        <span class="fab-icon">+</span>
        <span class="fab-label">Add Transaction</span>
    `;
    btn.addEventListener('click', () => {
        const context = getFABContext(state);
        if (context.type === 'transaction') renderTransactionForm();
        else renderEntityModal(context.type);
    });
    document.body.appendChild(btn);
    updateFAB();
}

function updateFAB() {
    const btn = document.getElementById('fab-button');
    if (!btn) return;

    const context = getFABContext(state);
    if (!context.type) {
        btn.style.display = 'none';
        return;
    }

    btn.style.display = 'flex';
    btn.querySelector('.fab-label').textContent = context.label;
    btn.title = context.label;
}

init();
