import { describe, it, expect } from 'vitest';
import { formatCurrency, getFilteredTransactions, groupTransactions, getFABContext, sortTransactions } from './utils.js';

describe('formatCurrency', () => {
    it('formats positive numbers as USD', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('formats negative numbers as USD', () => {
        expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });
});

describe('getFilteredTransactions', () => {
    const transactions = [
        { date: '2023-01-01', description: 'A' },
        { date: '2023-02-01', description: 'B' },
        { date: '2023-03-01', description: 'C' }
    ];

    it('filters by "All Time"', () => {
        const state = {
            transactions,
            filter: { period: 'All Time' }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(3);
    });

    it('filters by "Custom Range"', () => {
        const state = {
            transactions,
            filter: {
                period: 'Custom Range',
                startDate: '2023-01-15',
                endDate: '2023-02-15'
            }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(1);
        expect(result[0].description).toBe('B');
    });

    it('returns empty list if no transactions match', () => {
        const state = {
            transactions,
            filter: {
                period: 'Custom Range',
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(0);
    });
});

describe('groupTransactions', () => {
    const txs = [
        { id: 1, amount: 50, type: 'expense', category: 'Food', retailer: 'Target', date: '2023-01-01' },
        { id: 2, amount: 30, type: 'expense', category: 'Food', retailer: 'Target', date: '2023-01-02' },
        { id: 3, amount: 100, type: 'income', category: 'Salary', retailer: 'Company', date: '2023-01-03' }
    ];

    it('returns empty object for empty groupByFields', () => {
        expect(groupTransactions(txs, [], [{ field: 'date', order: 'desc' }])).toEqual({});
    });

    it('groups by single field (Category)', () => {
        const result = groupTransactions(txs, ['category'], [{ field: 'date', order: 'desc' }]);
        expect(Object.keys(result).sort()).toEqual(['Food', 'Salary']);
        expect(result['Food'].total).toBe(-80);
        expect(result['Food'].txs).toHaveLength(2);
    });

    it('groups by multiple fields (Retailer > Category)', () => {
        const result = groupTransactions(txs, ['retailer', 'category'], [{ field: 'date', order: 'desc' }]);
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
        const result = groupTransactions(mixed, ['category'], [{ field: 'date', order: 'desc' }]);
        expect(result['X'].total).toBe(60);
    });

    it('sorts transactions within groups', () => {
        const txsForSort = [
            { id: 1, amount: 50, type: 'expense', category: 'A', date: '2023-01-01' },
            { id: 2, amount: 100, type: 'expense', category: 'A', date: '2023-01-02' }
        ];
        const result = groupTransactions(txsForSort, ['category'], [{ field: 'amount', order: 'desc' }]);
        // -100 is less than -50, so in desc order: -50, -100
        expect(result['A'].txs[0].id).toBe(1);
        expect(result['A'].txs[1].id).toBe(2);
    });
});

describe('sortTransactions', () => {
    const txs = [
        { id: 1, amount: 50, type: 'expense', date: '2023-01-01', retailer: 'Target' },
        { id: 2, amount: 100, type: 'expense', date: '2023-01-02', retailer: 'Amazon' },
        { id: 3, amount: 200, type: 'income', date: '2023-01-03', retailer: 'Amazon' }
    ];

    it('sorts by amount asc (Signed Amounts)', () => {
        // Expenses are -50, -100. Income is 200.
        // ASC: -100, -50, 200
        const result = sortTransactions(txs, [{ field: 'amount', order: 'asc' }]);
        expect(result[0].id).toBe(2); // -100
        expect(result[1].id).toBe(1); // -50
        expect(result[2].id).toBe(3); // 200
    });

    it('sorts by amount desc (Signed Amounts)', () => {
        // DESC: 200, -50, -100
        const result = sortTransactions(txs, [{ field: 'amount', order: 'desc' }]);
        expect(result[0].id).toBe(3); // 200
        expect(result[1].id).toBe(1); // -50
        expect(result[2].id).toBe(2); // -100
    });

    it('sorts by multiple entities (Retailer ASC, then Amount DESC)', () => {
        const multiTxs = [
            { id: 1, retailer: 'B', amount: 10, type: 'income', date: '2023-01-01' },
            { id: 2, retailer: 'A', amount: 100, type: 'income', date: '2023-01-01' },
            { id: 3, retailer: 'A', amount: 200, type: 'income', date: '2023-01-01' }
        ];
        const result = sortTransactions(multiTxs, [
            { field: 'retailer', order: 'asc' },
            { field: 'amount', order: 'desc' }
        ]);
        expect(result[0].id).toBe(3); // Amazon 200
        expect(result[1].id).toBe(2); // Amazon 100
        expect(result[2].id).toBe(1); // Target 10
    });

    it('uses date fallback for tied values', () => {
        const tied = [
            { id: 1, amount: 100, type: 'income', date: '2023-01-01' },
            { id: 2, amount: 100, type: 'income', date: '2023-01-02' }
        ];
        const result = sortTransactions(tied, [{ field: 'amount', order: 'asc' }]);
        // Tied amount, should fall back to date DESC
        expect(result[0].id).toBe(2);
        expect(result[1].id).toBe(1);
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
