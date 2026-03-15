/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Reports } from './reports.js';

// Mock Chart.js
global.Chart = vi.fn().mockImplementation(function() {
    return {
        destroy: vi.fn(),
        update: vi.fn()
    };
});
global.Chart.defaults = { color: '#000' };

describe('Reports Component', () => {
    let container;

    beforeEach(() => {
        document.body.innerHTML = '<div id="container"></div>';
        container = document.getElementById('container');
        vi.clearAllMocks();
        // Reset Reports state
        Reports.currentReport = 'spending';
        Reports.incomeView = 'totals';
        Reports.selectedIncomeCategories = [];
    });

    it('should calculate and render spending by category correctly', () => {
        const transactions = [
            { id: '1', type: 'expense', amount: 100, category: 'Food', date: '2024-03-01' },
            { id: '2', type: 'expense', amount: 50, category: 'Food', date: '2024-03-05' },
            { id: '3', type: 'expense', amount: 75, category: 'Transport', date: '2024-03-10' },
            { id: '4', type: 'income', amount: 1000, category: 'Salary', date: '2024-03-15' } // Should be ignored
        ];
        const budgets = [];
        const categories = [
            { id: 'cat1', name: 'Food', type: 'expense' },
            { id: 'cat2', name: 'Transport', type: 'expense' }
        ];

        Reports.render(container, { 
            transactions, 
            budgets, 
            categories, 
            filter: { referenceDate: '2024-03-15' }, 
            render: vi.fn() 
        });

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

    it('should calculate and render income report correctly (Month View)', () => {
        const transactions = [
            { id: '1', type: 'income', amount: 500, category: 'Salary', date: '2024-03-01' },
            { id: '2', type: 'income', amount: 300, category: 'Salary', date: '2024-03-05' },
            { id: '3', type: 'income', amount: 200, category: 'Interest', date: '2024-03-10' },
            { id: '4', type: 'expense', amount: 100, category: 'Food', date: '2024-03-15' } // Should be ignored
        ];
        const budgets = [];
        const categories = [
            { id: 'cat1', name: 'Salary', type: 'income' },
            { id: 'cat2', name: 'Interest', type: 'income' }
        ];

        Reports.currentReport = 'income';
        Reports.render(container, { 
            transactions, 
            budgets, 
            categories, 
            filter: { referenceDate: '2024-03-15', period: 'Month' },
            render: vi.fn()
        });

        // Verification
        expect(container.innerHTML).toContain('Income Report');
        expect(container.innerHTML).toContain('<canvas id="income-chart"></canvas>');
        expect(container.innerHTML).not.toContain('income-report-filters'); // No filters in month view

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        
        // Find the doughnut chart that has income data
        const incomeDoughnut = chartCalls.find(call => 
            call[1].type === 'doughnut' && 
            call[1].data.labels.includes('Salary')
        );
        
        expect(incomeDoughnut).toBeDefined();
        const data = incomeDoughnut[1].data;
        expect(data.labels).toContain('Salary');
        expect(data.labels).toContain('Interest');
        
        const salaryIdx = data.labels.indexOf('Salary');
        const interestIdx = data.labels.indexOf('Interest');
        expect(data.datasets[0].data[salaryIdx]).toBe(800);
        expect(data.datasets[0].data[interestIdx]).toBe(200);
    });

    it('should show sub-filters and render bar chart in Year View', () => {
        const transactions = [
            { id: '1', type: 'income', amount: 1000, category: 'Salary', date: '2024-01-15' },
            { id: '2', type: 'income', amount: 500, category: 'Interest', date: '2024-02-15' }
        ];
        const categories = [
            { id: 'Salary', name: 'Salary', type: 'income' },
            { id: 'Interest', name: 'Interest', type: 'income' }
        ];

        Reports.currentReport = 'income';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories, 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });

        expect(container.innerHTML).toContain('income-report-filters');
        expect(container.innerHTML).toContain('income-view-select');
        expect(container.innerHTML).toContain('income-category-pills');
        expect(container.querySelector('#income-section').classList.contains('expanded-height')).toBe(true);

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar' && call[1].data.labels.includes('Jan'));
        expect(barChart).toBeDefined();
        
        // Check labels (Jan-Dec)
        expect(barChart[1].data.labels).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
    });

    it('should only show income categories in Year View filters and chart datasets', () => {
        const transactions = [
            { id: '1', type: 'income', amount: 1000, category: 'Sal', date: '2024-01-15' },
            { id: '2', type: 'expense', amount: 500, category: 'Exp', date: '2024-01-15' },
            { id: '3', type: 'income', amount: 200, category: 'Exp', date: '2024-02-15' } // malformed
        ];
        const categories = [
            { id: 'Sal', name: 'Salary', type: 'income' },
            { id: 'Exp', name: 'Rent', type: 'expense' }
        ];

        Reports.currentReport = 'income';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories, 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });

        const pillContainer = container.querySelector('#income-category-pills');
        expect(pillContainer.innerHTML).toContain('Salary');
        expect(pillContainer.innerHTML).not.toContain('Rent');

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const incomeChart = chartCalls.find(call => 
            call[1].type === 'bar' && 
            JSON.stringify(call[1].data).includes('Salary')
        );
        
        const datasets = incomeChart[1].data.datasets;
        expect(datasets.length).toBe(1);
        expect(datasets[0].label).toBe('Salary');
    });

    it('should correctly filter income categories in Year View', () => {
        const transactions = [
            { id: '1', type: 'income', amount: 1000, category: 'cat1', date: '2024-01-15' },
            { id: '2', type: 'income', amount: 500, category: 'cat2', date: '2024-01-15' }
        ];
        const categories = [
            { id: 'cat1', name: 'Salary', type: 'income' },
            { id: 'cat2', name: 'Interest', type: 'income' }
        ];

        Reports.currentReport = 'income';
        Reports.selectedIncomeCategories = ['cat1']; // Only Salary
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories, 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar' && call[1].data.labels.includes('Jan'));
        
        const datasets = barChart[1].data.datasets;
        expect(datasets.length).toBe(1);
        expect(datasets[0].label).toBe('Salary');
    });

    it('should switch between stacked and grouped bars in Year View', () => {
        const transactions = [
            { id: '1', type: 'income', amount: 1000, category: 'cat1', date: '2024-01-15' },
            { id: '2', type: 'income', amount: 500, category: 'cat2', date: '2024-01-15' }
        ];
        const categories = [
            { id: 'cat1', name: 'Salary', type: 'income' },
            { id: 'cat2', name: 'Interest', type: 'income' }
        ];

        Reports.currentReport = 'income';
        
        // Test Totals (Stacked)
        Reports.incomeView = 'totals';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories, 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });
        
        let chartCalls = vi.mocked(global.Chart).mock.calls;
        let barChart = chartCalls.find(call => call[1].type === 'bar' && call[1].data.labels.includes('Jan'));
        expect(barChart[1].data.datasets[0].stack).toBe('stack0');
        expect(barChart[1].data.datasets[1].stack).toBe('stack0');

        vi.clearAllMocks();

        // Test Types (Grouped)
        Reports.incomeView = 'types';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories, 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });
        
        chartCalls = vi.mocked(global.Chart).mock.calls;
        barChart = chartCalls.find(call => call[1].type === 'bar' && call[1].data.labels.includes('Jan'));
        expect(barChart[1].data.datasets[0].stack).toBe('stack0');
        expect(barChart[1].data.datasets[1].stack).toBe('stack1');
    });

    it('should have legend enabled for income reports', () => {
        const transactions = [{ id: '1', type: 'income', amount: 100, category: 'Salary', date: '2024-03-01' }];
        Reports.currentReport = 'income';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories: [{ id: 'Salary', name: 'Salary', type: 'income' }], 
            filter: { referenceDate: '2024-03-15', period: 'Month' },
            render: vi.fn()
        });

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        // The income report chart in Month view will have 'Salary' in its data labels or datasets
        const incomeChart = chartCalls.find(call => 
            (call[1].type === 'doughnut' || call[1].type === 'bar') && 
            JSON.stringify(call[1].data).includes('Salary')
        );
        expect(incomeChart[1].options.plugins.legend.display).toBe(true);
    });

    it('should have legend enabled and sufficient padding for Year View income reports', () => {
        const transactions = [{ id: '1', type: 'income', amount: 100, category: 'Salary', date: '2024-01-01' }];
        Reports.currentReport = 'income';
        Reports.render(container, { 
            transactions, 
            budgets: [], 
            categories: [{ id: 'Salary', name: 'Salary', type: 'income' }], 
            filter: { referenceDate: '2024-06-15', period: 'Year' },
            render: vi.fn()
        });

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const incomeChart = chartCalls.find(call => 
            call[1].type === 'bar' && 
            JSON.stringify(call[1].data).includes('Salary')
        );
        expect(incomeChart[1].options.plugins.legend.display).toBe(true);
        expect(incomeChart[1].options.plugins.legend.labels.padding).toBeGreaterThanOrEqual(30);
    });

    it('should calculate and render budget vs spend correctly', () => {
        const transactions = [
            { id: '1', type: 'expense', amount: 100, category: 'Food', date: '2024-03-01' },
            { id: '2', type: 'expense', amount: 80, category: 'Transport', date: '2024-03-05' }
        ];
        const budgets = [
            { id: 'b1', category: 'Food', allocated: 200, year: 2024, month: 3 },
            { id: 'b2', category: 'Rent', allocated: 1000, year: 2024, month: 3 }
        ];

        Reports.render(container, { 
            transactions, 
            budgets, 
            categories: [], 
            filter: { referenceDate: '2024-03-15', period: 'Month' },
            render: vi.fn() 
        });

        // Verification
        expect(container.innerHTML).toContain('Budget vs Spend by Category');
        expect(container.innerHTML).toContain('<canvas id="budget-vs-spend-chart"></canvas>');

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar');
        
        expect(barChart).toBeDefined();
        const data = barChart[1].data;
        
        // All categories should be present: Food, Transport, Rent
        expect(data.labels.sort()).toEqual(['Food', 'Rent', 'Transport'].sort());

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
        const transactions = [{ id: '1', type: 'expense', amount: 50, date: '2024-03-01' }]; // No category
        const budgets = [{ id: 'b1', allocated: 100, year: 2024, month: 3 }]; // No category

        Reports.render(container, { 
            transactions, 
            budgets, 
            categories: [], 
            filter: { referenceDate: '2024-03-15', period: 'Month' },
            render: vi.fn()
        });

        const chartCalls = vi.mocked(global.Chart).mock.calls;
        const barChart = chartCalls.find(call => call[1].type === 'bar');
        
        expect(barChart).toBeDefined();
        const data = barChart[1].data;
        expect(data.labels).toContain('No Category');
        
        const noCatIdx = data.labels.indexOf('No Category');
        expect(data.datasets[0].data[noCatIdx]).toBe(100);
        expect(data.datasets[1].data[noCatIdx]).toBe(50);
    });

    it('should toggle report visibility via dropdown', () => {
        const mockState = { transactions: [], budgets: [], categories: [], filter: {}, render: vi.fn() };
        Reports.render(container, mockState);

        const select = container.querySelector('#report-select');
        
        // Switch to income
        select.value = 'income';
        select.dispatchEvent(new Event('change'));
        
        expect(mockState.render).toHaveBeenCalled();
    });
});
