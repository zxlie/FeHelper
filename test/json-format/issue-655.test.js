import vm from 'node:vm';
import {createRequire} from 'node:module';
import {describe, expect, it} from 'vitest';
import {createFormatPage, readSource} from './runtime.js';

const require = createRequire(import.meta.url);
const utils = require('../../apps/json-format/json-auto-utils.js');
// Event fields transcribed from the issue's original-response screenshot.
const events = [
    {type: 'api', auto_sync: false, test_id: '6c22da40ec01000', event_id: '6c22da795801000', enabled: 1,
        data: {target_id: '1d38e40', project_id: '29c12c689465000', parent_id: '15478e8', target_type: 'api'}},
    {type: 'api', auto_sync: false, test_id: '6c22da40ec01000', event_id: '6c22da795c01000', enabled: 1,
        data: {target_id: '1441214', project_id: '29c12c689465000', parent_id: '14ca7d5', target_type: 'api'}}
];

function contentScript() {
    const page = createFormatPage();
    const context = page.context;
    context.location.protocol = 'chrome-extension:';
    context.chrome = {runtime: {getURL: path => path, sendMessage() {}}};
    context.Awesome = {collectAndSendClientInfo() {}};
    context.Node = {ELEMENT_NODE: 1, TEXT_NODE: 3};
    // Expose only the actual pipeline's internal entry points in this test VM.
    const script = readSource('apps/json-format/content-script.js').replace(
        'format: () => _getAllOptions(options => {',
        '_prepareSourceForFormatter, _getJsonContentFromDOM, _getJsonObject, _extendsOptions, format: () => _getAllOptions(options => {'
    );
    vm.runInContext(script, context);
    const api = context.JsonAutoFormat;
    api._extendsOptions({AUTO_TEXT_DECODE: true, NESTED_ESCAPE_PARSE: false});
    return {page, context, api};
}

describe('#655: automatic content formatting preserves the runner event array', () => {
    it('does not accept decoded string delimiters that replace the runner object', async () => {
        const {page, context, api} = contentScript();
        const source = JSON.stringify({code: 0, data: {runner: {
            test_events: events,
            option: '%22%7D%2C%22runner%22%3A%7B%22option%22%3A%22'
        }}, extra_err: {}});
        // Whole-document decoding yields valid JSON with a duplicate runner key,
        // whose second value has no test_events. It must not replace the original.
        expect(JSON.parse(decodeURIComponent(source)).data.runner.test_events).toBeUndefined();
        context.document.body = {childNodes: [], children: [], textContent: source};
        context.document.querySelectorAll = selector => selector === 'body>pre' ? [{textContent: source}] : [];
        context.JsonEnDecode.urlDecodeByFetch = async text => decodeURIComponent(text);
        const fromDOM = api._getJsonContentFromDOM({textContent: source});
        const normalized = utils.safeStringify(api._getJsonObject(fromDOM));
        const prepared = await api._prepareSourceForFormatter(normalized);
        await context.Formatter.format(prepared, undefined, false);
        expect(JSON.parse(prepared).data.runner.test_events).toEqual(events);
        for (const event of events) expect(page.node('jfContent').innerHTML).toContain(event.event_id);
    });

    it.each([
        ['{"items":[1,2]}', '{"items":[]}'],
        ['{"items":[1,2]}', '{"items":[1,"2"]}'],
        ['{"items":[1,2]}', '{"items":[1,3]}'],
        ['{"items":[1,2]}', '{"renamed":[1,2]}'],
        ['{"items":[1,2]}', '{"items":[1,2],"extra":true}'],
        ['{"items":[null,false]}', '{"items":[null,true]}'],
    ])('preserves the complete input when decoding changes structure or typed values', (source, decoded) => {
        expect(utils.coerceDecodedJSONSource(source, decoded)).toBe(source);
    });

    it('still decodes string values and supports a fully encoded JSON document', () => {
        expect(utils.coerceDecodedJSONSource('{"items":["%E4%B8%AD"]}', '{"items":["中"]}'))
            .toBe('{"items":["中"]}');
        expect(utils.coerceDecodedJSONSource('%7B%22items%22%3A%5B1%5D%7D', '{"items":[1]}'))
            .toBe('{"items":[1]}');
    });
});


it('#655 rejects same-shape decoding that overwrites a sibling string', () => {
    for (const b of ['good', '%42']) {
        const source = JSON.stringify({b, a: '%22%2C%22b%22%3A%22BAD%22%2C%22a%22%3A%22'});
        const decoded = decodeURIComponent(source);
        expect(JSON.parse(decoded).b).toBe('BAD');
        expect(utils.coerceDecodedJSONSource(source, decoded)).toBe(source);
    }
});
