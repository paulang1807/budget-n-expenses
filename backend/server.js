const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { readData, writeData, updateBalance, canDeleteCategory, canDeleteSubcategory, canDeleteRetailer, isDuplicate, uuidv4 } = require('./logic.js');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes for Accounts
app.get('/api/accounts', (req, res) => {
  res.json(readData('accounts.json'));
});

app.post('/api/accounts', (req, res) => {
  console.log('Creating new account...');
  const accounts = readData('accounts.json');
  if (isDuplicate(accounts, req.body.name)) {
    return res.status(400).json({ error: 'Account with this name already exists' });
  }
  const newAccount = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  accounts.push(newAccount);
  writeData('accounts.json', accounts);
  res.status(201).json(newAccount);
});

app.put('/api/accounts/:id', (req, res) => {
  let accounts = readData('accounts.json');
  const index = accounts.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    if (req.body.name && isDuplicate(accounts, req.body.name, req.params.id)) {
      return res.status(400).json({ error: 'Account with this name already exists' });
    }
    accounts[index] = { ...accounts[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData('accounts.json', accounts);
    res.json(accounts[index]);
  } else {
    res.status(404).send('Account not found');
  }
});

app.delete('/api/accounts/:id', (req, res) => {
  let accounts = readData('accounts.json');
  const transactions = readData('transactions.json');

  // Check if account has transactions
  const hasTransactions = transactions.some(t => t.accountId === req.params.id || t.fromAccountId === req.params.id || t.toAccountId === req.params.id);
  if (hasTransactions) {
    return res.status(400).json({ error: 'Cannot delete account with existing transactions' });
  }

  const filtered = accounts.filter(a => a.id !== req.params.id);
  if (filtered.length < accounts.length) {
    writeData('accounts.json', filtered);
    res.status(204).send();
  } else {
    res.status(404).send('Account not found');
  }
});

// Routes for Transactions
app.get('/api/transactions', (req, res) => {
  res.json(readData('transactions.json'));
});

app.post('/api/transactions', (req, res) => {
  console.log('Creating new transaction...');
  const transactions = readData('transactions.json');
  const accounts = readData('accounts.json');
  const newTx = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };

  if (newTx.type === 'income') {
    updateBalance(accounts, newTx.accountId, newTx.amount, true);
  } else if (newTx.type === 'expense') {
    updateBalance(accounts, newTx.accountId, newTx.amount, false);
  } else if (newTx.type === 'transfer') {
    updateBalance(accounts, newTx.fromAccountId, newTx.amount, false);
    updateBalance(accounts, newTx.toAccountId, newTx.amount, true);
  }

  transactions.push(newTx);
  writeData('transactions.json', transactions);
  writeData('accounts.json', accounts);
  res.status(201).json(newTx);
});

app.put('/api/transactions/:id', (req, res) => {
  const transactions = readData('transactions.json');
  const accounts = readData('accounts.json');
  const index = transactions.findIndex(t => t.id === req.params.id);

  if (index === -1) return res.status(404).send('Transaction not found');

  const oldTx = transactions[index];
  const newTx = { ...oldTx, ...req.body, updatedAt: new Date().toISOString() };

  // Reverse old balance impact
  if (oldTx.type === 'income') {
    updateBalance(accounts, oldTx.accountId, oldTx.amount, false);
  } else if (oldTx.type === 'expense') {
    updateBalance(accounts, oldTx.accountId, oldTx.amount, true);
  } else if (oldTx.type === 'transfer') {
    updateBalance(accounts, oldTx.fromAccountId, oldTx.amount, true);
    updateBalance(accounts, oldTx.toAccountId, oldTx.amount, false);
  }

  // Apply new balance impact
  if (newTx.type === 'income') {
    updateBalance(accounts, newTx.accountId, newTx.amount, true);
  } else if (newTx.type === 'expense') {
    updateBalance(accounts, newTx.accountId, newTx.amount, false);
  } else if (newTx.type === 'transfer') {
    updateBalance(accounts, newTx.fromAccountId, newTx.amount, false);
    updateBalance(accounts, newTx.toAccountId, newTx.amount, true);
  }

  transactions[index] = newTx;
  writeData('transactions.json', transactions);
  writeData('accounts.json', accounts);
  res.json(newTx);
});

app.delete('/api/transactions/:id', (req, res) => {
  const transactions = readData('transactions.json');
  const accounts = readData('accounts.json');
  const tx = transactions.find(t => t.id === req.params.id);

  if (!tx) return res.status(404).send('Transaction not found');

  // Reverse balance impact
  if (tx.type === 'income') {
    updateBalance(accounts, tx.accountId, tx.amount, false);
  } else if (tx.type === 'expense') {
    updateBalance(accounts, tx.accountId, tx.amount, true);
  } else if (tx.type === 'transfer') {
    updateBalance(accounts, tx.fromAccountId, tx.amount, true);
    updateBalance(accounts, tx.toAccountId, tx.amount, false);
  }

  const filtered = transactions.filter(t => t.id !== req.params.id);
  writeData('transactions.json', filtered);
  writeData('accounts.json', accounts);
  res.status(204).send();
});

// Routes for Budgets
app.get('/api/budgets', (req, res) => {
  res.json(readData('budgets.json'));
});

app.post('/api/budgets', (req, res) => {
  const budgets = readData('budgets.json');
  const newBudget = { id: uuidv4(), ...req.body };
  budgets.push(newBudget);
  writeData('budgets.json', budgets);
  res.status(201).json(newBudget);
});

app.put('/api/budgets/:id', (req, res) => {
  let budgets = readData('budgets.json');
  const index = budgets.findIndex(b => b.id === req.params.id);
  if (index !== -1) {
    budgets[index] = { ...budgets[index], ...req.body };
    writeData('budgets.json', budgets);
    res.json(budgets[index]);
  } else {
    res.status(404).send('Budget not found');
  }
});

app.delete('/api/budgets/:id', (req, res) => {
  let budgets = readData('budgets.json');
  const filtered = budgets.filter(b => b.id !== req.params.id);
  writeData('budgets.json', filtered);
  res.status(204).send();
});

// Routes for Categories
app.get('/api/categories', (req, res) => {
  res.json(readData('categories.json'));
});

app.post('/api/categories', (req, res) => {
  const categories = readData('categories.json');
  if (isDuplicate(categories, req.body.name)) {
    return res.status(400).json({ error: 'Category with this name already exists' });
  }
  const newCategory = { id: uuidv4(), ...req.body, subcategories: [] };
  categories.push(newCategory);
  writeData('categories.json', categories);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  let categories = readData('categories.json');
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    if (req.body.name && isDuplicate(categories, req.body.name, req.params.id)) {
      return res.status(400).json({ error: 'Category with this name already exists' });
    }
    categories[index] = { ...categories[index], ...req.body };
    writeData('categories.json', categories);
    res.json(categories[index]);
  } else {
    res.status(404).send('Category not found');
  }
});

app.delete('/api/categories/:id', (req, res) => {
  let categories = readData('categories.json');
  const transactions = readData('transactions.json');
  const category = categories.find(c => c.id === req.params.id);

  if (!category) return res.status(404).send('Category not found');

  const check = canDeleteCategory(category, transactions);
  if (check.error) {
    return res.status(400).json({ error: check.error });
  }

  const filtered = categories.filter(c => c.id !== req.params.id);
  writeData('categories.json', filtered);
  res.status(204).send();
});

// Subcategory Routes
app.post('/api/categories/:id/subcategories', (req, res) => {
  let categories = readData('categories.json');
  const category = categories.find(c => c.id === req.params.id);
  if (category) {
    if (!category.subcategories) category.subcategories = [];
    if (isDuplicate(category.subcategories, req.body.name)) {
      return res.status(400).json({ error: 'Subcategory with this name already exists in this category' });
    }
    const newSub = { id: uuidv4(), ...req.body };
    category.subcategories.push(newSub);
    writeData('categories.json', categories);
    res.status(201).json(newSub);
  } else {
    res.status(404).send('Category not found');
  }
});

app.put('/api/categories/:id/subcategories/:subId', (req, res) => {
  let categories = readData('categories.json');
  const category = categories.find(c => c.id === req.params.id);
  if (category && category.subcategories) {
    const index = category.subcategories.findIndex(s => s.id === req.params.subId);
    if (index !== -1) {
      if (req.body.name && isDuplicate(category.subcategories, req.body.name, req.params.subId)) {
        return res.status(400).json({ error: 'Subcategory with this name already exists in this category' });
      }
      category.subcategories[index] = { ...category.subcategories[index], ...req.body };
      writeData('categories.json', categories);
      res.json(category.subcategories[index]);
    } else {
      res.status(404).send('Subcategory not found');
    }
  } else {
    res.status(404).send('Category not found');
  }
});

app.delete('/api/categories/:id/subcategories/:subId', (req, res) => {
  let categories = readData('categories.json');
  const transactions = readData('transactions.json');
  const category = categories.find(c => c.id === req.params.id);

  if (category && category.subcategories) {
    const subcategory = category.subcategories.find(s => s.id === req.params.subId);
    if (!subcategory) return res.status(404).send('Subcategory not found');

    const check = canDeleteSubcategory(subcategory, transactions);
    if (check.error) {
      return res.status(400).json({ error: check.error });
    }

    category.subcategories = category.subcategories.filter(s => s.id !== req.params.subId);
    writeData('categories.json', categories);
    res.status(204).send();
  } else {
    res.status(404).send('Category not found');
  }
});

// Routes for Retailers
app.get('/api/retailers', (req, res) => {
  res.json(readData('retailers.json'));
});

app.post('/api/retailers', (req, res) => {
  const retailers = readData('retailers.json');
  if (isDuplicate(retailers, req.body.name)) {
    return res.status(400).json({ error: 'Retailer with this name already exists' });
  }
  const newRetailer = { id: uuidv4(), ...req.body };
  retailers.push(newRetailer);
  writeData('retailers.json', retailers);
  res.status(201).json(newRetailer);
});

app.put('/api/retailers/:id', (req, res) => {
  let retailers = readData('retailers.json');
  const index = retailers.findIndex(r => r.id === req.params.id);
  if (index !== -1) {
    if (req.body.name && isDuplicate(retailers, req.body.name, req.params.id)) {
      return res.status(400).json({ error: 'Retailer with this name already exists' });
    }
    retailers[index] = { ...retailers[index], ...req.body };
    writeData('retailers.json', retailers);
    res.json(retailers[index]);
  } else {
    res.status(404).send('Retailer not found');
  }
});

app.delete('/api/retailers/:id', (req, res) => {
  let retailers = readData('retailers.json');
  const transactions = readData('transactions.json');
  const retailer = retailers.find(r => r.id === req.params.id);

  if (!retailer) return res.status(404).send('Retailer not found');

  const check = canDeleteRetailer(retailer, transactions);
  if (check.error) {
    return res.status(400).json({ error: check.error });
  }

  const filtered = retailers.filter(r => r.id !== req.params.id);
  writeData('retailers.json', filtered);
  res.status(204).send();
});

// Routes for Icons
app.get('/api/icons', (req, res) => {
  res.json(readData('icons.json'));
});

app.post('/api/icons', (req, res) => {
  const icons = readData('icons.json');
  const newIcon = { id: uuidv4(), ...req.body };
  icons.push(newIcon);
  writeData('icons.json', icons);
  res.status(201).json(newIcon);
});

app.delete('/api/icons/:id', (req, res) => {
  let icons = readData('icons.json');
  res.status(204).send();
});

app.post('/api/projected-worth', (req, res) => {
  const projectedWorth = readData('projected_worth.json');
  const { accountId, year, month, amount } = req.body;
  
  const index = projectedWorth.findIndex(pw => 
    pw.accountId === accountId && 
    pw.year === year && 
    pw.month === month
  );

  if (index !== -1) {
    projectedWorth[index].amount = amount;
    projectedWorth[index].updatedAt = new Date().toISOString();
  } else {
    projectedWorth.push({
      id: uuidv4(),
      accountId,
      year,
      month,
      amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  writeData('projected_worth.json', projectedWorth);
  res.status(201).json({ success: true });
});

// Routes for Assets
app.get('/api/assets', (req, res) => {
  res.json(readData('assets.json'));
});

app.post('/api/assets', (req, res) => {
  const assets = readData('assets.json');
  if (isDuplicate(assets, req.body.name)) {
    return res.status(400).json({ error: 'Asset with this name already exists' });
  }
  const newAsset = { 
    id: uuidv4(), 
    ...req.body, 
    value: Number(req.body.value) || 0,
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString() 
  };
  assets.push(newAsset);
  writeData('assets.json', assets);
  res.status(201).json(newAsset);
});

app.put('/api/assets/:id', (req, res) => {
  let assets = readData('assets.json');
  const index = assets.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    if (req.body.name && isDuplicate(assets, req.body.name, req.params.id)) {
      return res.status(400).json({ error: 'Asset with this name already exists' });
    }
    assets[index] = { 
      ...assets[index], 
      ...req.body, 
      value: req.body.value !== undefined ? Number(req.body.value) : assets[index].value,
      updatedAt: new Date().toISOString() 
    };
    writeData('assets.json', assets);
    res.json(assets[index]);
  } else {
    res.status(404).send('Asset not found');
  }
});

app.delete('/api/assets/:id', (req, res) => {
  let assets = readData('assets.json');
  const filtered = assets.filter(a => a.id !== req.params.id);
  if (filtered.length < assets.length) {
    writeData('assets.json', filtered);
    res.status(204).send();
  } else {
    res.status(404).send('Asset not found');
  }
});

// Routes for Asset Projections
app.get('/api/asset-projections', (req, res) => {
  res.json(readData('asset_projections.json'));
});

app.post('/api/asset-projections', (req, res) => {
  const projections = readData('asset_projections.json');
  const { assetId, year, month, amount } = req.body;
  
  const index = projections.findIndex(p => 
    p.assetId === assetId && p.year === year && p.month === month
  );

  if (index !== -1) {
    projections[index].amount = amount;
    projections[index].updatedAt = new Date().toISOString();
  } else {
    projections.push({
      id: uuidv4(),
      assetId,
      year,
      month,
      amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  writeData('asset_projections.json', projections);
  res.status(201).json({ success: true });
});

// Bulk Import Route
app.post('/api/import', (req, res) => {
  const { transactions, accounts, categories, retailers, budgets } = req.body;

  const mergeData = (filename, newData) => {
    if (!newData || !Array.isArray(newData)) return;
    let existingData = readData(filename);

    newData.forEach(newItem => {
      if (!newItem.id) newItem.id = uuidv4(); // Safeguard
      const index = existingData.findIndex(item => item.id === newItem.id);
      if (index !== -1) {
        existingData[index] = { ...existingData[index], ...newItem, updatedAt: new Date().toISOString() };
      } else {
        existingData.push({ ...newItem, createdAt: newItem.createdAt || new Date().toISOString() });
      }
    });
    writeData(filename, existingData);
  };

  try {
    mergeData('transactions.json', transactions);
    mergeData('accounts.json', accounts);
    mergeData('categories.json', categories);
    mergeData('retailers.json', retailers);
    mergeData('budgets.json', budgets);
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
