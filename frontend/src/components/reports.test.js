/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reports } from './reports.js';

// Mock Chart.js
global.Chart = vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
}));
global.Chart.defaults = { color: '#000' };

describe('Reports Component', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        container = document.getElementById('container');
        vi.clearAllMocks();
    });

    it('should calculate and render spending by category correctly', () => {
        const transactions = [
            { id: '1', type: 'expense', amount: 100, category: 'Food' },
            { id: '2', type: 'expense', amount: 50, category: 'Food' },
            { id: '3', type: 'expense', amount: 75, category: 'Transport' },
            { id: '4', type: 'income', amount: 1000, category: 'Salary' } // Should be ignored
        ];
        const budgets = [];
        const categories = [
            { id: 'cat1', name: 'Food' },
            { id: 'cat2', name: 'Transport' }
        ];

        Reports.render(container, transactions, budgets, categories);

        // Verification
        expect(container.innerHTML).toContain('Spending by Category');
        expect(container.innerHTML).toContain('<canvas id="category-chart"></canvas>');

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const doughnutChart = chartCalls.find(call => call[1].type === 'doughnut');
        
        expect(doughnutChart).toBeDefined();
        const data = doughnutChart[1].data;
        expect(data.labels).toContain('Food');
        expect(data.labels).toContain('Transport');
        
        const foodIndex = data.labels.indexOf('Food');
        const transportIndex = data.labels.indexOf('Transport');
        expect(data.datasets[0].data[foodIndex]).toBe(150);
        expect(data.datasets[0].data[transportIndex]).toBe(75);
    });

    it('should calculate and render budget vs spend correctly', () => {
        const transactions = [
            { id: '1', type: 'expense', amount: 100, category: 'Food' },
            { id: '2', type: 'expense', amount: 80, category: 'Transport' }
        ];
        const budgets = [
            { id: 'b1', category: 'Food', allocated: 200, year: 2024, month: 3 },
            { id: 'b2', category: 'Rent', allocated: 1000, year: 2024, month: 3 }
        ];

        Reports.render(container, transactions, budgets);

        // Verification
        expect(container.innerHTML).toContain('Budget vs Spend by Category');
        expect(container.innerHTML).toContain('<canvas id="budget-vs-spend-chart"></canvas>');

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar');
        
        expect(barChart).toBeDefined();
        const data = barChart[1].data;
        
        // All categories should be present: Food, Transport, Rent
        expect(data.labels).toContain('Food');
        expect(data.labels).toContain('Transport');
        expect(data.labels).toContain('Rent');

        const foodIdx = data.labels.indexOf('Food');
        const transportIdx = data.labels.indexOf('Transport');
        const rentIdx = data.labels.indexOf('Rent');

        // Budget Dataset (index 0)
        expect(data.datasets[0].data[foodIdx]).toBe(200);
        expect(data.datasets[0].data[transportIdx]).toBe(0);
        expect(data.datasets[0].data[rentIdx]).toBe(1000);

        // Actual Spend Dataset (index 1)
        expect(data.datasets[1].data[foodIdx]).toBe(100);
        expect(data.datasets[1].data[transportIdx]).toBe(80);
        expect(data.datasets[1].data[rentIdx]).toBe(0);
    });

    it('should handle missing categories', () => {
        const transactions = [{ id: '1', type: 'expense', amount: 50 }]; // No category
        const budgets = [{ id: 'b1', allocated: 100 }]; // No category

        Reports.render(container, transactions, budgets);

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar');
        
        expect(barChart.getDOM).toBeUndefined(); // Verification of mock call
        const data = barChart[1].data;
        expect(data.labels).toContain('No Category');
        
        const noCatIdx = data.labels.indexOf('No Category');
        expect(data.datasets[0].data[noCatIdx]).toBe(100);
        expect(data.datasets[1].data[noCatIdx]).toBe(50);
    });
});
