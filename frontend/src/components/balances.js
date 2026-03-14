import { formatCurrency, parseLocalDate } from '../utils.js';

export const Balances = {
  render(container, state) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startYear = 2010;
    
    // Default to current year if not selected yet
    this.selectedYear = this.selectedYear || currentYear;
    // Default to summary view
    this.activeView = this.activeView || 'summary';

    const yearOptions = [];
    for (let y = startYear; y <= 2050; y++) {
      yearOptions.push(`<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}</option>`);
    }

    container.innerHTML = `
      <div class="balances-header-section">
        <div class="balances-controls">
          <label for="balances-year-select">Year:</label>
          <select id="balances-year-select" class="balances-year-select">
            ${yearOptions.join('')}
          </select>
        </div>
        
        <div class="balances-view-toggle">
          <button class="view-toggle-btn ${this.activeView === 'summary' ? 'active' : ''}" data-view="summary">Monthly Summary</button>
          <button class="view-toggle-btn ${this.activeView === 'accounts' ? 'active' : ''}" data-view="accounts">Account Balances</button>
        </div>
      </div>
      <div id="balances-content-area" class="balances-content-area"></div>
    `;

    this.setupEventListeners(container, state);
    this.renderActiveView(container, state);
  },

  setupEventListeners(container, state) {
    const yearSelect = container.querySelector('#balances-year-select');
    yearSelect.addEventListener('change', (e) => {
      this.selectedYear = parseInt(e.target.value, 10);
      this.renderActiveView(container, state);
    });

    const toggleBtns = container.querySelectorAll('.view-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.activeView = e.target.dataset.view;
        this.renderActiveView(container, state);
      });
    });
  },

  renderActiveView(container, state) {
    const contentArea = container.querySelector('#balances-content-area');
    contentArea.innerHTML = ''; // Clear previous

    const data = this.calculateHistoricalBalances(state, this.selectedYear);

    if (this.activeView === 'summary') {
      this.renderMonthlySummary(contentArea, data);
    } else {
      this.renderAccountBreakdown(contentArea, data, state.accounts);
    }
  },

  calculateHistoricalBalances(state, targetYear) {
    // We need 12 months for the target year (Jan = 0, Dec = 11)
    const monthsData = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      startingBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      endBalance: 0,
      accountBalances: {} // End-of-month balances per account for this month
    }));

    // Start with the current, live database balances
    const currentAccountBalances = {};
    let totalCurrentBalance = 0;
    state.accounts.forEach(acc => {
      const bal = Number(acc.balance) || 0;
      currentAccountBalances[acc.id] = bal;
      // We explicitly track total balance based on accounts that are NOT credit cards (liabilities) 
      // or we just sum them all. For standard "Net Worth" or "Total Balance", summing is fine if liabilities are negative.
      totalCurrentBalance += bal;
    });

    // We must walk BACKWARDS through transactions from NOW to calculate historical points
    // Sort transactions DESCENDING (Newest to Oldest)
    const sortedTxs = [...state.transactions].sort((a, b) => {
      return parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
    });

    // Temporary running balances as we walk backwards
    const runningBalances = { ...currentAccountBalances };
    let runningTotal = totalCurrentBalance;

    // We need to keep track of the start boundaries for our target year
    // E.g., if target year is 2026, Dec boundaries are Dec 1 to Dec 31.
    // However, since we are moving backward in time from "the future",
    // the very first time we cross the end of a month, that running balance is the "End Balance".
    // The moment we cross the *start* of a month, that running balance is the "Starting Balance".

    // Because transactions can happen at any millisecond, boundary logic works best by finding all transactions
    // strictly AFTER a month to reverse them.

    for (let monthIndex = 11; monthIndex >= 0; monthIndex--) {
      // Find the end of this month (e.g. Dec 31, 23:59:59)
      const endOfMonth = new Date(targetYear, monthIndex + 1, 0, 23, 59, 59, 999);
      // Find the start of this month (e.g. Dec 1, 00:00:00)
      const startOfMonth = new Date(targetYear, monthIndex, 1, 0, 0, 0, 0);

      // Roll back all transactions that happened STRICTLY AFTER the end of this month.
      // E.g., if it's currently Dec 2026, we first roll back all 2027 transactions to get Dec 31 balance.
      const txsAfterMonth = sortedTxs.filter(tx => parseLocalDate(tx.date) > endOfMonth);
      
      // We only want to process each transaction ONCE as we move backwards.
      // A more efficient way is to consume the sorted array.
    }

    // Let's rewrite the algorithm to be a single O(N) pass backwards
    const results = Array.from({ length: 12 }, (_, i) => ({
      startingBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      endBalance: 0,
      accountBalances: {}
    }));

    const runningAccts = { ...currentAccountBalances };
    
    // We will consume transactions newest first
    let txIndex = 0;

    // We count backwards month by month, year by year? 
    // Actually, simple O(N) aggregate up to current is easier:
    // 1. Calculate exactly how much each account changed completely from Time 0 to Now.
    // 2. We don't need to walk backwards from Now. We can walk FORWARDS from Time 0.
    // Wait, we don't know Time 0 balances! We only know "NOW" balances from accounts.json.
    // Therefore, Time 0 balance = NOW balance - (Sum of ALL transactions ever).

    const timeZeroBalances = { ...currentAccountBalances };
    sortedTxs.forEach(tx => {
       const amt = Number(tx.amount) || 0;
       if (tx.type === 'income') {
           if (tx.accountId && timeZeroBalances[tx.accountId] !== undefined) {
               timeZeroBalances[tx.accountId] -= amt; // Reverse income
           }
       } else if (tx.type === 'expense') {
           if (tx.accountId && timeZeroBalances[tx.accountId] !== undefined) {
               timeZeroBalances[tx.accountId] += amt; // Reverse expense
           }
       } else if (tx.type === 'transfer') {
           if (tx.toAccountId && timeZeroBalances[tx.toAccountId] !== undefined) {
               timeZeroBalances[tx.toAccountId] -= amt; // Reverse receive
           }
           if (tx.fromAccountId && timeZeroBalances[tx.fromAccountId] !== undefined) {
               timeZeroBalances[tx.fromAccountId] += amt; // Reverse send
           }
       }
    });

    // Now 'timeZeroBalances' holds the absolute starting baseline before any transactions in the DB!
    // Now we can just walk FORWARDS through time, which is much easier to reason about.
    const forwardTxs = [...sortedTxs].reverse(); // Oldest first
    const forwardAccts = { ...timeZeroBalances };
    
    let currentForwardTxIndex = 0;

    // Walk through every year and month forward
    // For months BEFORE the target year, just update balances.
    // For months IN the target year, record the data!
    for (const tx of forwardTxs) {
        const txDate = parseLocalDate(tx.date);
        const y = txDate.getFullYear();
        const m = txDate.getMonth();
        const amt = Number(tx.amount) || 0;

        // If this transaction is strictly BEFORE our target year, just apply it to balances
        if (y < targetYear) {
            this.applyTransactionForward(tx, forwardAccts, amt);
            continue;
        }

        // What if there are months in the target year with NO transactions?
        // We need to capture starting balances at the *beginning* of processing a month
        // We can do this lazily. The `results` array is pre-filled.
    }

    // Let's refine the forward pass to be explicitly bucketed by month
    // Reset forward pass
    const finalAccts = { ...timeZeroBalances };
    
    // Record starting balances for January (Index 0)
    // Wait, we have to apply all transactions UP TO Dec 31 of (targetYear - 1) first.
    forwardTxs.forEach(tx => {
        const d = parseLocalDate(tx.date);
        if (d.getFullYear() < targetYear) {
            this.applyTransactionForward(tx, finalAccts, Number(tx.amount) || 0);
        }
    });

    // Now finalAccts holds the exact balance at Jan 1, 00:00 of the Target Year!
    let runningForwardTotal = Object.values(finalAccts).reduce((sum, val) => sum + val, 0);

    for (let m = 0; m < 12; m++) {
        results[m].startingBalance = runningForwardTotal;
        
        // Find transactions for this specific month
        const monthTxs = forwardTxs.filter(tx => {
            const d = parseLocalDate(tx.date);
            return d.getFullYear() === targetYear && d.getMonth() === m;
        });

        // Apply them and calculate income/expense
        monthTxs.forEach(tx => {
            const amt = Number(tx.amount) || 0;
            this.applyTransactionForward(tx, finalAccts, amt);
            
            if (tx.type === 'income') results[m].totalIncome += amt;
            else if (tx.type === 'expense') results[m].totalExpense += amt;
            // Transfers don't affect total income/expense, just account distributions
        });

        // After all transactions for the month are applied, this is the end balance
        runningForwardTotal = Object.values(finalAccts).reduce((sum, val) => sum + val, 0);
        results[m].endBalance = runningForwardTotal;
        
        // Deep copy end-of-month account balances
        results[m].accountBalances = { ...finalAccts };
    }

    return results;
  },

  applyTransactionForward(tx, balancesMap, amount) {
      if (tx.type === 'income' && tx.accountId && balancesMap[tx.accountId] !== undefined) {
          balancesMap[tx.accountId] += amount;
      } else if (tx.type === 'expense' && tx.accountId && balancesMap[tx.accountId] !== undefined) {
          balancesMap[tx.accountId] -= amount;
      } else if (tx.type === 'transfer') {
          if (tx.fromAccountId && balancesMap[tx.fromAccountId] !== undefined) {
              balancesMap[tx.fromAccountId] -= amount;
          }
          if (tx.toAccountId && balancesMap[tx.toAccountId] !== undefined) {
              balancesMap[tx.toAccountId] += amount;
          }
      }
  },

  renderMonthlySummary(container, data) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let html = `
      <div class="balances-card">
        <table class="balances-table summary-table">
          <thead>
            <tr>
              <th>Month</th>
              <th class="align-right">Starting Balance</th>
              <th class="align-right">Income</th>
              <th class="align-right">Expenses</th>
              <th class="align-right">Net Change</th>
              <th class="align-right">Ending Balance</th>
            </tr>
          </thead>
          <tbody>
    `;

    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach((monthData, idx) => {
      const netChange = monthData.totalIncome - monthData.totalExpense;
      const netChangeClass = netChange >= 0 ? 'pos' : 'neg';
      
      totalIncome += monthData.totalIncome;
      totalExpense += monthData.totalExpense;

      html += `
        <tr>
          <td><strong>${monthNames[idx]}</strong></td>
          <td class="align-right">${formatCurrency(monthData.startingBalance)}</td>
          <td class="align-right text-success">+${formatCurrency(monthData.totalIncome)}</td>
          <td class="align-right text-danger">-${formatCurrency(monthData.totalExpense)}</td>
          <td class="align-right ${netChangeClass}">${netChange > 0 ? '+' : ''}${formatCurrency(netChange)}</td>
          <td class="align-right font-bold">${formatCurrency(monthData.endBalance)}</td>
        </tr>
      `;
    });

    const yearNetChange = totalIncome - totalExpense;
    html += `
        <tr class="total-row">
          <td class="font-bold underline">Year Summary</td>
          <td class="align-right font-bold">${formatCurrency(data[0].startingBalance)}</td>
          <td class="align-right font-bold text-success">+${formatCurrency(totalIncome)}</td>
          <td class="align-right font-bold text-danger">-${formatCurrency(totalExpense)}</td>
          <td class="align-right font-bold ${yearNetChange >= 0 ? 'pos' : 'neg'}">
            ${yearNetChange > 0 ? '+' : ''}${formatCurrency(yearNetChange)}
          </td>
          <td class="align-right font-bold box-shadow-thin">${formatCurrency(data[11].endBalance)}</td>
        </tr>
      </tbody>
    </table>
  </div>
    `;

    container.innerHTML = html;
  },

  renderAccountBreakdown(container, data, accounts) {
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // We only want to show accounts that exist AND maybe filter out zero-forever accounts?
    // Let's just show all active accounts to keep it simple and perfectly aligned.
    
    let html = `
      <div class="balances-card overflow-x-auto">
        <table class="balances-table accounts-table">
          <thead>
            <tr>
              <th class="sticky-col">Account</th>
              ${monthNamesShort.map(m => `<th class="align-right">${m}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    accounts.forEach(acc => {
      html += `
        <tr>
          <td class="sticky-col account-name-cell">
            <span class="account-icon">${acc.icon || '💰'}</span>
            ${acc.name}
          </td>
      `;
      
      // For each month, display the end balance
      data.forEach(monthData => {
         const bal = monthData.accountBalances[acc.id] || 0;
         const balClass = bal >= 0 ? '' : 'text-danger'; // Only red if negative balance
         html += `<td class="align-right ${balClass}">${formatCurrency(bal)}</td>`;
      });
      
      html += `</tr>`;
    });

    // Add a total row at the bottom
    html += `
      <tr class="total-row">
        <td class="sticky-col font-bold">Total</td>
        ${data.map(m => `<td class="align-right font-bold">${formatCurrency(m.endBalance)}</td>`).join('')}
      </tr>
    `;

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }
};
