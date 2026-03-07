import { describe, it, expect } from 'vitest';
import { formatCurrency, getFilteredTransactions } from './utils.js';

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
        { id: '1', date: '2024-06-01T10:00:00Z', amount: 100, description: 'June Item' },
        { id: '2', date: '2024-05-15T10:00:00Z', amount: 50, description: 'May Item' },
        { id: '3', date: '2023-12-25T10:00:00Z', amount: 200, description: 'Previous Year Item' }
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
            transactions: mockTransactions,
            filter: {
                period: 'Custom Range',
                startDate: '2024-05-01',
                endDate: '2024-05-31'
            }
        };
        const result = getFilteredTransactions(state);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
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
