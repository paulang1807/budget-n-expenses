import { describe, it, expect } from 'vitest';
import { TransactionForm } from './transaction-form.js';

describe('TransactionForm - Custom Selection Rendering', () => {
    const accounts = [
        { id: 'acc-1', name: 'Emoji Account', icon: '💵' },
        { id: 'acc-2', name: 'SVG Account', icon: '<svg class="test-svg"></svg>' }
    ];
    const categories = [
        { name: 'Food', type: 'expense', icon: '🍕' }
    ];
    const retailers = [
        { name: 'Target', icon: '🎯' }
    ];

    it('renders custom select for accounts with SVG and emoji icons', () => {
        const html = TransactionForm.render(accounts, categories, retailers);
        
        // Verify account dropdown icons/names are present
        expect(html).toContain('💵');
        expect(html).toContain('<svg class="test-svg"></svg>');
        expect(html).toContain('Emoji Account');
        expect(html).toContain('SVG Account');
        
        // Verify hidden inputs are present
        expect(html).toContain('name="accountId"');
        expect(html).toContain('name="retailer"');
        expect(html).toContain('name="category"');
    });

    it('auto-selects first account when no placeholder is provided', () => {
        const html = TransactionForm.render(accounts, categories, retailers);
        
        // The trigger should show the first account's icon and text
        // (Note: This depends on the default iconType '💰' if no icon is found)
        expect(html).toContain('<div class="trigger-icon">💵</div>');
        expect(html).toContain('<span class="trigger-text">Emoji Account</span>');
        
        // The hidden input should have the first account's ID
        expect(html).toContain('value="acc-1"');
    });

    it('shows placeholder "None" for retailers and categories', () => {
        const html = TransactionForm.render(accounts, categories, retailers);
        
        // Check for retailer defaults
        expect(html).toContain('tx-retailer-select-trigger');
        expect(html).toContain('🏪');
        expect(html).toContain('None');
        
        // Check for category defaults
        expect(html).toContain('tx-category-select-trigger');
        expect(html).toContain('📁');
    });
});
