export const Reports = {
    currentReport: 'spending',

    render(container, state) {
        const transactions = getFilteredTransactions(state);
        const budgets = getFilteredBudgets(state);
        const categories = state.categories;

        container.innerHTML = `
      <div class="reports-container">
        <div class="report-selector-container">
          <label for="report-select">Select Report:</label>
          <div class="select-wrapper">
            <select id="report-select">
              <option value="spending" ${this.currentReport === 'spending' ? 'selected' : ''}>Spending by Category</option>
              <option value="budget-vs-spend" ${this.currentReport === 'budget-vs-spend' ? 'selected' : ''}>Budget vs Spend by Category</option>
              <option value="balance-trend" ${this.currentReport === 'balance-trend' ? 'selected' : ''}>Balance Trend (Actual vs Projected)</option>
            </select>
            <span class="select-arrow">▼</span>
          </div>
        </div>
        
        <div id="report-content">
          <div class="report-section ${this.currentReport === 'spending' ? '' : 'hidden'}" id="spending-section">
            <h3>Spending by Category</h3>
            <canvas id="category-chart"></canvas>
          </div>
          <div class="report-section ${this.currentReport === 'budget-vs-spend' ? '' : 'hidden'}" id="budget-vs-spend-section">
            <h3>Budget vs Spend by Category</h3>
            <canvas id="budget-vs-spend-chart"></canvas>
          </div>
          <div class="report-section ${this.currentReport === 'balance-trend' ? '' : 'hidden'}" id="balance-trend-section">
            <h3>Balance Trend (Actual vs Projected)</h3>
            <canvas id="balance-trend-chart"></canvas>
          </div>
        </div>
      </div>
    `;

        const select = container.querySelector('#report-select');
        select.addEventListener('change', (e) => {
            this.currentReport = e.target.value;
            const spendingSection = container.querySelector('#spending-section');
            const budgetSection = container.querySelector('#budget-vs-spend-section');
            const trendSection = container.querySelector('#balance-trend-section');

            spendingSection.classList.add('hidden');
            budgetSection.classList.add('hidden');
            trendSection.classList.add('hidden');

            if (this.currentReport === 'spending') spendingSection.classList.remove('hidden');
            else if (this.currentReport === 'budget-vs-spend') budgetSection.classList.remove('hidden');
            else if (this.currentReport === 'balance-trend') trendSection.classList.remove('hidden');
        });

        const categoryCanvas = document.getElementById('category-chart');
        const budgetCanvas = document.getElementById('budget-vs-spend-chart');
        const trendCanvas = document.getElementById('balance-trend-chart');

        if (!categoryCanvas || !budgetCanvas || !trendCanvas) return;

        const categoryCtx = categoryCanvas.getContext('2d');
        const budgetCtx = budgetCanvas.getContext('2d');
        const trendCtx = trendCanvas.getContext('2d');

        // Spending by Category Data
        const spendTotals = {};
        transactions.filter(tx => tx.type === 'expense').forEach(tx => {
            const catId = tx.category;
            const categoryObj = categories.find(c => c.id === catId || c.name === catId);
            const catName = categoryObj ? categoryObj.name : (catId || 'No Category');
            spendTotals[catName] = (spendTotals[catName] || 0) + Number(tx.amount);
        });

        // Budget vs Spend Data
        const budgetTotals = {};
        budgets.forEach(b => {
            const catId = b.category;
            const categoryObj = categories.find(c => c.id === catId || c.name === catId);
            const catName = categoryObj ? categoryObj.name : (catId || 'No Category');
            budgetTotals[catName] = (budgetTotals[catName] || 0) + Number(b.allocated);
        });

        const allCategories = [...new Set([...Object.keys(spendTotals), ...Object.keys(budgetTotals)])].sort();

        // Doughnut Chart
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(spendTotals),
                datasets: [{
                    data: Object.values(spendTotals),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: Chart.defaults.color, padding: 20, font: { size: 14 } }
                    }
                }
            }
        });

        // Bar Chart
        new Chart(budgetCtx, {
            type: 'bar',
            data: {
                labels: allCategories,
                datasets: [
                    {
                        label: 'Budgeted',
                        data: allCategories.map(cat => budgetTotals[cat] || 0),
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual Spend',
                        data: allCategories.map(cat => spendTotals[cat] || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { color: Chart.defaults.color, font: { size: 12 } } },
                    x: { ticks: { color: Chart.defaults.color, font: { size: 12 } } }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: Chart.defaults.color, padding: 20, font: { size: 14 } }
                    }
                }
            }
        });

        // Balance Trend Chart
        this.renderBalanceTrendChart(trendCtx, state);
    },

    renderBalanceTrendChart(ctx, state) {
        // Reuse logic from Balances.calculateHistoricalBalances
        // We need to fetch projected worth if not in state, but main.js should have it.
        // For simplicity, we'll implement a subset or call a shared utility if possible.
        // Since we can't easily export from Balances without refactoring, we'll implement calculation here.
        
        const today = state.filter.referenceDate ? new Date(state.filter.referenceDate) : new Date();
        const year = today.getFullYear();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Need access to Balances.calculateHistoricalBalances logic
        // For now, let's assume we can use it if we import it or duplicate the core logic.
        // Duplicating the core logic for the trend chart specifically:
        
        const accounts = state.accounts || [];
        const transactions = state.transactions || [];
        const projectedWorth = state.projectedWorth || [];
        const assets = state.assets || [];
        const assetProjections = state.assetProjections || [];

        const currentAccountBalances = {};
        let totalCurrentBalance = 0;
        accounts.forEach(acc => {
            const bal = Number(acc.balance) || 0;
            currentAccountBalances[acc.id] = bal;
            totalCurrentBalance += bal;
        });

        const sortedTxs = [...transactions].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
        const timeZeroBalances = { ...currentAccountBalances };
        sortedTxs.forEach(tx => {
            const amt = Number(tx.amount) || 0;
            if (tx.type === 'income' && tx.accountId) timeZeroBalances[tx.accountId] -= amt;
            else if (tx.type === 'expense' && tx.accountId) timeZeroBalances[tx.accountId] += amt;
            else if (tx.type === 'transfer') {
                if (tx.toAccountId) timeZeroBalances[tx.toAccountId] -= amt;
                if (tx.fromAccountId) timeZeroBalances[tx.fromAccountId] += amt;
            }
        });

        const results = Array.from({ length: 12 }, () => ({ endBalance: 0, endProjected: 0 }));
        const forwardTxs = [...sortedTxs].reverse();
        const finalAccts = { ...timeZeroBalances };

        forwardTxs.forEach(tx => {
            const d = parseLocalDate(tx.date);
            if (d.getFullYear() < year) {
                const amt = Number(tx.amount) || 0;
                if (tx.type === 'income' && tx.accountId) finalAccts[tx.accountId] += amt;
                else if (tx.type === 'expense' && tx.accountId) finalAccts[tx.accountId] -= amt;
                else if (tx.type === 'transfer') {
                    if (tx.fromAccountId) finalAccts[tx.fromAccountId] -= amt;
                    if (tx.toAccountId) finalAccts[tx.toAccountId] += amt;
                }
            }
        });

        for (let m = 0; m < 12; m++) {
            const monthTxs = forwardTxs.filter(tx => {
                const d = parseLocalDate(tx.date);
                return d.getFullYear() === year && d.getMonth() === m;
            });

            monthTxs.forEach(tx => {
                const amt = Number(tx.amount) || 0;
                if (tx.type === 'income' && tx.accountId) finalAccts[tx.accountId] += amt;
                else if (tx.type === 'expense' && tx.accountId) finalAccts[tx.accountId] -= amt;
                else if (tx.type === 'transfer') {
                    if (tx.fromAccountId) finalAccts[tx.fromAccountId] -= amt;
                    if (tx.toAccountId) finalAccts[tx.toAccountId] += amt;
                }
            });

            const acctActual = Object.values(finalAccts).reduce((sum, v) => sum + v, 0);
            const assetsActual = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
            results[m].endBalance = acctActual + assetsActual;

            const acctProjected = accounts.reduce((sum, acc) => {
                const proj = projectedWorth.find(p => p.accountId === acc.id && p.year === year && p.month === m);
                return sum + (proj ? Number(proj.amount) : (finalAccts[acc.id] || 0));
            }, 0);
            const assetsProjected = assets.reduce((sum, a) => {
                const proj = assetProjections.find(p => p.assetId === a.id && p.year === year && p.month === m);
                return sum + (proj ? Number(proj.amount) : (Number(a.value) || 0));
            }, 0);
            results[m].endProjected = acctProjected + assetsProjected;
        }

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: 'Actual Balance',
                        data: results.map(r => r.endBalance),
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Projected Balance',
                        data: results.map(r => r.endProjected),
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        borderDash: [5, 5],
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: { color: Chart.defaults.color, font: { size: 12 } },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: Chart.defaults.color, font: { size: 12 } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: Chart.defaults.color, padding: 20, font: { size: 14 } }
                    }
                }
            }
        });
    }
};

import { getFilteredTransactions, getFilteredBudgets, parseLocalDate } from '../utils.js';
