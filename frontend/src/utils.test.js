import { describe, it, expect } from 'vitest';
import { formatCurrency, getFilteredTransactions, groupTransactions, getFABContext } from './utils.js';

describe('formatCurrency', () => {
    it('formats positive numbers as USD', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats negative numbers as USD', () => {
        expect(formatCurrency(-50.00)).toBe('-$50.00');
    });

    it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });
});

describe('getFilteredTransactions', () => {
    const txs = [
        { id: 1, date: '2023-01-01', amount: 100 },
        { id: 2, date: '2023-02-01', amount: 200 }
    ];

    it('filters by "All Time"', () => {
        const state = { transactions: txs, filter: { period: 'All Time' } };
        expect(getFilteredTransactions(state)).toHaveLength(2);
    });

    it('filters by "Custom Range"', () => {
        const state = {
            transactions: txs,
            filter: {
                period: 'Custom Range',
                startDate: '2023-01-15',
                endDate: '2023-02-15'
            }
        };
        expect(getFilteredTransactions(state)).toHaveLength(1);
        expect(getFilteredTransactions(state)[0].id).toBe(2);
    });

    it('returns empty list if no transactions match', () => {
        const state = {
            transactions: txs,
            filter: {
                period: 'Custom Range',
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            }
        };
        expect(getFilteredTransactions(state)).toHaveLength(0);
    });
});

describe('groupTransactions', () => {
    const txs = [
        { id: 1, amount: 50, type: 'expense', category: 'Food', retailer: 'Target', date: '2023-01-01' },
        { id: 2, amount: 30, type: 'expense', category: 'Food', retailer: 'Target', date: '2023-01-02' },
        { id: 3, amount: 100, type: 'income', category: 'Salary', retailer: 'Company', date: '2023-01-03' }
    ];

    it('returns empty object for empty groupByFields', () => {
        expect(groupTransactions(txs, [])).toEqual({});
    });

    it('groups by single field (Category)', () => {
        const result = groupTransactions(txs, ['category']);
        expect(Object.keys(result)).toEqual(['Food', 'Salary']);
        expect(result['Food'].total).toBe(-80);
        expect(result['Food'].txs).toHaveLength(2);
    });

    it('groups by multiple fields (Retailer > Category)', () => {
        const result = groupTransactions(txs, ['retailer', 'category']);
        expect(Object.keys(result).sort()).toEqual(['Company', 'Target']);

        // Target group
        expect(result['Target'].total).toBe(-80);
        expect(result['Target'].groups).toBeDefined();
        expect(result['Target'].groups['Food'].total).toBe(-80);
        expect(result['Target'].groups['Food'].txs).toHaveLength(2);

        // Company group
        expect(result['Company'].total).toBe(100);
        expect(result['Company'].groups['Salary'].total).toBe(100);
    });

    it('calculates totals correctly across types', () => {
        const mixed = [
            { amount: 100, type: 'income', category: 'X' },
            { amount: 40, type: 'expense', category: 'X' }
        ];
        const result = groupTransactions(mixed, ['category']);
        expect(result['X'].total).toBe(60);
    });
});

describe('getFABContext', () => {
    it('returns transaction context for transactions tab', () => {
        const state = { currentTab: 'transactions' };
        expect(getFABContext(state)).toEqual({ type: 'transaction', label: 'Add Transaction' });
    });

    it('returns null context for reports tab', () => {
        const state = { currentTab: 'reports' };
        expect(getFABContext(state)).toEqual({ type: null, label: null });
    });
});
