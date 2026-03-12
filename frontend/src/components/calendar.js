import { parseLocalDate } from '../utils.js';

export class Calendar {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.onSelect = options.onSelect || (() => { });
        this.selectedDate = options.selectedDate ? parseLocalDate(options.selectedDate) : null;
        this.currentViewDate = this.selectedDate ? new Date(this.selectedDate) : new Date();
        this.currentViewDate.setDate(1); // Set to start of month

        this.render();
    }

    render() {
        const year = this.currentViewDate.getFullYear();
        const month = this.currentViewDate.getMonth();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(this.currentViewDate);

        this.container.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <div class="month-year-selector">
                        <span class="view-label">${monthName} ${year}</span>
                        <span class="dropdown-arrow">▼</span>
                    </div>
                    <div class="header-nav">
                        <button class="nav-btn prev-month" title="Previous Month">↑</button>
                        <button class="nav-btn next-month" title="Next Month">↓</button>
                    </div>
                </div>
                <div class="calendar-weekdays">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                </div>
                <div class="calendar-grid">
                    ${this.generateDays(year, month)}
                </div>
                <div class="calendar-footer">
                    <button class="footer-btn clear-btn">Clear</button>
                    <button class="footer-btn today-btn">Today</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    generateDays(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        let html = '';

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<div class="day-cell muted">${prevMonthDays - i}</div>`;
        }

        // Current month days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isSelected = this.selectedDate &&
                this.selectedDate.getFullYear() === year &&
                this.selectedDate.getMonth() === month &&
                this.selectedDate.getDate() === day;

            html += `
                <div class="day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                     data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}">
                    ${day}
                </div>
            `;
        }

        // Next month padding to fill grid (6 rows * 7 days = 42 total)
        const totalCells = 42;
        const remainingCells = totalCells - (firstDay + daysInMonth);
        for (let i = 1; i <= remainingCells; i++) {
            html += `<div class="day-cell muted">${i}</div>`;
        }

        return html;
    }

    setupEventListeners() {
        this.container.querySelector('.prev-month').addEventListener('click', () => this.changeMonth(-1));
        this.container.querySelector('.next-month').addEventListener('click', () => this.changeMonth(1));
        this.container.querySelector('.clear-btn').addEventListener('click', () => this.clearSelection());
        this.container.querySelector('.today-btn').addEventListener('click', () => this.goToToday());

        this.container.querySelectorAll('.day-cell:not(.muted)').forEach(cell => {
            cell.addEventListener('click', () => {
                this.selectedDate = parseLocalDate(cell.dataset.date);
                this.render();
                this.onSelect(cell.dataset.date);
            });
        });
    }

    changeMonth(delta) {
        this.currentViewDate.setMonth(this.currentViewDate.getMonth() + delta);
        this.render();
    }

    clearSelection() {
        this.selectedDate = null;
        this.render();
        this.onSelect(null);
    }

    goToToday() {
        const today = new Date();
        this.selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        this.currentViewDate = new Date(today.getFullYear(), today.getMonth(), 1);
        this.render();

        // Generate local YYYY-MM-DD string
        const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        this.onSelect(localDateString);
    }

    setSelectedDate(dateString) {
        if (!dateString) {
            this.selectedDate = null;
        } else {
            this.selectedDate = parseLocalDate(dateString);
            this.currentViewDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
        }
        this.render();
    }
}
