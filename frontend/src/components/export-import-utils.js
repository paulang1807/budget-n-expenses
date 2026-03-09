export function buildExportData(state, options) {
    const { startDate, endDate, entities, format } = options;
    const exportData = {};

    Object.keys(entities).forEach(entityName => {
        const entityConfig = entities[entityName];
        if (!entityConfig.selected) return;

        let dataToExport = [...(state[entityName] || [])];

        // Apply time range filter if transactions
        if (entityName === 'transactions' && (startDate || endDate)) {
            dataToExport = dataToExport.filter(tx => {
                const txDate = tx.date; // format YYYY-MM-DD
                if (startDate && txDate < startDate) return false;
                if (endDate && txDate > endDate) return false;
                return true;
            });
        }

        // Apply attribute filtering
        exportData[entityName] = dataToExport.map(item => {
            const filteredItem = {};
            entityConfig.attributes.forEach(attr => {
                if (item.hasOwnProperty(attr)) {
                    filteredItem[attr] = item[attr];
                }
            });
            return filteredItem;
        });
    });

    if (format === 'json') {
        return {
            content: JSON.stringify(exportData, null, 2),
            filename: `budget_export_${new Date().toISOString().split('T')[0]}.json`,
            type: 'application/json'
        };
    } else if (format === 'csv') {
        let csvContent = '';
        Object.keys(exportData).forEach(entityName => {
            const items = exportData[entityName];
            if (items.length === 0) return;

            csvContent += `--- ${entityName.toUpperCase()} ---\n`;
            const headers = Object.keys(items[0]);
            csvContent += headers.join(',') + '\n';

            items.forEach(item => {
                const row = headers.map(header => {
                    let val = item[header];
                    if (val === null || val === undefined) val = '';
                    if (typeof val === 'object') val = JSON.stringify(val);
                    val = String(val).replace(/"/g, '""');
                    return `"${val}"`;
                });
                csvContent += row.join(',') + '\n';
            });
            csvContent += '\n';
        });

        return {
            content: csvContent,
            filename: `budget_export_${new Date().toISOString().split('T')[0]}.csv`,
            type: 'text/csv'
        };
    }
}

export async function handleImport(file, currentApiUrl) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                let data;
                if (file.name.endsWith('.json')) {
                    data = JSON.parse(text);
                } else {
                    return reject(new Error('Only JSON imports are supported currently.'));
                }

                const response = await fetch(`${currentApiUrl}/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Import failed on server');
                }
                resolve(true);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
