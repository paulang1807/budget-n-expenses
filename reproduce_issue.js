
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Simulate the environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.CustomEvent = dom.window.CustomEvent;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.HTMLDivElement = dom.window.HTMLDivElement;

// Mock stripIcon
const TransactionFormPath = path.resolve(__dirname, 'frontend/src/components/transaction-form.js');
let content = fs.readFileSync(TransactionFormPath, 'utf8');
// Mock the import since we are in node
content = content.replace("import { stripIcon } from '../utils.js';", "const stripIcon = (s) => s;");
content = content.replace("export const TransactionForm = {", "const TransactionForm = {");
content += "\nmodule.exports = { TransactionForm };";

const tempFile = path.resolve(__dirname, 'temp_transaction_form.js');
fs.writeFileSync(tempFile, content);

const { TransactionForm } = require(tempFile);

const categories = [
    {
        id: 'cat-1',
        name: 'Housing',
        type: 'expense',
        icon: '🏠',
        subcategories: [
            { id: 'sub-1', name: 'Rent', icon: '🔑' },
            { id: 'sub-2', name: 'Utilities', icon: '💡' }
        ]
    },
    {
        id: 'cat-2',
        name: 'Food',
        type: 'expense',
        icon: '🍽️',
        subcategories: [
            { id: 'sub-3', name: 'Groceries', icon: '🛒' },
            { id: 'sub-4', name: 'Dining Out', icon: '🍴' }
        ]
    }
];

const accounts = [{ id: 'acc-1', name: 'Cash', icon: '💰' }];
const retailers = [];

// 1. Render the form
const html = TransactionForm.render(accounts, categories, retailers);
document.getElementById('container').innerHTML = html;

// 2. Setup the form
TransactionForm.setup((data) => console.log('Submit:', data), categories);

// 3. Select Category "Housing"
const categoryWrapper = document.getElementById('tx-category-select-wrapper');
const housingOption = categoryWrapper.querySelector('.custom-option[data-value="Housing"]');

console.log('--- Selecting Housing ---');
housingOption.click();

const subcategoryWrapper = document.getElementById('tx-subcategory-select-wrapper');
const subOptionsHousing = subcategoryWrapper.querySelectorAll('.custom-option:not([data-value=""])');
console.log('Subcategories for Housing:', Array.from(subOptionsHousing).map(o => o.querySelector('span').innerText));

// 4. Select Subcategory "Rent"
const rentOption = subcategoryWrapper.querySelector('.custom-option[data-value="Rent"]');
rentOption.click();
console.log('Subcategory set to:', subcategoryWrapper.querySelector('.trigger-text').innerText);

// 5. Select Category "Food"
const foodOption = categoryWrapper.querySelector('.custom-option[data-value="Food"]');
console.log('--- Selecting Food ---');
foodOption.click();

const subOptionsFood = subcategoryWrapper.querySelectorAll('.custom-option:not([data-value=""])');
console.log('Subcategories for Food:', Array.from(subOptionsFood).map(o => o.querySelector('span').innerText));

const currentSubText = subcategoryWrapper.querySelector('.trigger-text').innerText;
const currentSubValue = document.getElementById('tx-subcategory-select-input').value;

console.log('Current Subcategory UI Text:', currentSubText);
console.log('Current Subcategory Value:', currentSubValue);

if (currentSubValue === 'Rent' || currentSubText === 'Rent') {
    console.error('FAIL: Subcategory was NOT reset when category changed!');
} else {
    console.log('PASS: Subcategory was reset correctly.');
}

fs.unlinkSync(tempFile);
