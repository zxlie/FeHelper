const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeSegment(segment) {
    const fields = [];
    let value = 0;
    let place = 1;
    for (const character of segment) {
        const digit = alphabet.indexOf(character);
        if (digit < 0 || place > 2 ** 30) throw new Error('mappings 中的 VLQ 编码无效');
        value += (digit % 32) * place;
        if (value > 0xffffffff) throw new Error('mappings 中的 VLQ 数值越界');
        if (digit >= 32) {
            place *= 32;
        } else {
            const magnitude = Math.floor(value / 2);
            fields.push(value === 1 ? -(2 ** 31) : (value % 2 ? -magnitude : magnitude));
            value = 0;
            place = 1;
        }
    }
    if (place !== 1 || ![1, 4, 5].includes(fields.length)) {
        throw new Error('mappings 中存在不完整的映射段');
    }
    return fields;
}

export function parseSourceMap(text, baseURL) {
    let map;
    try {
        map = JSON.parse(text.trim());
    } catch {
        throw new Error('无法读取 JSON，请检查 Source Map 内容');
    }
    if (map?.version !== 3) throw new Error('仅支持 version 为 3 的 Source Map');
    if ('sections' in map) throw new Error('暂不支持含 sections 的索引式 Source Map');
    const { sources, sourcesContent = [], names = [], mappings, sourceRoot = '' } = map;
    const isTextOrNull = value => value === null || typeof value === 'string';
    if (!Array.isArray(sources) || !sources.every(isTextOrNull) || typeof mappings !== 'string' ||
        !Array.isArray(names) || !names.every(name => typeof name === 'string') ||
        !Array.isArray(sourcesContent) || !sourcesContent.every(isTextOrNull) || !isTextOrNull(sourceRoot)) {
        throw new Error('请检查 sources、mappings、names、sourceRoot 和 sourcesContent 字段');
    }

    // Only the generated column resets at a semicolon. All other deltas span lines.
    let sourceIndex = 0;
    let originalLine = 0;
    let originalColumn = 0;
    let nameIndex = 0;
    const lines = mappings.split(';').map(line => {
        if (!line) return [];
        let generated = 0;
        const entries = line.split(',').map(segment => {
            const fields = decodeSegment(segment);
            generated += fields[0];
            if (generated < 0) throw new Error('生成代码的列号越界');
            if (fields.length === 1) return { generated, position: null };
            sourceIndex += fields[1];
            originalLine += fields[2];
            originalColumn += fields[3];
            if (sourceIndex < 0 || sourceIndex >= sources.length || originalLine < 0 || originalColumn < 0) {
                throw new Error('映射段指向无效的原始位置');
            }
            let name = null;
            if (fields.length === 5) {
                nameIndex += fields[4];
                if (nameIndex < 0 || nameIndex >= names.length) throw new Error('映射段的名称索引越界');
                name = names[nameIndex];
            }
            return { generated, position: { sourceIndex, line: originalLine + 1, column: originalColumn + 1, name } };
        });
        return entries.sort((a, b) => a.generated - b.generated);
    });

    const prefix = sourceRoot && !sourceRoot.endsWith('/') ? sourceRoot + '/' : sourceRoot || '';
    return {
        sources: sources.map((source, index) => {
            if (source === null) return '未命名源文件 ' + (index + 1);
            const path = prefix + source;
            if (baseURL) {
                try { return new URL(path, baseURL).href; } catch { /* Keep the map's label. */ }
            }
            return path;
        }),
        sourcesContent: sources.map((_, index) => sourcesContent[index] ?? null),
        lookup(line, column) {
            if (![line, column].every(n => Number.isSafeInteger(n) && n > 0)) {
                throw new Error('行号和列号必须是从 1 开始的整数');
            }
            const entries = lines[line - 1] || [];
            let low = 0;
            let high = entries.length;
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                if (entries[mid].generated <= column - 1) low = mid + 1;
                else high = mid;
            }
            return low ? entries[low - 1].position : null;
        }
    };
}

export async function loadSourceMap(input, file, signal) {
    let text = input.trim();
    let baseURL;
    if (file) {
        text = await file.text();
    } else if (/^https?:\/\//i.test(text)) {
        const response = await fetch(text, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
        if (!response.ok) throw new Error('读取链接失败（HTTP ' + response.status + '）');
        baseURL = response.url;
        text = await response.text();
    }
    signal.throwIfAborted();
    if (!text.trim()) throw new Error('请粘贴 Source Map 或选择 .map 文件');
    return parseSourceMap(text, baseURL);
}
