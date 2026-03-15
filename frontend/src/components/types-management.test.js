import { describe, it, expect, beforeAll } from 'vitest';
import { Settings } from './settings.js';

beforeAll(() => {
  global.document = {
    getElementById: (id) => {
      return { innerHTML: '', set onclick(val) {} };
    },
    querySelectorAll: () => [],
    querySelector: () => null
  };
});
describe('Settings - Global Types Tab', () => {
  it('renders account types and asset types', () => {
    const state = {
      accountTypes: ['Checking', 'Savings'],
      assetTypes: ['Real Estate', 'Vehicles']
    };
    
    const content = { 
      innerHTML: '',
      querySelectorAll: () => []
    };
    Settings.renderTypesTab(content, state);
    
    const html = content.innerHTML;
    
    // Check for headers
    expect(html).toContain('Account Types');
    expect(html).toContain('Asset Types');
    
    // Check for types
    expect(html).toContain('Checking');
    expect(html).toContain('Savings');
    expect(html).toContain('Real Estate');
    expect(html).toContain('Vehicles');
    
    // Check for input fields
    expect(html).toContain('id="new-account-type-input"');
    expect(html).toContain('id="new-asset-type-input"');
  });
});
