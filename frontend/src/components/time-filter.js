import { Calendar } from './calendar.js';

export const TimeFilter = {
  presets: [
    'This Month', 'Last Month', 'This Quarter', 'Last Quarter',
    'This Year', 'Last Year', 'Last 30 Days', 'Last 90 Days', 'Last 12 Months'
  ],

  render(isBudget = false) {
    if (isBudget) {
      const years = [2025, 2026, 2027];
      const months = [
        { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
        { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
        { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
        { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' }
      ];

      return `
        <div id="time-filter-modal" class="modal">
          <div class="modal-content budget-time-filter-modal">
            <h3>Select Budget Period</h3>
            <div class="budget-filter-controls">
              <div class="field">
                <label>Year</label>
                <select id="budget-filter-year">
                  ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                </select>
              </div>
              <div class="field">
                <label>Month</label>
                <select id="budget-filter-month">
                  <option value="all">All Months</option>
                  ${months.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button id="close-filter" class="btn">Cancel</button>
              <button id="apply-filter" class="btn primary">Apply</button>
            </div>
          </div>
        </div>
      `;
    }

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

  setup(onApply, currentFilter = {}, isBudget = false) {
    const modal = document.getElementById('time-filter-modal');
    
    if (isBudget) {
      const yearSelect = document.getElementById('budget-filter-year');
      const monthSelect = document.getElementById('budget-filter-month');
      
      const ref = currentFilter.referenceDate ? new Date(currentFilter.referenceDate) : new Date();
      yearSelect.value = ref.getFullYear();
      
      if (currentFilter.period === 'Year') {
          monthSelect.value = 'all';
      } else {
          monthSelect.value = ref.getMonth() + 1;
      }

      document.getElementById('apply-filter').addEventListener('click', () => {
        const year = parseInt(yearSelect.value);
        const monthVal = monthSelect.value;
        
        let filter;
        if (monthVal === 'all') {
          filter = {
            period: 'Year',
            referenceDate: new Date(year, 0, 1)
          };
        } else {
          filter = {
            period: 'Month',
            referenceDate: new Date(year, parseInt(monthVal) - 1, 1)
          };
        }
        
        onApply(filter);
        modal.remove();
      });

      document.getElementById('close-filter').addEventListener('click', () => modal.remove());
      return;
    }

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
