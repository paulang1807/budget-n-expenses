import { describe, it, expect } from 'vitest';
import { buildExportData } from './export-import-utils.js';

describe('buildExportData', () => {
    const mockState = {
        transactions: [
            { id: 't1', date: '2023-01-01', amount: 100, description: 'Groceries' },
            { id: 't2', date: '2023-01-15', amount: 50, description: 'Gas' },
            { id: 't3', date: '2023-02-01', amount: 200, description: 'Electric Bill' }
        ],
        accounts: [
            { id: 'a1', name: 'Checking', type: 'Bank' }
        ]
    };

    it('exports all selected entities and attributes without date range in JSON format', () => {
        const options = {
            startDate: '',
            endDate: '',
            format: 'json',
            entities: {
                transactions: { selected: true, attributes: ['id', 'amount'] },
                accounts: { selected: true, attributes: ['name'] }
            }
        };

        const result = buildExportData(mockState, options);
        expect(result.type).toBe('application/json');

        const parsed = JSON.parse(result.content);
        expect(parsed.transactions).toBeDefined();
        expect(parsed.transactions.length).toBe(3);
        expect(parsed.transactions[0]).toEqual({ id: 't1', amount: 100 });

        expect(parsed.accounts).toBeDefined();
        expect(parsed.accounts.length).toBe(1);
        expect(parsed.accounts[0]).toEqual({ name: 'Checking' });
    });

    it('filters transactions by date range', () => {
        const options = {
            startDate: '2023-01-10',
            endDate: '2023-01-31',
            format: 'json',
            entities: {
                transactions: { selected: true, attributes: ['id', 'date'] }
            }
        };

        const result = buildExportData(mockState, options);
        const parsed = JSON.parse(result.content);
        expect(parsed.transactions.length).toBe(1);
        expect(parsed.transactions[0].id).toBe('t2');
    });

    it('generates CSV correctly for multiple entities', () => {
        const options = {
            startDate: '',
            endDate: '',
            format: 'csv',
            entities: {
                transactions: { selected: true, attributes: ['id', 'description'] },
                accounts: { selected: true, attributes: ['name', 'type'] }
            }
        };

        const result = buildExportData(mockState, options);
        expect(result.type).toBe('text/csv');

        const csvContent = result.content;
        expect(csvContent).toContain('--- TRANSACTIONS ---');
        expect(csvContent).toContain('id,description');
        expect(csvContent).toContain('"t1","Groceries"');

        expect(csvContent).toContain('--- ACCOUNTS ---');
        expect(csvContent).toContain('name,type');
        expect(csvContent).toContain('"Checking","Bank"');
    });

    it('ignores entities that are not selected', () => {
        const options = {
            startDate: '',
            endDate: '',
            format: 'json',
            entities: {
                transactions: { selected: false, attributes: ['id'] },
                accounts: { selected: true, attributes: ['id'] }
            }
        };

        const result = buildExportData(mockState, options);
        const parsed = JSON.parse(result.content);
        expect(parsed.transactions).toBeUndefined();
        expect(parsed.accounts.length).toBe(1);
    });
});
