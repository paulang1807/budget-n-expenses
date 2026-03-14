import { describe, it, expect, beforeAll } from 'vitest';
import { Settings } from './settings.js';

beforeAll(() => {
  // Mock document and innerHTML behavior
  global.document = {
    getElementById: (id) => {
      if (id === 'settings-tab-content') {
        return { innerHTML: '' };
      }
      return null;
    },
    querySelectorAll: () => [],
    querySelector: () => null
  };
});

describe('Settings - Categories Tab Redesign', () => {
  it('renders categories sorted alphabetically', () => {
    const state = {
      categories: [
        { id: 'cat-2', name: 'Zebra', type: 'expense', icon: '🦓', subcategories: [] },
        { id: 'cat-1', name: 'Apple', type: 'expense', icon: '🍎', subcategories: [] }
      ]
    };
    
    const content = { innerHTML: '' };
    Settings.renderCategoriesTab(content, state);
    
    const html = content.innerHTML;
    const applePos = html.indexOf('Apple');
    const zebraPos = html.indexOf('Zebra');
    
    expect(applePos).toBeLessThan(zebraPos);
    expect(html).toContain('Expenses');
  });

  it('renders subcategories sorted alphabetically', () => {
    const state = {
      categories: [
        { 
          id: 'cat-1', 
          name: 'Food', 
          type: 'expense', 
          icon: '🍕', 
          subcategories: [
            { id: 'sub-2', name: 'Zucchini' },
            { id: 'sub-1', name: 'Apple' }
          ] 
        }
      ]
    };
    
    const content = { innerHTML: '' };
    Settings.renderCategoriesTab(content, state);
    
    const html = content.innerHTML;
    const applePos = html.indexOf('Apple', html.indexOf('Food'));
    const zucchiniPos = html.indexOf('Zucchini', html.indexOf('Food'));
    
    expect(applePos).toBeLessThan(zucchiniPos);
  });

  it('separates income and expense categories', () => {
    const state = {
      categories: [
        { id: 'cat-1', name: 'Salary', type: 'income', icon: '💰', subcategories: [] },
        { id: 'cat-2', name: 'Rent', type: 'expense', icon: '🏠', subcategories: [] }
      ]
    };
    
    const content = { innerHTML: '' };
    Settings.renderCategoriesTab(content, state);
    
    const html = content.innerHTML;
    
    // Check for column titles
    expect(html).toContain('Expenses');
    expect(html).toContain('Income');
    
    // Verify Salary is in Income section and Rent is in Expenses section
    const expensesIndex = html.indexOf('Expenses');
    const incomeIndex = html.indexOf('Income');
    const rentIndex = html.indexOf('Rent');
    const salaryIndex = html.indexOf('Salary');
    
    // Rent should be after Expenses header but before Income header
    expect(rentIndex).toBeGreaterThan(expensesIndex);
    expect(rentIndex).toBeLessThan(incomeIndex);
    
    // Salary should be after Income header
    expect(salaryIndex).toBeGreaterThan(incomeIndex);
  });
});
