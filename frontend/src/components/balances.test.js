import { describe, test, expect } from 'vitest';
import { Balances } from './balances.js';

describe('Balances Component Logic', () => {
  const mockState = {
    accounts: [
      { id: 'acc1', name: 'Checking', balance: 1000 },
      { id: 'acc2', name: 'Savings', balance: 5000 }
    ],
    transactions: [
      { id: 'tx1', accountId: 'acc1', amount: 200, type: 'income', date: '2026-03-01' },
      { id: 'tx2', accountId: 'acc1', amount: 100, type: 'expense', date: '2026-03-05' }
    ],
    projectedWorth: [
      { accountId: 'acc1', year: 2026, month: 2, amount: 1500 } // March (index 2)
    ]
  };

  test('calculateHistoricalBalances handles projected worth override', () => {
    const results = Balances.calculateHistoricalBalances(mockState, 2026);
    
    // March is index 2
    const marchData = results[2];
    
    // Check actual calculations
    // Now balance (1000 + 5000) = 6000
    // Total change = +200 - 100 = +100
    // So start balance was 5900.
    // March start (Jan + Feb changes)
    // Jan 1: 5900
    // Mar 1: 5900 (since no txs in Jan/Feb)
    expect(marchData.startingBalance).toBe(5900);
    
    // March end balance = 5900 + 100 = 6000
    expect(marchData.endBalance).toBe(6000);
    
    // March projected balance for acc1 is overridden to 1500
    // acc2 has no projection, defaults to actual (5000)
    // Total projected = 1500 + 5000 = 6500
    expect(marchData.endProjected).toBe(6500);
    expect(marchData.projectedBalances['acc1']).toBe(1500);
    expect(marchData.projectedBalances['acc2']).toBe(5000);
  });

  test('defaults to actual balance if no projection exists', () => {
    const emptyState = { ...mockState, projectedWorth: [] };
    const results = Balances.calculateHistoricalBalances(emptyState, 2026);
    const marchData = results[2];
    
    expect(marchData.endProjected).toBe(marchData.endBalance);
    expect(marchData.projectedBalances['acc1']).toBe(marchData.accountBalances['acc1']);
  });
});
