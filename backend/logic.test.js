import { describe, it, expect, vi, beforeEach } from 'vitest';
const { updateBalance, uuidv4, canDeleteCategory, canDeleteSubcategory, canDeleteRetailer } = require('./logic.js');

describe('canDeleteRetailer', () => {
    const mockRetailer = { id: 'ret-1', name: 'Amazon' };
    const mockTransactions = [{ id: 'tx-1', retailer: 'Amazon' }];

    it('returns error if retailer has linked transactions', () => {
        expect(canDeleteRetailer(mockRetailer, mockTransactions)).toEqual({ error: 'Cannot delete retailer with existing transactions' });
    });

    it('returns success if no transactions linked', () => {
        expect(canDeleteRetailer(mockRetailer, [])).toEqual({ success: true });
    });
});

describe('canDeleteCategory', () => {
    const mockCategory = { id: 'cat-1', name: 'Food', subcategories: [] };
    const mockTransactions = [{ id: 'tx-1', category: 'Food' }];

    it('returns error if category has subcategories', () => {
        const catWithSubs = { ...mockCategory, subcategories: [{ id: 'sub-1' }] };
        expect(canDeleteCategory(catWithSubs, [])).toEqual({ error: 'Cannot delete category with subcategories' });
    });

    it('returns error if category has linked transactions', () => {
        expect(canDeleteCategory(mockCategory, mockTransactions)).toEqual({ error: 'Cannot delete category with existing transactions' });
    });

    it('returns success if no dependencies exist', () => {
        expect(canDeleteCategory(mockCategory, [])).toEqual({ success: true });
    });
});

describe('canDeleteSubcategory', () => {
    const mockSub = { id: 'sub-1', name: 'Groceries' };
    const mockTransactions = [{ id: 'tx-1', subcategory: 'Groceries' }];

    it('returns error if subcategory has linked transactions', () => {
        expect(canDeleteSubcategory(mockSub, mockTransactions)).toEqual({ error: 'Cannot delete subcategory with existing transactions' });
    });

    it('returns success if no transactions linked', () => {
        expect(canDeleteSubcategory(mockSub, [])).toEqual({ success: true });
    });
});

describe('uuidv4', () => {
    it('generates a valid looking UUID', () => {
        const id = uuidv4();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
});

describe('updateBalance', () => {
    let mockAccounts;

    beforeEach(() => {
        mockAccounts = [
            { id: 'acc-1', name: 'Test Account', balance: 1000 },
            { id: 'acc-2', name: 'Another Account', balance: 500 }
        ];
    });

    it('adds to balance when isAdd is true', () => {
        const result = updateBalance(mockAccounts, 'acc-1', 100, true);
        expect(result.find(a => a.id === 'acc-1').balance).toBe(1100);
    });

    it('subtracts from balance when isAdd is false', () => {
        const result = updateBalance(mockAccounts, 'acc-1', 100, false);
        expect(result.find(a => a.id === 'acc-1').balance).toBe(900);
    });

    it('handles numeric string amounts', () => {
        const result = updateBalance(mockAccounts, 'acc-1', '150.50', true);
        expect(result.find(a => a.id === 'acc-1').balance).toBe(1150.50);
    });

    it('does nothing if account is not found', () => {
        const result = updateBalance(mockAccounts, 'non-existent', 100, true);
        expect(result[0].balance).toBe(1000);
        expect(result[1].balance).toBe(500);
    });
});
