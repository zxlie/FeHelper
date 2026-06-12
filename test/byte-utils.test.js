import { describe, expect, it } from 'vitest';
import { BYTE_UNITS, convertBytes, formatConvertedValue, getAllConversions } from '../apps/byte-unit/byte-utils.js';

describe('byte unit utils', () => {
    it('supports B to KB conversion', () => {
        expect(convertBytes('2048', 'B', 'KB')).toBe(2);
    });

    it('supports GB to MB conversion', () => {
        expect(convertBytes('1.5', 'GB', 'MB')).toBe(1536);
    });

    it('formats decimal values without trailing zeros', () => {
        expect(formatConvertedValue(1.500000)).toBe('1.5');
        expect(formatConvertedValue(0.125000)).toBe('0.125');
    });

    it('returns all supported units', () => {
        const result = getAllConversions('1024', 'MB');
        expect(result).toHaveLength(BYTE_UNITS.length);
        expect(result.find((item) => item.unit === 'GB').value).toBe('1');
    });
});
