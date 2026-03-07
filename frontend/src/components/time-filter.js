export const TimeFilter = {
    presets: [
        'This Month', 'Last Month', 'This Quarter', 'Last Quarter',
        'This Year', 'Last Year', 'Last 30 Days', 'Last 90 Days', 'Last 12 Months', 'Custom Range'
    ],

    render() {
        return `
      <div id="time-filter-modal" class="modal">
        <div class="modal-content">
          <h3>Select Time Period</h3>
          <div class="preset-filters">
            ${this.presets.map(p => `<button class="preset-btn" data-period="${p}">${p}</button>`).join('')}
          </div>
          <div id="custom-range-inputs" style="display: none;">
            <div class="date-input-group">
              <label>From:</label>
              <input type="date" id="start-date-picker">
              <input type="text" id="start-date-text" placeholder="YYYY-MM-DD">
            </div>
            <div class="date-input-group">
              <label>To:</label>
              <input type="date" id="end-date-picker">
              <input type="text" id="end-date-text" placeholder="YYYY-MM-DD">
            </div>
          </div>
          <div class="modal-actions">
            <button id="close-filter" class="btn">Cancel</button>
            <button id="apply-filter" class="btn primary">Apply</button>
          </div>
        </div>
      </div>
    `;
    },

    setup(onApply) {
        const modal = document.getElementById('time-filter-modal');
        const customSection = document.getElementById('custom-range-inputs');

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                if (period === 'Custom Range') {
                    customSection.style.display = 'block';
                } else {
                    customSection.style.display = 'none';
                    onApply({ period });
                    modal.remove();
                }
            });
        });

        // Synchronize date picker and text input
        ['start', 'end'].forEach(type => {
            const picker = document.getElementById(`${type}-date-picker`);
            const text = document.getElementById(`${type}-date-text`);
            picker.addEventListener('change', (e) => text.value = e.target.value);
            text.addEventListener('input', (e) => picker.value = e.target.value);
        });

        document.getElementById('apply-filter').addEventListener('click', () => {
            const startDate = document.getElementById('start-date-text').value;
            const endDate = document.getElementById('end-date-text').value;
            onApply({ period: 'Custom Range', startDate, endDate });
            modal.remove();
        });

        document.getElementById('close-filter').addEventListener('click', () => modal.remove());
    }
};
