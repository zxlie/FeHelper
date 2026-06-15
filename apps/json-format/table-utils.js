function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

function toCellValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    } catch (_) {
        return String(value);
    }
}

function getArrayObjectCandidates(input) {
    const candidates = [];
    if (Array.isArray(input) && input.every(isPlainObject)) {
        candidates.push({ path: '$', rows: input });
    } else if (isPlainObject(input)) {
        Object.keys(input).forEach((key) => {
            const value = input[key];
            if (Array.isArray(value) && value.length && value.every(isPlainObject)) {
                candidates.push({ path: '$.' + key, rows: value });
            }
        });
    }
    return candidates;
}

function buildRowsFromObjects(rows) {
    const columns = [];
    const columnSeen = new Set();
    rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
            if (!columnSeen.has(key)) {
                columnSeen.add(key);
                columns.push(key);
            }
        });
    });

    return {
        mode: 'grid',
        columns,
        rows: rows.map((row, index) => {
            const cells = {};
            columns.forEach((column) => {
                cells[column] = toCellValue(row[column]);
            });
            return {
                id: index,
                cells
            };
        })
    };
}

function buildKeyValueRows(obj) {
    return {
        mode: 'keyValue',
        rows: Object.keys(obj).map((key, index) => ({
            id: index,
            key,
            value: toCellValue(obj[key])
        }))
    };
}

export function buildTableViewData(input) {
    const candidates = getArrayObjectCandidates(input);
    if (candidates.length) {
        const best = candidates.sort((a, b) => b.rows.length - a.rows.length)[0];
        return {
            title: best.path === '$' ? '根数组表格视图' : best.path + ' 表格视图',
            sourcePath: best.path,
            ...buildRowsFromObjects(best.rows)
        };
    }

    if (isPlainObject(input)) {
        return {
            title: '对象键值表视图',
            sourcePath: '$',
            ...buildKeyValueRows(input)
        };
    }

    throw new Error('当前 JSON 不适合表格展示。建议使用对象数组，或包含对象数组字段的 JSON。');
}

export function isRenderableTableViewData(tableViewData) {
    if (!tableViewData || !Array.isArray(tableViewData.rows) || !tableViewData.rows.length) {
        return false;
    }
    if (tableViewData.mode === 'grid') {
        return Array.isArray(tableViewData.columns) && tableViewData.columns.length > 0;
    }
    return tableViewData.mode === 'keyValue';
}

export function buildRenderableTableViewData(input) {
    const tableViewData = buildTableViewData(input);
    if (!isRenderableTableViewData(tableViewData)) {
        throw new Error('当前 JSON 没有可表格化的数据。');
    }
    return tableViewData;
}

export function canBuildTableViewData(input) {
    try {
        buildRenderableTableViewData(input);
        return true;
    } catch (_) {
        return false;
    }
}
