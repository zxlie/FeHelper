// Serve the repository root over HTTP. The optional /sample route is the local
// response_new.json; it is deliberately not checked into the repository.
const generatedSource = JSON.stringify({ items: Array.from({ length: 9000 }, (_, id) => ({ id, data: { text: '中文 <tag> \\"', value: [1, 2, 3] } })) });
let source = generatedSource;
let expected = '';
let rows = [];
let longTasks = [];
let windowStart = Infinity;
let windowEnd = 0;
let status = '就绪';
let copyEvent = null;
const editor = () => document.querySelector('#jfContent .CodeMirror')?.CodeMirror;
const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
const pause = () => new Promise(resolve => setTimeout(resolve, 40));
const output = document.querySelector('#report');
const percentile = values => values.sort((a, b) => a - b)[Math.ceil(values.length * 0.95) - 1];
function report() {
    const summary = {};
    for (const name of new Set(rows.map(row => row.name))) {
        const values = rows.filter(row => row.name === name).map(row => row.frameMs);
        summary[name] = { count: values.length, p95: percentile(values), max: Math.max(...values) };
    }
    output.textContent = JSON.stringify({ status, lines: editor()?.lineCount(), chars: expected.length, copyEvent, summary, longTasks, rows }, null, 2);
}
new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
        if (entry.startTime >= windowStart && entry.startTime <= windowEnd) {
            longTasks.push({ start: entry.startTime, ms: entry.duration });
        }
    }
    report();
}).observe({ type: 'longtask', buffered: true });
function assert(ok, message) { if (!ok) throw new Error(message); }
document.addEventListener('copy', () => {
    const element = document.activeElement;
    const text = element?.tagName === 'TEXTAREA'
        ? element.value.slice(element.selectionStart, element.selectionEnd) : String(window.getSelection());
    copyEvent = { chars: text.length, complete: text === expected };
});
function load(text) {
    expected = FHJsonAutoUtils.safeStringify(JSON.parse(text), 4);
    Formatter.formatSync(text);
    assert(editor()?.getValue() === expected, '初始文本不完整');
    rows = [];
    longTasks = [];
    copyEvent = null;
    status = '已载入';
    report();
}
async function measure(name, action, done) {
    const start = performance.now();
    action();
    const syncMs = performance.now() - start;
    await frame();
    const frameMs = performance.now() - start;
    if (done) {
        while (!done()) {
            assert(performance.now() - start < 30000, '折叠超时');
            await pause();
        }
    }
    rows.push({ name, syncMs, frameMs, completeMs: performance.now() - start });
}
function foldDone() { return document.querySelector('.fh-json-collapse-toggle')?.textContent === '展开'; }
async function run() {
    assert(editor(), '请先载入数据');
    rows = [];
    longTasks = [];
    windowStart = performance.now();
    windowEnd = Infinity;
    try {
        for (let round = 0; round < 30; round++) {
            status = `第 ${round + 1}/30 轮`;
            await measure('全部折叠', () => Formatter.collapseAll(), foldDone);
            const count = editor().getAllMarks().length;
            await measure('根节点展开', () => editor().foldCode(CodeMirror.Pos(0, 0), null, 'unfold'));
            assert(editor().getAllMarks().length === count - 1, '根展开未保留子折叠');
            const child = editor().getAllMarks().map(mark => ({ mark, range: mark.find() }))
                .filter(item => item.range && editor().getLineHandle(item.range.from.line).height > 0)
                .sort((a, b) => (b.range.to.line - b.range.from.line) - (a.range.to.line - a.range.from.line))[0];
            assert(child, '缺少局部展开节点');
            await measure('大型子节点展开', () => child.mark.clear());
            assert(editor().getAllMarks().length === count - 2, '子展开未保留其他折叠');
            await measure('局部展开后重新折叠', () => Formatter.collapseAll(), foldDone);
            assert(editor().getAllMarks().length === count, '重复折叠产生了重叠标记');
            await measure('全部展开', () => Formatter.expandAll());
            assert(editor().getAllMarks().length === 0, '全文仍有折叠');
            assert(editor().getValue() === expected && document.querySelector('#jfContent_pre').textContent === expected, '展开后文本不完整');
            assert(editor().getOption('lineWrapping') === false, '换行选项未恢复');
            await pause();
            report();
        }
        const expanded = editor().getDoc();
        editor().foldCode(CodeMirror.Pos(0, 0), null, 'fold');
        await measure('手动折叠后全部折叠', () => Formatter.collapseAll(), foldDone);
        await measure('清理缓存中的手动折叠', () => Formatter.expandAll());
        assert(editor().getDoc() === expanded && editor().getAllMarks().length === 0, '缓存手动折叠未清除');
        assert(editor().getValue() === expected, '缓存切换改变了文本');
        editor().scrollTo(null, editor().getScrollInfo().height);
        await frame();
        assert(Array.from(document.querySelectorAll('.CodeMirror-linenumber')).some(node => Number(node.textContent) === editor().lineCount()), '末尾行不可见');
        editor().scrollTo(null, 0);
        await frame();
        status = '30 轮通过：文本完整，子折叠保留，全文展开无残留';
    } finally {
        windowEnd = performance.now();
        report();
    }
}
function action(callback) {
    return async () => {
        try { await callback(); }
        catch (error) { status = error.stack; report(); }
    };
}
document.querySelector('#sample').onclick = action(async () => {
    const response = await fetch('/sample');
    assert(response.ok, '请在本地服务器配置 /sample 路由，或使用生成数据');
    source = await response.text();
    load(source);
});
document.querySelector('#sample-file').onchange = action(async () => {
    const file = document.querySelector('#sample-file').files[0];
    if (file) { source = await file.text(); load(source); }
});
document.querySelector('#generated').onclick = action(() => { source = generatedSource; load(source); });
document.querySelector('#double').onclick = action(() => load('[' + Array(2).fill(source).join(',') + ']'));
document.querySelector('#quintuple').onclick = action(() => load('[' + Array(5).fill(source).join(',') + ']'));
document.querySelector('#run').onclick = action(run);
document.querySelector('#collapse').onclick = action(() => Formatter.collapseAll());
document.querySelector('#expand').onclick = action(() => Formatter.expandAll());
window.toast = message => { status = message; report(); };
