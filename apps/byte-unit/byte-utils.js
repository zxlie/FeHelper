export const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function toBytes(value, unit) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        throw new Error('请输入合法的数字');
    }
    const index = BYTE_UNITS.indexOf(unit);
    if (index === -1) {
        throw new Error('不支持的单位');
    }
    return num * Math.pow(1024, index);
}

export function convertBytes(value, fromUnit, toUnit) {
    const bytes = toBytes(value, fromUnit);
    const targetIndex = BYTE_UNITS.indexOf(toUnit);
    if (targetIndex === -1) {
        throw new Error('不支持的单位');
    }
    return bytes / Math.pow(1024, targetIndex);
}

export function formatConvertedValue(value) {
    if (!Number.isFinite(value)) {
        return '';
    }
    if (Math.abs(value) >= 100 || Number.isInteger(value)) {
        return String(Math.round(value * 1000000) / 1000000).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
    }
    return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function getAllConversions(value, fromUnit) {
    return BYTE_UNITS.map((unit) => ({
        unit,
        value: formatConvertedValue(convertBytes(value, fromUnit, unit))
    }));
}
