import { describe, it, expect } from 'vitest';
import { formatCurrency, getFilteredTransactions, getFABContext, parseLocalDate, groupTransactions } from './utils.js';

describe('formatCurrency', () => {
    it('formats positive numbers as USD', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats negative numbers as USD', () => {
        // Note: Intl.NumberFormat might use a minus sign or parentheses depending on locale, 
        // but for en-US it's typically -$1,234.56 or ($1,234.56)
        const result = formatCurrency(-1234.56);
        expect(result).toMatch(/-?\$1,234\.56/);
    });

    it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });
});

describe('getFilteredTransactions', () => {
    const mockTransactions = [
        { id: '1', date: '2024-06-01', amount: 100, description: 'June Item' },
        { id: '2', date: '2024-05-15', amount: 50, description: 'May Item' },
        { id: '3', date: '2023-12-25', amount: 200, description: 'Previous Year Item' }
    ];

    it('filters by "All Time"', () => {
        const state = {
            transactions: mockTransactions,
            filter: { period: 'All Time' }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(3);
    });

    it('filters by "Custom Range"', () => {
        const state = {
            transactions: [
                { id: 1, amount: 50, date: '2023-01-01' },
                { id: 2, amount: 100, date: '2023-01-10' }
            ],
            filter: { period: 'Custom Range', startDate: '2023-01-05', endDate: '2023-01-15' }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(2);
    });

    it('returns empty list if no transactions match', () => {
        const state = {
            transactions: mockTransactions,
            filter: {
                period: 'Custom Range',
                startDate: '2025-01-01',
                endDate: '2025-01-31'
            }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(0);
    });
});

describe('getFABContext', () => {
    it('returns transaction context for transactions tab', () => {
        const state = { currentTab: 'transactions' };
        expect(getFABContext(state)).toEqual({ type: 'transaction', label: 'Add Transaction' });
    });

    it('returns budget context for budgets tab', () => {
        const state = { currentTab: 'budgets' };
        expect(getFABContext(state)).toEqual({ type: 'budget', label: 'Add Budget' });
    });

    it('returns account context for settings > accounts sub-tab', () => {
        const state = { currentTab: 'settings', currentSubTab: 'accounts' };
        expect(getFABContext(state)).toEqual({ type: 'account', label: 'Add Account' });
    });

    it('returns category context for settings > categories sub-tab', () => {
        const state = { currentTab: 'settings', currentSubTab: 'categories' };
        expect(getFABContext(state)).toEqual({ type: 'category', label: 'Add Category' });
    });

    it('returns retailer context for settings > retailers sub-tab', () => {
        const state = { currentTab: 'settings', currentSubTab: 'retailers' };
        expect(getFABContext(state)).toEqual({ type: 'retailer', label: 'Add Retailer' });
    });

    it('returns null context for settings > export sub-tab', () => {
        const state = { currentTab: 'settings', currentSubTab: 'export' };
        expect(getFABContext(state)).toEqual({ type: null, label: null });
    });

    it('returns null context for reports tab', () => {
        const state = { currentTab: 'reports' };
        expect(getFABContext(state)).toEqual({ type: null, label: null });
    });
});

describe('groupTransactions', () => {
    const txs = [
        { id: 1, amount: 50, type: 'expense', category: 'Food', retailer: 'Target', date: '2023-01-01' },
        { id: 2, amount: 30, type: 'expense', category: 'Food', retailer: 'Walmart', date: '2023-01-02' },
        { id: 3, amount: 100, type: 'income', category: 'Salary', retailer: 'Company', date: '2023-01-03' }
    ];

    it('returns empty object for groupBy "none"', () => {
        expect(groupTransactions(txs, 'none')).toEqual({});
    });

    it('groups by category correctly', () => {
        const result = groupTransactions(txs, 'category');
        expect(result['Food'].txs).toHaveLength(2);
        expect(result['Food'].total).toBe(-80);
        expect(result['Salary'].txs).toHaveLength(1);
        expect(result['Salary'].total).toBe(100);
    });

    it('groups by retailer correctly', () => {
        const result = groupTransactions(txs, 'retailer');
        expect(result['Target'].total).toBe(-50);
        expect(result['Walmart'].total).toBe(-30);
    });
});
