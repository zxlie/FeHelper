import vm from 'node:vm';
import {expect, it} from 'vitest';
import {createFormatPage, flush, readSource} from './runtime.js';

const video = {id: 7, title: '分享', width: 360, height: 640, duration: 20, views: 8,
    author: '示例', muted: false, tags: [], cover: 'cover.jpg', url: 'clip.mp4'};
const desc = '最近很火的 AI 短剧！3.3 元体验全套教学，没有基础也可以来试一试';
const response = {resultCode: 0, resultMsg: '成功', data: {video, desc}, success: true};
const text = textContent => ({nodeType: 3, textContent});
const element = (tagName, textContent) => ({nodeType: 1, tagName, textContent, offsetWidth: 1, offsetHeight: 1});

async function renderResponse(contentType, childNodes) {
    const {context, node} = createFormatPage();
    let start;
    const children = childNodes.filter(child => child.nodeType === 1);
    const classList = {add() {}, toggle() {}};
    Object.assign(context, {
        URL, location: new URL('https://localhost/share'), Node: {ELEMENT_NODE: 1, TEXT_NODE: 3},
        setTimeout(callback) { start = callback; }, clearInterval() {},
        Awesome: {collectAndSendClientInfo() {}},
        chrome: {runtime: {sendMessage(message, callback) {
            if (message.thing === 'request-jsonformat-options') callback({JSON_PAGE_FORMAT: true});
        }}}
    });
    Object.assign(context.document, {
        contentType, documentElement: {classList},
        body: {childNodes, children, textContent: childNodes.map(child => child.textContent).join(''), classList},
        getElementById: id => id === 'jfToolbar' ? {} : null,
        querySelectorAll: selector => selector === 'body>pre' ? children.filter(el => el.tagName === 'PRE') : []
    });
    // The VM supplies the toolbar shell. Exercise automatic startup and the real tree renderer.
    context.document.querySelector = selector => selector === '#jfToolbar' ? null : node(selector.slice(1));
    context.Formatter.setStatusBarEnabled = () => {};
    vm.runInContext(readSource('apps/json-format/json-bigint.js'), context);
    vm.runInContext(readSource('apps/json-format/content-script.js'), context);
    start();
    await flush();
    return node('jfContent').innerHTML;
}

it.each(['application/json', 'application/vnd.api+json'])('#687 keeps inline-wrapped fields in %s responses', async type => {
    const html = await renderResponse(type, [
        text('{"resultCode":0,"resultMsg":"成功","data":{"video":' + JSON.stringify(video)),
        element('SPAN', ',"desc":' + JSON.stringify(desc)), text('}'),
        element('SPAN', ',"success":true'), text('}')
    ]);
    const keys = Array.from(html.matchAll(/<span class="key">([^<]*)<\/span>/g), match => match[1]);
    expect(keys).toEqual(['resultCode', 'resultMsg', 'data', 'video', ...Object.keys(video), 'desc', 'success']);
    expect(html).toContain(desc);
    expect(html).toContain('<span class="bool">true</span>');
});

it('#687 keeps reading the JSON pre when the document also contains viewer text', async () => {
    const html = await renderResponse('application/json', [text('Pretty-print'), element('PRE', JSON.stringify(response))]);
    expect(html).toContain(desc);
    expect(html).toContain('<span class="key">success</span>');
});
