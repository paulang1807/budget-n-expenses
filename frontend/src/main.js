import { TimeFilter } from './components/time-filter.js';
import { TransactionForm } from './components/transaction-form.js';
import { EntityModals } from './components/entity-modals.js';
import { Reports } from './components/reports.js';
import { Settings } from './components/settings.js';
import { formatCurrency, getFilteredTransactions } from './utils.js';

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
        endDate: null
    }
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
        return await response.json();
    } catch (error) {
        console.error(`Error updating ${endpoint}:`, error);
    }
}

async function postData(endpoint, data) {
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error(`Error creating ${endpoint}:`, error);
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
    state.accounts = await fetchData('accounts');
    state.transactions = await fetchData('transactions');
    state.budgets = await fetchData('budgets');
    state.categories = await fetchData('categories');
    state.retailers = await fetchData('retailers');

    updateSummaryCards();
    renderCurrentTab();
    setupEventListeners();
    addAddButton();
}

function updateSummaryCards() {
    const filteredTxs = getFilteredTransactions(state);

    const income = filteredTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = filteredTxs.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
    const net = income - expense;

    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expenses').textContent = formatCurrency(expense);
    document.getElementById('net-balance').textContent = formatCurrency(net);

    const netEl = document.getElementById('net-balance');
    netEl.style.color = net >= 0 ? 'var(--success)' : 'var(--danger)';
}

function renderCurrentTab() {
    const content = document.getElementById('main-content');
    content.innerHTML = `<h2>${state.currentTab.charAt(0).toUpperCase() + state.currentTab.slice(1)}</h2>`;

    if (state.currentTab === 'transactions') {
        renderTransactions(content);
    } else if (state.currentTab === 'budgets') {
        renderBudgets(content);
    } else if (state.currentTab === 'reports') {
        Reports.render(content, getFilteredTransactions(state));
    } else if (state.currentTab === 'settings') {
        Settings.render(content, state);
    }
}

function renderTransactions(container) {
    const list = document.createElement('div');
    list.className = 'transaction-list';

    const filteredTxs = getFilteredTransactions(state);

    if (filteredTxs.length === 0) {
        list.innerHTML = '<p>No transactions found for this period.</p>';
    } else {
        // Sort transactions by date descending
        const sortedTxs = [...filteredTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedTxs.forEach(tx => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            item.innerHTML = `
        <div class="tx-info">
          <div class="tx-desc">${tx.description}</div>
          <div class="tx-meta">${new Date(tx.date).toLocaleDateString()} • ${tx.category || 'No Category'} ${tx.subcategory ? ' - ' + tx.subcategory : ''}</div>
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
            list.appendChild(item);
        });
    }
    container.appendChild(list);
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
        });
    });

    document.getElementById('time-filter-btn').addEventListener('click', () => {
        const modalHtml = TimeFilter.render();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        TimeFilter.setup((filter) => {
            state.filter = filter;
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

    // Global click delegation for all "Add", "Edit", "Copy", "Delete" buttons
    document.addEventListener('click', async (e) => {
        try {
            const target = e.target.closest('.quick-add-btn, .add-entity-btn, .edit-tx-btn, .copy-tx-btn, .delete-tx-btn, .edit-entity-btn, .delete-entity-btn, .add-sub-btn, .edit-sub-btn, .delete-sub-btn');
            if (!target) return;

            e.preventDefault();
            e.stopPropagation();

            if (target.classList.contains('quick-add-btn') || target.classList.contains('add-entity-btn')) {
                renderEntityModal(target.dataset.type);
            } else if (target.classList.contains('edit-tx-btn')) {
                const tx = state.transactions.find(t => t.id === target.dataset.id);
                if (tx) renderTransactionForm(tx);
            } else if (target.classList.contains('copy-tx-btn')) {
                const tx = state.transactions.find(t => t.id === target.dataset.id);
                if (tx) renderTransactionForm({ ...tx, isCopy: true });
            } else if (target.classList.contains('delete-tx-btn')) {
                const id = target.dataset.id;
                if (await confirmAction('Are you sure you want to delete this transaction?')) {
                    if (await deleteData('transactions', id)) {
                        state.accounts = await fetchData('accounts');
                        state.transactions = await fetchData('transactions');
                        updateSummaryCards();
                        renderCurrentTab();
                    }
                }
            } else if (target.classList.contains('edit-entity-btn')) {
                const type = target.dataset.type;
                const id = target.dataset.id;
                const item = state[type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : 'retailers')].find(x => x.id === id);
                if (item) renderEntityModal(type, item);
            } else if (target.classList.contains('delete-entity-btn')) {
                const type = target.dataset.type;
                const id = target.dataset.id;
                const endpoint = type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : 'retailers');
                if (await confirmAction(`Are you sure you want to delete this ${type}?`)) {
                    if (await deleteData(endpoint, id)) {
                        state[endpoint] = await fetchData(endpoint);
                        renderCurrentTab();
                    }
                }
            } else if (target.classList.contains('add-sub-btn')) {
                renderSubcategoryModal(target.dataset.catid);
            } else if (target.classList.contains('edit-sub-btn')) {
                const cat = state.categories.find(c => c.id === target.dataset.catid);
                const sub = cat?.subcategories?.find(s => s.id === target.dataset.id);
                if (sub) renderSubcategoryModal(target.dataset.catid, sub);
            } else if (target.classList.contains('delete-sub-btn')) {
                const id = target.dataset.id;
                const catid = target.dataset.catid;
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
    });
}

function renderEntityModal(type, initialData = null) {
    let modalHtml = '';
    if (type === 'account') modalHtml = EntityModals.renderAddAccount(initialData);
    else if (type === 'category') modalHtml = EntityModals.renderAddCategory(initialData);
    else if (type === 'retailer') modalHtml = EntityModals.renderAddRetailer(initialData);

    if (!modalHtml) return;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    EntityModals.setup(async (data) => {
        const endpoint = type === 'account' ? 'accounts' : (type === 'category' ? 'categories' : 'retailers');
        let result;
        if (initialData && initialData.id) {
            result = await putData(endpoint, initialData.id, data);
        } else {
            result = await postData(endpoint, data);
        }

        if (result) {
            if (type === 'account') state.accounts = await fetchData('accounts');
            else if (type === 'category') state.categories = await fetchData('categories');
            else if (type === 'retailer') state.retailers = await fetchData('retailers');

            updateSummaryCards();
            renderCurrentTab();
        }
    });
}

function renderSubcategoryModal(categoryId, initialData = null) {
    const modalHtml = EntityModals.renderAddSubcategory(categoryId, initialData);
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
    btn.className = 'add-tx-btn';
    btn.innerHTML = '+';
    btn.addEventListener('click', () => {
        renderTransactionForm();
    });
    document.body.appendChild(btn);
}

// Add some CSS styles for transaction list dynamically for now
const style = document.createElement('style');
style.textContent = `
  .transaction-list { margin-top: 1rem; }
  .transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    margin-bottom: 0.5rem;
    border-radius: 8px;
    box-shadow: var(--shadow);
  }
  .tx-desc { font-weight: 600; }
  .tx-meta { font-size: 0.875rem; color: var(--text-light); }
  .tx-amount { font-weight: 700; }
  .tx-amount.income { color: var(--success); }
  .tx-amount.expense { color: var(--danger); }
  .tx-amount.transfer { color: var(--primary); }

  .budget-list { margin-top: 1rem; }
  .budget-item { margin-bottom: 1.5rem; background: white; padding: 1rem; border-radius: 8px; box-shadow: var(--shadow); }
  .budget-info { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: 600; }
  .progress-bar { height: 10px; background: var(--border); border-radius: 5px; overflow: hidden; }
  .progress { height: 100%; }

  .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; }

  .add-tx-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: var(--primary);
    color: white;
    font-size: 2rem;
    border: none;
    box-shadow: var(--shadow);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  .add-tx-btn:active { transform: scale(0.95); }

  /* Custom Modal Styles */
  .custom-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .modal-backdrop {
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(2px);
  }
  .modal-box {
    position: relative;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    max-width: 400px;
    width: 90%;
    text-align: center;
  }
  .modal-btns {
    margin-top: 1.5rem;
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
`;
document.head.appendChild(style);

init();
