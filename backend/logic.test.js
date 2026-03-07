import { describe, it, expect, vi, beforeEach } from 'vitest';
const { updateBalance, uuidv4 } = require('./logic.js');

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
