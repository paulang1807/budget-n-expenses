import { Calendar } from './calendar.js';

export const TimeFilter = {
  presets: [
    'This Month', 'Last Month', 'This Quarter', 'Last Quarter',
    'This Year', 'Last Year', 'Last 30 Days', 'Last 90 Days', 'Last 12 Months'
  ],

  render() {
    return `
      <div id="time-filter-modal" class="modal">
        <div class="modal-content time-filter-modal-content calendar-modal-override">
          <h3>Select Time Period</h3>
          <div class="time-filter-grid-triple">
            <div class="preset-column">
              <h4>Presets</h4>
              <div class="preset-filters-vertical">
                ${this.presets.map(p => `<button class="preset-btn" data-period="${p}">${p}</button>`).join('')}
              </div>
            </div>
            
            <div class="calendar-selection-column">
               <div class="calendar-wrapper">
                  <h4>From</h4>
                  <div id="calendar-from-container"></div>
               </div>
               <div class="calendar-wrapper">
                  <h4>To</h4>
                  <div id="calendar-to-container"></div>
               </div>
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

  setup(onApply, currentFilter = {}) {
    const modal = document.getElementById('time-filter-modal');
    let activePeriod = currentFilter.period || 'This Month';
    let customRange = {
      startDate: currentFilter.startDate || null,
      endDate: currentFilter.endDate || null
    };

    // Highlight active preset on load
    if (activePeriod !== 'Custom Range') {
      const activeBtn = document.querySelector(`.preset-btn[data-period="${activePeriod}"]`);
      if (activeBtn) activeBtn.classList.add('active');
    }

    const calendarFrom = new Calendar('calendar-from-container', {
      selectedDate: customRange.startDate,
      onSelect: (date) => {
        customRange.startDate = date;
        activePeriod = 'Custom Range';
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      }
    });

    const calendarTo = new Calendar('calendar-to-container', {
      selectedDate: customRange.endDate,
      onSelect: (date) => {
        customRange.endDate = date;
        activePeriod = 'Custom Range';
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      }
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        activePeriod = period;

        // Add active class for visual feedback
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Clear custom range selection when a preset is chosen
        customRange.startDate = null;
        customRange.endDate = null;
        calendarFrom.clearSelection();
        calendarTo.clearSelection();

        // Immediately apply preset and close modal
        onApply({ period });
        modal.remove();
      });
    });

    document.getElementById('apply-filter').addEventListener('click', () => {
      if (activePeriod === 'Custom Range') {
        onApply({
          period: 'Custom Range',
          startDate: customRange.startDate,
          endDate: customRange.endDate
        });
      } else {
        onApply({ period: activePeriod });
      }
      modal.remove();
    });

    document.getElementById('close-filter').addEventListener('click', () => modal.remove());
  }
};
