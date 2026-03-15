export const Reports = {
    render(container, transactions, budgets, categories) {
        container.innerHTML = `
      <div class="reports-container">
        <div class="report-section">
          <h3>Spending by Category</h3>
          <canvas id="category-chart"></canvas>
        </div>
        <div class="report-section">
          <h3>Budget vs Spend by Category</h3>
          <canvas id="budget-vs-spend-chart"></canvas>
        </div>
      </div>
    `;

        const categoryCtx = document.getElementById('category-chart').getContext('2d');
        const budgetCtx = document.getElementById('budget-vs-spend-chart').getContext('2d');

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

        // Get unique categories from both spending and budgets
        const allCategories = [...new Set([...Object.keys(spendTotals), ...Object.keys(budgetTotals)])].sort();

        // Doughnut Chart: Spending by Category
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
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: Chart.defaults.color }
                    }
                }
            }
        });

        // Bar Chart: Budget vs Spend
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
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: Chart.defaults.color }
                    },
                    x: {
                        ticks: { color: Chart.defaults.color }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: Chart.defaults.color }
                    }
                }
            }
        });
    }
};
