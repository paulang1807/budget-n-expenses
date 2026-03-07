export const Reports = {
    render(container, transactions) {
        container.innerHTML = `
      <div class="reports-container">
        <h3>Spending by Category</h3>
        <canvas id="category-chart"></canvas>
      </div>
    `;

        const ctx = document.getElementById('category-chart').getContext('2d');

        // Process data for the chart
        const categoryTotals = {};
        transactions.filter(tx => tx.type === 'expense').forEach(tx => {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount);
        });

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: Chart.defaults.color
                        }
                    }
                }
            }
        });
    }
};
