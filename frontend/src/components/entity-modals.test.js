import { describe, it, expect, beforeAll } from 'vitest';
import { EntityModals } from './entity-modals.js';

beforeAll(() => {
  global.document = {
    querySelector: () => ({ remove: () => {} })
  };
});

describe('EntityModals - Hierarchical Budget String Template', () => {
  it('renders budget modal with no subcategories initially', () => {
    const categories = [{ name: 'Food', subcategories: [] }];
    const html = EntityModals.renderAddBudget(categories);
    
    expect(html).toContain('budget-subcategories-section');
    expect(html).not.toContain('budget-subcategory-card');
  });

  it('renders budget modal with existing subcategories and line items', () => {
    const categories = [{ name: 'Food', subcategories: [{ name: 'Groceries' }] }];
    const existingData = {
      subcategories: [
        { 
          name: 'Groceries', 
          amount: 150.50,
          lineItems: [
            { name: 'Trader Joes', amount: 150.50 }
          ] 
        }
      ]
    };
    
    const html = EntityModals.renderAddBudget(categories, existingData);
    
    expect(html).toContain('value="Groceries"');
    expect(html).toContain('Trader Joes');
    expect(html).toContain('150.5');
    // Sub-amount should be present and readonly because it has line items
    expect(html).toContain('name="sub-amount"');
    expect(html).toContain('readonly');
    expect(html).toContain('budget-subcategory-card');
  });

  it('renders budget modal with subcategory but NO line items', () => {
    const categories = [{ name: 'Food', subcategories: [{ name: 'Groceries' }] }];
    const existingData = {
      subcategories: [
        { 
          name: 'Groceries', 
          amount: 200.00,
          lineItems: [] 
        }
      ]
    };
    
    const html = EntityModals.renderAddBudget(categories, existingData);
    
    expect(html).toContain('value="Groceries"');
    expect(html).toContain('value="200"');
    // Should NOT be readonly since there are no line items
    expect(html).not.toMatch(/name="sub-amount"[^>]+readonly/);
  });
});

describe('EntityModals - Add Account', () => {
  it('renders account modal with all expected types', () => {
    const icons = [{ id: '1', emoji: '💰' }];
    const html = EntityModals.renderAddAccount(icons);
    
    expect(html).toContain('Add New Account');
    expect(html).toContain('value="cash"');
    expect(html).toContain('value="checking"');
    expect(html).toContain('value="savings"');
    expect(html).toContain('value="credit"');
    expect(html).toContain('value="investment"');
    expect(html).toContain('value="crypto"');
    expect(html).toContain('value="401k"');
    expect(html).toContain('Crypto');
    expect(html).toContain('401K');
  });

  it('renders account modal with selected type in edit mode', () => {
    const icons = [{ id: '1', emoji: '💰' }];
    const existingData = { id: 'acc-1', name: 'My Crypto', type: 'crypto' };
    const html = EntityModals.renderAddAccount(icons, existingData);
    
    expect(html).toContain('Edit Account');
    expect(html).toContain('value="acc-1"');
    expect(html).toContain('value="crypto" selected');
    expect(html).toContain('My Crypto');
  });
});
