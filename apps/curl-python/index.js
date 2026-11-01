import { curlToPython } from './curl-utils.js';

const input = document.querySelector('#input');
const output = document.querySelector('#output');
const status = document.querySelector('#status');
const copy = document.querySelector('#copy');
function reset() {
    output.value = '';
    copy.disabled = true;
    status.textContent = '';
    status.dataset.error = 'false';
}
function convert() {
    reset();
    try {
        output.value = curlToPython(input.value);
        copy.disabled = false;
        status.textContent = '代码已生成，未执行请求';
    } catch (error) {
        status.dataset.error = 'true';
        status.textContent = error.message;
    }
}
document.querySelector('#convert').addEventListener('click', convert);
document.querySelector('#example').addEventListener('click', () => {
    input.value = `curl 'https://example.com/api/users' \\\n  -H 'Content-Type: application/json' \\\n  --data-raw '{"name":"Ada","active":true}'`;
    convert();
});
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; reset(); input.focus(); });
input.addEventListener('input', reset);
copy.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(output.value);
        status.dataset.error = 'false';
        status.textContent = '已复制代码';
    } catch {
        output.focus(); output.select();
        status.textContent = '自动复制不可用，已选中代码，请按 Ctrl/Cmd+C';
    }
});
document.querySelector('#tools').addEventListener('click', () => chrome.runtime.openOptionsPage());
