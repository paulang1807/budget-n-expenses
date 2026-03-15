import { formatCurrency, parseLocalDate } from '../utils.js';

export const Balances = {
  async render(container, state) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startYear = 2010;
    
    // Default to current year if not selected yet
    this.selectedYear = this.selectedYear || currentYear;
    // Default to summary view
    this.activeView = this.activeView || 'summary';

    // Fetch projected worth data and asset projections if not already provided
    if (!state.projectedWorth || !state.assetProjections) {
      try {
        const [pwResp, apResp] = await Promise.all([
          fetch(`${window.API_URL || 'http://localhost:3001/api'}/projected-worth`),
          fetch(`${window.API_URL || 'http://localhost:3001/api'}/asset-projections`)
        ]);
        state.projectedWorth = await pwResp.json();
        state.assetProjections = await apResp.json();
      } catch (err) {
        console.error('Failed to fetch worth/projections:', err);
        if (!state.projectedWorth) state.projectedWorth = [];
        if (!state.assetProjections) state.assetProjections = [];
      }
    }

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
          <button class="view-toggle-btn ${this.activeView === 'assets' ? 'active' : ''}" data-view="assets">Assets</button>
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
    } else if (this.activeView === 'accounts') {
      this.renderAccountBreakdown(contentArea, data, state.accounts, state);
    } else if (this.activeView === 'assets') {
      this.renderAssetBreakdown(contentArea, data, state.assets, state);
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
      startingProjected: 0,
      totalIncome: 0,
      totalExpense: 0,
      endBalance: 0,
      endProjected: 0,
      accountBalances: {}, // Actual end-of-month balances
      projectedBalances: {} // Projected end-of-month balances
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
        
        // Calculate starting projected worth total
        results[m].startingProjected = state.accounts.reduce((sum, acc) => {
          const proj = state.projectedWorth?.find(p => p.accountId === acc.id && p.year === targetYear && p.month === (m - 1));
          // If no projection for previous month end, use its actual balance
          if (m === 0) {
              // For Jan start, we use Dec of previous year projection or Jan 1 balance
              const prevProj = state.projectedWorth?.find(p => p.accountId === acc.id && p.year === (targetYear - 1) && p.month === 11);
              return sum + (prevProj ? Number(prevProj.amount) : finalAccts[acc.id]);
          }
          return sum + (proj ? Number(proj.amount) : (results[m-1]?.accountBalances[acc.id] || 0));
        }, 0);

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
        });

        // After all transactions for the month are applied, this is the end balance
        runningForwardTotal = Object.values(finalAccts).reduce((sum, val) => sum + val, 0);
        results[m].endBalance = runningForwardTotal;
        results[m].accountBalances = { ...finalAccts };

        // Calculate end-of-month projected balances
        results[m].projectedBalances = {};
        state.accounts.forEach(acc => {
            const proj = state.projectedWorth?.find(p => p.accountId === acc.id && p.year === targetYear && p.month === m);
            results[m].projectedBalances[acc.id] = proj ? Number(proj.amount) : finalAccts[acc.id];
        });

        // Add dynamic Assets to calculations
        results[m].assetValues = {};
        results[m].assetProjections = {};
        let monthAssetActualTotal = 0;
        let monthAssetProjectedTotal = 0;

        state.assets.forEach(asset => {
            const proj = state.assetProjections?.find(p => p.assetId === asset.id && p.year === targetYear && p.month === m);
            const actualValue = Number(asset.value) || 0;
            const projectedValue = proj ? Number(proj.amount) : actualValue;
            
            results[m].assetValues[asset.id] = actualValue;
            results[m].assetProjections[asset.id] = projectedValue;
            
            monthAssetActualTotal += actualValue;
            monthAssetProjectedTotal += projectedValue;
        });

        results[m].endBalance += monthAssetActualTotal;
        results[m].endProjected += monthAssetProjectedTotal;
        
        // Adjust starting balances for the NEXT month based on Assets too
        // (startingBalance in summary view should include assets)
        results[m].startingBalance += state.assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
        results[m].startingProjected += state.assets.reduce((sum, a) => {
            const prevM = m - 1;
            const prevY = prevM < 0 ? targetYear - 1 : targetYear;
            const normalizedM = prevM < 0 ? 11 : prevM;
            const proj = state.assetProjections?.find(p => p.assetId === a.id && p.year === prevY && p.month === normalizedM);
            return sum + (proj ? Number(proj.amount) : (Number(a.value) || 0));
        }, 0);

        results[m].endProjected = Object.values(results[m].projectedBalances).reduce((sum, val) => sum + val, 0) + monthAssetProjectedTotal;
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
              <th rowspan="2">Month</th>
              <th colspan="2" class="align-center border-left">Starting Balance</th>
              <th rowspan="2" class="align-right">Income</th>
              <th rowspan="2" class="align-right">Expenses</th>
              <th rowspan="2" class="align-right">Net Change</th>
              <th colspan="2" class="align-center border-left">Ending Balance</th>
            </tr>
            <tr>
              <th class="align-right sub-head border-left">Actual</th>
              <th class="align-right sub-head">Projected</th>
              <th class="align-right sub-head border-left">Actual</th>
              <th class="align-right sub-head">Projected</th>
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
          <td class="align-right border-left">${formatCurrency(monthData.startingBalance)}</td>
          <td class="align-right text-muted">${formatCurrency(monthData.startingProjected)}</td>
          <td class="align-right text-success">+${formatCurrency(monthData.totalIncome)}</td>
          <td class="align-right text-danger">-${formatCurrency(monthData.totalExpense)}</td>
          <td class="align-right ${netChangeClass}">${netChange > 0 ? '+' : ''}${formatCurrency(netChange)}</td>
          <td class="align-right font-bold border-left">${formatCurrency(monthData.endBalance)}</td>
          <td class="align-right font-bold text-muted">${formatCurrency(monthData.endProjected)}</td>
        </tr>
      `;
    });

    const yearNetChange = totalIncome - totalExpense;
    html += `
        <tr class="total-row">
          <td class="font-bold underline">Year Summary</td>
          <td class="align-right font-bold border-left">${formatCurrency(data[0].startingBalance)}</td>
          <td class="align-right font-bold text-muted">${formatCurrency(data[0].startingProjected)}</td>
          <td class="align-right font-bold text-success">+${formatCurrency(totalIncome)}</td>
          <td class="align-right font-bold text-danger">-${formatCurrency(totalExpense)}</td>
          <td class="align-right font-bold ${yearNetChange >= 0 ? 'pos' : 'neg'}">
            ${yearNetChange > 0 ? '+' : ''}${formatCurrency(yearNetChange)}
          </td>
          <td class="align-right font-bold border-left">${formatCurrency(data[11].endBalance)}</td>
          <td class="align-right font-bold text-muted">${formatCurrency(data[11].endProjected)}</td>
        </tr>
      </tbody>
    </table>
  </div>
    `;

    container.innerHTML = html;
  },

  renderAccountBreakdown(container, data, accounts, state) {
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // We only want to show accounts that exist AND maybe filter out zero-forever accounts?
    // Let's just show all active accounts to keep it simple and perfectly aligned.
    
    let html = `
      <div class="balances-card overflow-x-auto">
        <table class="balances-table accounts-table">
          <thead>
            <tr>
              <th rowspan="2" class="sticky-col border-right">Account</th>
              ${monthNamesShort.map(m => `<th colspan="2" class="align-center border-right">${m}</th>`).join('')}
            </tr>
            <tr>
              ${monthNamesShort.map(() => `
                <th class="align-right sub-head">Act</th>
                <th class="align-right sub-head border-right">Proj</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
    `;

      accounts.forEach(acc => {
        html += `
          <tr>
            <td class="sticky-col border-right">
              <div class="account-name-cell">
                <span class="account-icon">${acc.icon || '💰'}</span>
                ${acc.name}
              </div>
            </td>
        `;
        
        // For each month, display the end balance
        data.forEach((monthData, mIdx) => {
           const bal = monthData.accountBalances[acc.id] || 0;
           const proj = monthData.projectedBalances[acc.id] || 0;
           const balClass = bal >= 0 ? '' : 'text-danger';
           const isDifferent = Math.abs(bal - proj) > 0.01;
           const projClass = isDifferent ? 'text-primary' : 'text-muted';

           html += `
             <td class="align-right ${balClass}">${formatCurrency(bal)}</td>
             <td class="align-right ${projClass} border-right edit-projected" 
                 data-type="projected"
                 data-accid="${acc.id}" data-year="${this.selectedYear}" data-month="${mIdx}" data-current="${proj}">
               ${formatCurrency(proj)}
             </td>
           `;
        });
        
        html += `</tr>`;
      });

    // Add a total row at the bottom
    html += `
      <tr class="total-row">
        <td class="sticky-col font-bold border-right">
          <div class="account-name-cell">Total</div>
        </td>
        ${data.map(m => `
          <td class="align-right font-bold">${formatCurrency(m.endBalance)}</td>
          <td class="align-right font-bold text-muted border-right">${formatCurrency(m.endProjected)}</td>
        `).join('')}
      </tr>
    `;

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  },

  renderAssetBreakdown(container, data, assets, state) {
    const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let html = `
      <div class="balances-card overflow-x-auto">
        <table class="balances-table accounts-table">
          <thead>
            <tr>
              <th rowspan="2" class="sticky-col border-right">Asset</th>
              ${monthNamesShort.map(m => `<th colspan="2" class="align-center border-right">${m}</th>`).join('')}
            </tr>
            <tr>
              ${monthNamesShort.map(() => `
                <th class="align-right sub-head">Act</th>
                <th class="align-right sub-head border-right">Proj</th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    assets.forEach(asset => {
      html += `
        <tr>
          <td class="sticky-col border-right">
            <div class="account-name-cell">
              <span class="account-icon">${asset.icon || '🏠'}</span>
              ${asset.name}
            </div>
          </td>
      `;
      
      data.forEach((monthData, mIdx) => {
        const val = monthData.assetValues[asset.id] || 0;
        const proj = monthData.assetProjections[asset.id] || 0;
        const isDifferent = Math.abs(val - proj) > 0.01;
        const projClass = isDifferent ? 'text-primary' : 'text-muted';

        html += `
          <td class="align-right">${formatCurrency(val)}</td>
          <td class="align-right ${projClass} border-right edit-asset-projected" 
              data-assetid="${asset.id}" data-year="${this.selectedYear}" data-month="${mIdx}" data-current="${proj}">
            ${formatCurrency(proj)}
          </td>
        `;
      });
      
      html += `</tr>`;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    const self = this;
    container.querySelectorAll('.edit-asset-projected').forEach(cell => {
      cell.addEventListener('click', () => {
        const params = {
          assetId: cell.dataset.assetid,
          year: parseInt(cell.dataset.year),
          month: parseInt(cell.dataset.month),
          currentAmount: parseFloat(cell.dataset.current)
        };
        const mainContainer = document.querySelector('.balances-header-section').parentElement;
        self.renderAssetWorthModal(state, params, mainContainer);
      });
    });
  },

  renderAssetWorthModal(state, data, container) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const asset = state.assets.find(a => a.id === data.assetId);

    if (!asset) return;

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Edit Projected Asset Value</h2>
        <p>${asset.name} - ${monthNames[data.month]} ${data.year}</p>
        <div class="form-group">
          <label>Projected Value</label>
          <input type="number" id="asset-proj-input" value="${data.currentAmount}" step="0.01">
        </div>
        <div class="modal-actions">
          <button class="btn secondary cancel-btn">Cancel</button>
          <button class="btn primary save-btn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn').onclick = () => modal.remove();
    modal.querySelector('.save-btn').onclick = async () => {
      const amount = parseFloat(document.getElementById('asset-proj-input').value);
      if (isNaN(amount)) return;

      try {
        const resp = await fetch(`${window.API_URL || 'http://localhost:3001/api'}/asset-projections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetId: data.assetId,
            year: data.year,
            month: data.month,
            amount: amount
          })
        });

        if (resp.ok) {
          const index = state.assetProjections.findIndex(p => 
            p.assetId === data.assetId && p.year === data.year && p.month === data.month
          );
          if (index !== -1) {
            state.assetProjections[index].amount = amount;
          } else {
            state.assetProjections.push({ assetId: data.assetId, year: data.year, month: data.month, amount });
          }
          modal.remove();
          this.renderActiveView(container, state);
        }
      } catch (err) {
        console.error('Failed to save asset projection:', err);
      }
    };
  },

  renderProjectedWorthModal(state, data, container) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const account = state.accounts.find(a => a.id === data.accountId);

    if (!state.projectedWorth) state.projectedWorth = [];

    if (!account) {
      console.error('Account not found for ID:', data.accountId);
      return;
    }

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Edit Projected Worth</h2>
        <p>${account.name} - ${monthNames[data.month]} ${data.year}</p>
        <div class="form-group">
          <label>Projected Amount</label>
          <input type="number" id="proj-worth-input" value="${data.currentAmount}" step="0.01">
        </div>
        <div class="modal-actions">
          <button class="btn secondary cancel-btn">Cancel</button>
          <button class="btn primary save-btn">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.cancel-btn').onclick = () => modal.remove();
    modal.querySelector('.save-btn').onclick = async () => {
      const amount = parseFloat(document.getElementById('proj-worth-input').value);
      if (isNaN(amount)) return;

      try {
        const resp = await fetch(`${window.API_URL || 'http://localhost:3001/api'}/projected-worth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: data.accountId,
            year: data.year,
            month: data.month,
            amount: amount
          })
        });

        if (resp.ok) {
          // Update local state
          const index = state.projectedWorth.findIndex(pw => 
            pw.accountId === data.accountId && pw.year === data.year && pw.month === data.month
          );
          if (index !== -1) {
            state.projectedWorth[index].amount = amount;
          } else {
            state.projectedWorth.push({ accountId: data.accountId, year: data.year, month: data.month, amount });
          }
          modal.remove();
          this.renderActiveView(container, state);
        }
      } catch (err) {
        console.error('Failed to save projected worth:', err);
      }
    };
  }
};
