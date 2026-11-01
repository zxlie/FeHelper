import { jsonToToon, decodeToon } from './toon-utils.js';

const input = document.querySelector('#input');
const output = document.querySelector('#output');
const direction = document.querySelector('#direction');
const status = document.querySelector('#status');
const copy = document.querySelector('#copy');
const example = '{"users":[{"id":1,"name":"Ada","role":"admin"},{"id":2,"name":"Bob","role":"user"}]}';
let hasResult = false;
function reset() {
    hasResult = false;
    output.value = '';
    copy.disabled = true;
    status.textContent = '';
    status.dataset.error = 'false';
}
function convert() {
    reset();
    try {
        output.value = direction.value === 'encode' ? jsonToToon(input.value) : JSON.stringify(decodeToon(input.value), null, 2);
        hasResult = true;
        copy.disabled = !output.value;
        status.textContent = output.value ? '转换完成' : '转换完成：空对象在 TOON 中表示为空文档';
    } catch (error) {
        status.dataset.error = 'true';
        status.textContent = error.message;
    }
}
document.querySelector('#convert').addEventListener('click', convert);
document.querySelector('#example').addEventListener('click', () => {
    input.value = direction.value === 'encode' ? JSON.stringify(JSON.parse(example), null, 2) : jsonToToon(example);
    convert();
});
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; reset(); input.focus(); });
input.addEventListener('input', reset);
direction.addEventListener('change', () => {
    if (hasResult) input.value = output.value;
    reset();
    document.querySelector('#input-label').textContent = direction.value === 'encode' ? 'JSON 输入' : 'TOON 输入';
    document.querySelector('#output-label').textContent = direction.value === 'encode' ? 'TOON 结果' : 'JSON 结果';
});
copy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(output.value);
        status.dataset.error = 'false';
        status.textContent = '已复制结果';
    } catch {
        output.focus(); output.select();
        status.textContent = '自动复制不可用，已选中结果，请按 Ctrl/Cmd+C';
    }
});
document.querySelector('#tools').addEventListener('click', () => chrome.runtime.openOptionsPage());
