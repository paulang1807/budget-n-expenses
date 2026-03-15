export const Reports = {
    currentReport: 'spending',

    render(container, transactions, budgets, categories) {
        container.innerHTML = `
      <div class="reports-container">
        <div class="report-selector-container">
          <label for="report-select">Select Report:</label>
          <div class="select-wrapper">
            <select id="report-select">
              <option value="spending" ${this.currentReport === 'spending' ? 'selected' : ''}>Spending by Category</option>
              <option value="budget-vs-spend" ${this.currentReport === 'budget-vs-spend' ? 'selected' : ''}>Budget vs Spend by Category</option>
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
        </div>
      </div>
    `;

        const select = container.querySelector('#report-select');
        select.addEventListener('change', (e) => {
            this.currentReport = e.target.value;
            // Toggle visibility without full re-render for better UX
            const spendingSection = container.querySelector('#spending-section');
            const budgetSection = container.querySelector('#budget-vs-spend-section');

            if (this.currentReport === 'spending') {
                spendingSection.classList.remove('hidden');
                budgetSection.classList.add('hidden');
            } else {
                spendingSection.classList.add('hidden');
                budgetSection.classList.remove('hidden');
            }
        });

        const categoryCanvas = document.getElementById('category-chart');
        const budgetCanvas = document.getElementById('budget-vs-spend-chart');

        if (!categoryCanvas || !budgetCanvas) return;

        const categoryCtx = categoryCanvas.getContext('2d');
        const budgetCtx = budgetCanvas.getContext('2d');

        const spendTotals = {};
        transactions.filter(tx => tx.type === 'expense').forEach(tx => {
            const catId = tx.category;
            const categoryObj = categories.find(c => c.id === catId || c.name === catId);
            const catName = categoryObj ? categoryObj.name : (catId || 'No Category');
            spendTotals[catName] = (spendTotals[catName] || 0) + Number(tx.amount);
        });

        const budgetTotals = {};
        budgets.forEach(b => {
            const catId = b.category;
            const categoryObj = categories.find(c => c.id === catId || c.name === catId);
            const catName = categoryObj ? categoryObj.name : (catId || 'No Category');
            budgetTotals[catName] = (budgetTotals[catName] || 0) + Number(b.allocated);
        });

        const allCategories = [...new Set([...Object.keys(spendTotals), ...Object.keys(budgetTotals)])].sort();

        // Doughnut Chart
        const spendLabels = Object.keys(spendTotals);
        const spendData = Object.values(spendTotals);

        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: spendLabels,
                datasets: [{
                    data: spendData,
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
                        labels: { 
                            color: Chart.defaults.color,
                            padding: 20,
                            font: { size: 14 }
                        }
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
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: Chart.defaults.color,
                            font: { size: 12 }
                        }
                    },
                    x: {
                        ticks: { 
                            color: Chart.defaults.color,
                            font: { size: 12 }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { 
                            color: Chart.defaults.color,
                            padding: 20,
                            font: { size: 14 }
                        }
                    }
                }
            }
        });
    }
};
