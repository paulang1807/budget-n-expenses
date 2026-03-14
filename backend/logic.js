const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');

const uuidv4 = () => crypto.randomUUID();

const DEFAULT_ICONS = [
    '💰', '🏦', '💳', '💵', '💸', '📈', '📉', '📊', '🏧', '🪙',
    '🏠', '🏠', '🛌', '🛋️', '🛀', '💡', '📶', '🧼', '🧹', '🧺',
    '🚗', '⛽', '🚌', '🚆', '🚲', '🚕', '✈️', '🚢', '🗺️', '🎫',
    '🍔', '🍕', '🍣', '🍎', '🥦', '☕', '🍹', '🍺', '🍳', '🛒',
    '🎬', '🎮', '🎤', '🎧', '🎳', '🎨', '📚', '🎭', '🎪', '🎡',
    '🏥', '💊', '🩺', '🦷', '👓', '💈', '🧴', '💄', '💍', '👗',
    '💼', '📅', '📝', '✉️', '📦', '💻', '📱', '⌨️', '🖱️', '🔋',
    '🪙', '🥚', '🪴', '☂️', '💹', '💳', '🏦'
];

const readData = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            let initialData = [];
            if (filename === 'icons.json') {
                initialData = DEFAULT_ICONS.map(emoji => ({ id: uuidv4(), emoji }));
            }
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filename}:`, err);
        return [];
    }
};

const writeData = (filename, data) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing ${filename}:`, err);
    }
};

const updateBalance = (accounts, accountId, amount, isAdd) => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
        account.balance = isAdd ? Number(account.balance) + Number(amount) : Number(account.balance) - Number(amount);
    }
    return accounts;
};

const canDeleteCategory = (category, transactions) => {
    if (category.subcategories && category.subcategories.length > 0) {
        return { error: 'Cannot delete category with subcategories' };
    }
    const hasTransactions = transactions.some(t => t.category === category.name);
    if (hasTransactions) {
        return { error: 'Cannot delete category with existing transactions' };
    }
    return { success: true };
};

const canDeleteSubcategory = (subcategory, transactions) => {
    const hasTransactions = transactions.some(t => t.subcategory === subcategory.name);
    if (hasTransactions) {
        return { error: 'Cannot delete subcategory with existing transactions' };
    }
    return { success: true };
};

const canDeleteRetailer = (retailer, transactions) => {
    const hasTransactions = transactions.some(t => t.retailer === retailer.name);
    if (hasTransactions) {
        return { error: 'Cannot delete retailer with existing transactions' };
    }
    return { success: true };
};

const isDuplicate = (collection, name, excludeId = null) => {
    return collection.some(item =>
        item.name.toLowerCase() === name.toLowerCase() && item.id !== excludeId
    );
};

module.exports = {
    readData,
    writeData,
    updateBalance,
    canDeleteCategory,
    canDeleteSubcategory,
    canDeleteRetailer,
    isDuplicate,
    uuidv4,
    DATA_DIR
};
