import { describe, expect, it } from 'vitest';
import { buildTableViewData } from '../apps/json-format/table-utils.js';

describe('json table view utils', () => {
    it('builds grid view from root object array', () => {
        const result = buildTableViewData([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob', age: 30 }
        ]);

        expect(result.mode).toBe('grid');
        expect(result.columns).toEqual(['id', 'name', 'age']);
        expect(result.rows).toHaveLength(2);
        expect(result.sourcePath).toBe('$');
    });

    it('picks object-array field from root object', () => {
        const result = buildTableViewData({
            meta: { total: 2 },
            list: [{ code: 'A' }, { code: 'B' }]
        });

        expect(result.mode).toBe('grid');
        expect(result.sourcePath).toBe('$.list');
        expect(result.rows).toHaveLength(2);
    });

    it('falls back to key-value rows for plain object', () => {
        const result = buildTableViewData({
            success: true,
            count: 3
        });

        expect(result.mode).toBe('keyValue');
        expect(result.rows).toHaveLength(2);
        expect(result.rows[0]).toHaveProperty('key');
        expect(result.rows[0]).toHaveProperty('value');
    });
});
