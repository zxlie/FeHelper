import { describe, expect, it } from 'vitest';
import {
    buildRenderableTableViewData,
    buildTableViewData,
    canBuildTableViewData
} from '../apps/json-format/table-utils.js';

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

    it('only marks useful table data as renderable', () => {
        expect(canBuildTableViewData([{ id: 1 }])).toBe(true);
        expect(canBuildTableViewData({ success: true })).toBe(true);
        expect(canBuildTableViewData({})).toBe(false);
        expect(canBuildTableViewData([])).toBe(false);
        expect(canBuildTableViewData([1, 2, 3])).toBe(false);
        expect(canBuildTableViewData([{}, {}])).toBe(false);
    });

    it('throws when renderable table data would be empty', () => {
        expect(() => buildRenderableTableViewData({})).toThrow('没有可表格化的数据');
        expect(() => buildRenderableTableViewData([{}, {}])).toThrow('没有可表格化的数据');
    });
});
