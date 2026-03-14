export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getFilteredTransactions(state) {
    const { period, startDate, endDate, search, categories, subcategories, retailers, accounts, minAmount, maxAmount, referenceDate } = state.filter;
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    let start, end;

    if (period === 'Custom Range') {
        start = startDate ? parseLocalDate(startDate) : new Date(0);
        end = endDate ? parseLocalDate(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
    } else {
        const year = ref.getFullYear();
        const month = ref.getMonth();

        switch (period) {
            case 'This Month':
                start = new Date(year, month, 1);
                end = new Date(year, month + 1, 0, 23, 59, 59, 999);
                break;
            case 'Last Month':
                start = new Date(year, month - 1, 1);
                end = new Date(year, month, 0, 23, 59, 59, 999);
                break;
            case 'This Quarter':
                const q = Math.floor(month / 3);
                start = new Date(year, q * 3, 1);
                end = new Date(year, (q + 1) * 3, 0, 23, 59, 59, 999);
                break;
            case 'Last Quarter':
                const lq = Math.floor(month / 3) - 1;
                start = new Date(year, lq * 3, 1);
                end = new Date(year, (lq + 1) * 3, 0, 23, 59, 59, 999);
                break;
            case 'This Year':
                start = new Date(year, 0, 1);
                end = new Date(year, 11, 31, 23, 59, 59, 999);
                break;
            case 'Last Year':
                start = new Date(year - 1, 0, 1);
                end = new Date(year - 1, 11, 31, 23, 59, 59, 999);
                break;
            case 'Last 30 Days':
                start = new Date(ref.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = ref;
                break;
            case 'Last 90 Days':
                start = new Date(ref.getTime() - 90 * 24 * 60 * 60 * 1000);
                end = ref;
                break;
            case 'Last 12 Months':
                start = new Date(year - 1, month + 1, 1);
                end = ref;
                break;
            default:
                start = new Date(0);
                end = new Date();
        }
    }

    return state.transactions.filter(tx => {
        // Date Filter
        const d = parseLocalDate(tx.date);
        if (d < start || d > end) return false;

        // Search Filter (Description)
        if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;

        // Category Filter
        if (categories && categories.length > 0 && !categories.includes(tx.category)) return false;

        // Subcategory Filter
        if (subcategories && subcategories.length > 0 && !subcategories.includes(tx.subcategory)) return false;

        // Retailer Filter
        if (retailers && retailers.length > 0 && !retailers.includes(tx.retailer)) return false;

        // Account Filter
        if (accounts && accounts.length > 0 && !accounts.includes(tx.accountId)) return false;

        // Amount Filter (Signed)
        const amount = tx.type === 'expense' ? -tx.amount : tx.amount;
        if (minAmount !== null && minAmount !== undefined && amount < minAmount) return false;
        if (maxAmount !== null && maxAmount !== undefined && amount > maxAmount) return false;

        return true;
    });
}

export function getFilteredBudgets(state) {
    const { period, referenceDate } = state.filter;
    const ref = referenceDate ? new Date(referenceDate) : new Date();
    const year = ref.getFullYear();
    const month = ref.getMonth() + 1; // 1-12

    return state.budgets.filter(b => {
        if (period === 'Year') {
            return b.year === year;
        }
        // Default to current month/year if period is 'Month' or any other preset
        // For 'This Month', 'Last Month' etc., we use the referenceDate set by TimeFilter
        // but for budgets we prioritize full months.
        return b.year === year && b.month === month;
    });
}

export function getPeriodLabel(filter) {
    const { period, startDate, endDate, referenceDate } = filter;
    const ref = referenceDate ? new Date(referenceDate) : new Date();

    if (period === 'Custom Range') {
        if (!startDate && !endDate) return 'Custom Range';
        return `${startDate || '...'} to ${endDate || '...'}`;
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const year = ref.getFullYear();
    const month = ref.getMonth();

    switch (period) {
        case 'This Month':
        case 'Month':
            return `${monthNames[month]} ${year}`;
        case 'Last Month':
            const lm = new Date(year, month - 1, 1);
            return `${monthNames[lm.getMonth()]} ${lm.getFullYear()}`;
        case 'This Quarter':
            return `Q${Math.floor(month / 3) + 1} ${year}`;
        case 'Last Quarter':
            const lq = new Date(year, (Math.floor(month / 3) - 1) * 3, 1);
            return `Q${Math.floor(lq.getMonth() / 3) + 1} ${lq.getFullYear()}`;
        case 'This Year':
        case 'Year':
            return `${year}`;
        case 'Last Year':
            return `${year - 1}`;
        default:
            return period;
    }
}

export function parseLocalDate(dateStr) {
    if (!dateStr) return new Date();
    // Extract YYYY-MM-DD from the start to handle ISO strings or full dates
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return new Date();
    const [_, year, month, day] = match.map(Number);
    return new Date(year, month - 1, day);
}

export function sortTransactions(transactions, sorts, metadata = {}) {
    if (!sorts || sorts.length === 0) return transactions;

    const sorted = [...transactions];
    sorted.sort((a, b) => {
        for (const { field, order } of sorts) {
            let valA, valB;

            if (field === 'date') {
                valA = parseLocalDate(a.date).getTime();
                valB = parseLocalDate(b.date).getTime();
            } else if (field === 'retailer') {
                const retA = metadata?.retailers?.find(r => (r.id === a.retailer || r.name === a.retailer));
                const retB = metadata?.retailers?.find(r => (r.id === b.retailer || r.name === b.retailer));
                valA = (retA ? retA.name : (a.retailer || 'No Retailer')).toLowerCase();
                valB = (retB ? retB.name : (b.retailer || 'No Retailer')).toLowerCase();
            } else if (field === 'category') {
                const catA = metadata?.categories?.find(c => (c.id === a.category || c.name === a.category));
                const catB = metadata?.categories?.find(c => (c.id === b.category || c.name === b.category));
                valA = (catA ? catA.name : (a.category || 'No Category')).toLowerCase();
                valB = (catB ? catB.name : (b.category || 'No Category')).toLowerCase();
            } else if (field === 'subcategory') {
                const catA = metadata?.categories?.find(c => (c.id === a.category || c.name === a.category));
                const catB = metadata?.categories?.find(c => (c.id === b.category || c.name === b.category));
                const subA = catA?.subcategories?.find(s => (s.id === a.subcategory || s.name === a.subcategory));
                const subB = catB?.subcategories?.find(s => (s.id === b.subcategory || s.name === b.subcategory));
                valA = (subA ? subA.name : (a.subcategory || 'No Subcategory')).toLowerCase();
                valB = (subB ? subB.name : (b.subcategory || 'No Subcategory')).toLowerCase();
            } else if (field === 'amount') {
                // Use signed amount for correct relative ordering (Expenses < Income)
                valA = Number(a.amount) * (a.type === 'expense' ? -1 : 1);
                valB = Number(b.amount) * (b.type === 'expense' ? -1 : 1);
            } else {
                continue;
            }

            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            // If equal, continue to next sort level
        }

        // Final fallback to date descending if all levels are equal
        const dateA = parseLocalDate(a.date).getTime();
        const dateB = parseLocalDate(b.date).getTime();
        return dateB - dateA;
    });
    return sorted;
}

export function groupTransactions(transactions, groupByFields, sorts, metadata = {}) {
    if (!groupByFields || groupByFields.length === 0) return {};

    const groupRecursive = (txs, fields) => {
        if (fields.length === 0) {
            const sortedTxs = sortTransactions(txs, sorts, metadata);
            return { txs: sortedTxs, total: calculateTotal(txs) };
        }

        const currentField = fields[0];
        const remainingFields = fields.slice(1);

        const grouped = txs.reduce((acc, tx) => {
            let key = 'Other';
            if (currentField === 'category') {
                const catId = tx.category;
                const cat = metadata?.categories?.find(c => (c.id === catId || c.name === catId));
                key = cat ? cat.name : (catId || 'No Category');
            }
            else if (currentField === 'subcategory') {
                const subId = tx.subcategory;
                const catId = tx.category;
                const cat = metadata?.categories?.find(c => (c.id === catId || c.name === catId));
                const sub = cat?.subcategories?.find(s => (s.id === subId || s.name === subId));
                key = sub ? sub.name : (subId || 'No Subcategory');
            }
            else if (currentField === 'retailer') {
                const retId = tx.retailer;
                const ret = metadata?.retailers?.find(r => (r.id === retId || r.name === retId));
                key = ret ? ret.name : (retId || 'No Retailer');
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(tx);
            return acc;
        }, {});

        const result = {};
        Object.keys(grouped).forEach(key => {
            const nested = groupRecursive(grouped[key], remainingFields);
            result[key] = {
                ...nested,
                total: calculateTotal(grouped[key])
            };
        });
        return { groups: result };
    };

    const calculateTotal = (txs) => {
        return txs.reduce((sum, tx) => {
            const amt = Number(tx.amount);
            return sum + (tx.type === 'expense' ? -amt : amt);
        }, 0);
    };

    const topLevel = groupRecursive(transactions, groupByFields);
    return topLevel.groups || {};
}

export function getFABContext(state) {
    if (state.currentTab === 'transactions') return { type: 'transaction', label: 'Add Transaction' };
    if (state.currentTab === 'budgets') return { type: 'budget', label: 'Add Budget' };
    if (state.currentTab === 'settings') {
        if (state.currentSubTab === 'accounts') return { type: 'account', label: 'Add Account' };
        if (state.currentSubTab === 'categories') return { type: 'category', label: 'Add Category' };
        if (state.currentSubTab === 'retailers') return { type: 'retailer', label: 'Add Retailer' };
    }
    return { type: null, label: null };
}

export function stripIcon(text) {
    if (!text) return '';
    return text.replace(/^[^\s]+\s/, '');
}

