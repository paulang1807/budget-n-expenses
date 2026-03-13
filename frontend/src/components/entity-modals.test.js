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
