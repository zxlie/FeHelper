import { loadSourceMap } from './parser.js';

const byId = id => document.getElementById(id);
const input = byId('map-input');
const fileInput = byId('map-file');
const results = byId('results');
const sources = byId('sources');
const status = byId('status');
const position = byId('position');
const mappedLine = byId('mapped-line');
let map;
let pending;

function reset() {
    pending?.abort();
    map = null;
    results.hidden = true;
    sources.replaceChildren();
    byId('preview').textContent = '';
    position.textContent = '';
    mappedLine.textContent = '';
    mappedLine.hidden = true;
    status.textContent = '';
    status.dataset.error = 'false';
}

function showSource() {
    const content = map.sourcesContent[sources.selectedIndex];
    byId('preview').textContent = content ?? '此文件未内嵌源码，仍可查询映射位置。';
}

async function loadMap() {
    reset();
    const request = new globalThis.AbortController();
    pending = request;
    try {
        status.textContent = '正在读取 Source Map…';
        const loaded = await loadSourceMap(input.value, fileInput.files[0], request.signal);
        if (request.signal.aborted) return;
        map = loaded;
        const options = document.createDocumentFragment();
        for (const source of map.sources) {
            const option = document.createElement('option');
            option.textContent = source;
            options.append(option);
        }
        sources.append(options);
        sources.disabled = !map.sources.length;
        if (map.sources.length) showSource();
        else byId('preview').textContent = '此映射没有原始文件';
        status.textContent = '已解析，包含 ' + map.sources.length + ' 个原始文件。';
        results.hidden = false;
    } catch (error) {
        if (request.signal.aborted) return;
        status.textContent = error.message;
        status.dataset.error = 'true';
    }
}

byId('lookup').addEventListener('submit', event => {
    event.preventDefault();
    mappedLine.hidden = true;
    try {
        const hit = map.lookup(byId('line').valueAsNumber, byId('column').valueAsNumber);
        if (!hit) {
            position.textContent = '此生成位置没有原始映射';
            return;
        }
        sources.selectedIndex = hit.sourceIndex;
        showSource();
        position.textContent = map.sources[hit.sourceIndex] + ':' + hit.line + ':' + hit.column +
            (hit.name ? '（' + hit.name + '）' : '');
        const content = map.sourcesContent[hit.sourceIndex];
        const line = content?.split(/\r\n|[\r\n\u2028\u2029]/)[hit.line - 1];
        if (line !== undefined) {
            mappedLine.textContent = hit.line + ' │ ' + line;
            mappedLine.hidden = false;
        }
    } catch (error) {
        position.textContent = error.message;
    }
});

function clearPosition() {
    position.textContent = '';
    mappedLine.hidden = true;
}

byId('lookup').addEventListener('input', clearPosition);
sources.addEventListener('change', () => {
    clearPosition();
    showSource();
});
input.addEventListener('input', () => {
    fileInput.value = '';
    reset();
});
fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) {
        reset();
        return;
    }
    input.value = '';
    loadMap();
});
byId('parse').addEventListener('click', loadMap);
byId('tools').addEventListener('click', () => chrome.runtime.openOptionsPage());
