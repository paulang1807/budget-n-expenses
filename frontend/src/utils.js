export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function getFilteredTransactions(state) {
    const { period, startDate, endDate } = state.filter;
    const now = new Date();
    let start, end;

    if (period === 'Custom Range') {
        start = startDate ? new Date(startDate) : new Date(0);
        end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
    } else {
        switch (period) {
            case 'This Month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'Last Month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                break;
            case 'This Quarter':
                const q = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), q * 3, 1);
                end = new Date(now.getFullYear(), (q + 1) * 3, 0, 23, 59, 59, 999);
                break;
            case 'Last Quarter':
                const lq = Math.floor(now.getMonth() / 3) - 1;
                start = new Date(now.getFullYear(), lq * 3, 1);
                end = new Date(now.getFullYear(), (lq + 1) * 3, 0, 23, 59, 59, 999);
                break;
            case 'This Year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'Last Year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                break;
            case 'Last 30 Days':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case 'Last 90 Days':
                start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                end = now;
                break;
            case 'Last 12 Months':
                start = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
                end = now;
                break;
            default:
                start = new Date(0);
                end = new Date();
        }
    }

    return state.transactions.filter(tx => {
        const d = new Date(tx.date);
        return d >= start && d <= end;
    });
}
