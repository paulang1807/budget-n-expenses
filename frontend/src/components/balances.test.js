import { describe, it, expect } from 'vitest';
import { Balances } from './balances.js';

describe('Balances Component - Historical Calculation', () => {
    
    it('calculates historical starting/ending balances perfectly', () => {
        const state = {
            accounts: [
                { id: 'acc-1', balance: 1000 }, // Time NOW Balance
                { id: 'acc-2', balance: -50 }
            ],
            transactions: [
                // We will test target year 2026.
                
                // Transactions AFTER target year (2027)
                { id: 't4', date: '2027-01-10T00:00:00Z', type: 'income', accountId: 'acc-1', amount: 500 }, // Income to acc-1
                
                // Target Year Transactions (2026)
                // December 2026
                { id: 't3', date: '2026-12-05T00:00:00Z', type: 'expense', accountId: 'acc-1', amount: 100 },
                
                // March 2026
                { id: 't2', date: '2026-03-15T00:00:00Z', type: 'transfer', fromAccountId: 'acc-1', toAccountId: 'acc-2', amount: 50 },
                
                // Transactions BEFORE target year (2025)
                { id: 't1', date: '2025-05-10T00:00:00Z', type: 'income', accountId: 'acc-1', amount: 300 }
            ]
        };
        
        // Let's verify our manual math matches the result for target year 2026
        const results = Balances.calculateHistoricalBalances(state, 2026);
        
        // Jan 2026 Start
        const janStart = results[0].startingBalance;
        expect(janStart).toBe(650 - 100); // 550
        
        // March 2026 values
        const marRes = results[2];
        expect(marRes.startingBalance).toBe(550);
        expect(marRes.totalIncome).toBe(0);
        expect(marRes.totalExpense).toBe(0);
        expect(marRes.endBalance).toBe(550); // Transfer doesn't affect total
        expect(marRes.accountBalances['acc-1']).toBe(600); // 650 - 50 transfer
        expect(marRes.accountBalances['acc-2']).toBe(-50); // -100 + 50 transfer
        
        // December 2026 values
        const decRes = results[11];
        expect(decRes.startingBalance).toBe(550); // From March end
        expect(decRes.totalIncome).toBe(0);
        expect(decRes.totalExpense).toBe(100);
        expect(decRes.endBalance).toBe(450);
        expect(decRes.accountBalances['acc-1']).toBe(500); // 600 - 100 expense
    });

    it('renders account breakdown table with various icon formats including SVGs', () => {
        const state = {
            accounts: [
                { id: 'acc-emj', name: 'Emoji Account', balance: 100, icon: '💵' },
                { id: 'acc-svg', name: 'SVG Account', balance: 200, icon: '<svg class="test-svg"></svg>' }
            ],
            transactions: []
        };
        
        const dummyNode = { innerHTML: '' };
        const data = Balances.calculateHistoricalBalances(state, 2026);
        
        // Render view directly into dummy node
        Balances.renderAccountBreakdown(dummyNode, data, state.accounts);

        const renderedTable = dummyNode.innerHTML;
        
        // Verify both string literals appear correctly inside the rendered output
        expect(renderedTable).toContain('💵');
        expect(renderedTable).toContain('<svg class="test-svg"></svg>');
        expect(renderedTable).toContain('Emoji Account');
        expect(renderedTable).toContain('SVG Account');
    });
});
