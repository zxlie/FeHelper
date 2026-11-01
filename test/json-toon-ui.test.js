import fs from 'node:fs';
import vm from 'node:vm';
import {expect, it} from 'vitest';
import {jsonToToon, decodeToon} from '../apps/json-toon/toon-utils.js';
function page() {
    const nodes = new Map();
    const node = selector => {
        if (!nodes.has(selector)) nodes.set(selector, {value: '', dataset: {}, handlers: {}, addEventListener(event, fn) {this.handlers[event] = fn;}, focus() {}});
        return nodes.get(selector);
    };
    node('#direction').value = 'encode';
    vm.runInNewContext(fs.readFileSync(new URL('../apps/json-toon/index.js', import.meta.url), 'utf8').replace(/^import .*;\n/, ''), {document: {querySelector: node}, jsonToToon, decodeToon});
    return {node, change(value) {node('#direction').value = value; node('#direction').handlers.change();}};
}
it.each(['pasted', 'failed', 'edited'])('#681 keeps %s input when direction changes without a current conversion', kind => {
    const p = page();
    p.node('#input').value = '{"a":1}';
    if (kind === 'edited') p.node('#convert').handlers.click();
    p.node('#input').value = 'users[1]{id,name}:\n  1,Ada';
    p.node('#input').handlers.input();
    if (kind === 'failed') p.node('#convert').handlers.click();
    p.change('decode');
    expect(p.node('#input').value).toBe('users[1]{id,name}:\n  1,Ada');
});
it('#681 can reverse the valid empty TOON representation of an empty object', () => {
    const p = page();
    p.node('#input').value = '{}';
    p.node('#convert').handlers.click();
    p.change('decode');
    expect(p.node('#input').value).toBe('');
    p.node('#convert').handlers.click();
    expect(p.node('#output').value).toBe('{}');
});
