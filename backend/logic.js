const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');

const uuidv4 = () => crypto.randomUUID();

const readData = (filename) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
        if (!fs.existsSync(filePath)) {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify([], null, 2));
            return [];
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

module.exports = {
    readData,
    writeData,
    updateBalance,
    uuidv4,
    DATA_DIR
};
