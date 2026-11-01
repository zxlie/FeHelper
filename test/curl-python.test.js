import { describe, expect, it } from 'vitest';
import { parseCurl, curlToPython } from '../apps/curl-python/curl-utils.js';

describe('#677 curl to Python requests', () => {
    it('converts a copied JSON request without executing it', () => {
        const result = parseCurl(`curl 'https://example.com/api' \\\n  -H 'Content-Type: application/json' --data-raw '{"x":true}'`);
        expect(result.method).toBe('POST');
        expect(result.body).toBe('{"x":true}');
        expect(result.headers['Content-Type']).toBe('application/json');
        expect(curlToPython(`curl https://example.com`)).toContain('allow_redirects=False');
    });
    it('preserves repeated data, explicit methods, quotes and basic auth', () => {
        const request = parseCurl(`curl -XPUT -d a=1 --data=b=2 -u 'user:p:a:ss' -H 'X-Name: O'"'"'Brien' https://example.com`);
        expect(request).toMatchObject({ method: 'PUT', body: 'a=1&b=2', auth: ['user', 'p:a:ss'] });
        expect(request.headers['X-Name']).toBe("O'Brien");
    });
    it('keeps duplicate query fields and appends before fragments for -G', () => {
        const request = parseCurl(`curl -G 'https://example.com/?a=1#part' --data-urlencode 'q=你好 x' -d a=2`);
        expect(request.url).toBe('https://example.com/?a=1&q=%E4%BD%A0%E5%A5%BD%20x&a=2#part');
        expect(request.method).toBe('GET');
        expect(request.body).toBeUndefined();
    });
    it('handles JSON defaults, HEAD, cookies, user agent and redirect / TLS flags', () => {
        expect(parseCurl('curl -ILk https://example.com')).toMatchObject({ method: 'HEAD', redirects: true, verify: false });
        expect(parseCurl(`curl --json '{"a":1}' https://example.com`).headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
        expect(parseCurl(`curl -Ik -b 'a=1; b=2' -A Agent https://example.com`)).toMatchObject({ method: 'HEAD', redirects: false, verify: false, headers: { Cookie: 'a=1; b=2', 'User-Agent': 'Agent' } });
    });
    it.each([`curl https://example.com; echo pwned`, 'curl "https://example.com/$(id)"', 'curl $URL',
        'curl https://example.com --unknown a', 'curl -d @secret https://example.com',
        'curl https://example.com https://second.com', 'curl -H "X-A: 1" -H "x-a: 2" https://example.com',
        'curl --max-time 10 https://example.com', 'curl -b cookie.txt https://example.com',
        'curl -F file=@secret https://example.com', 'curl -H "X-A:" https://example.com',
        'curl -u user https://example.com', 'curl -I -d a=1 https://example.com',
        'curl https://example.com\necho hello', 'curl -H "X-A: one\ntwo" https://example.com'])('fails explicitly for unsafe or unsupported semantics: %s', value => {
        expect(() => curlToPython(value)).toThrow();
    });
    it('encodes code-like text only as a Python string literal', () => {
        const code = curlToPython(`curl https://example.com --data-raw '__import__("os").system("id")'`);
        expect(code).toContain('data="__import__(\\"os\\").system(\\"id\\")".encode("utf-8")');
        expect(code).not.toContain('eval(');
    });
});

describe('curl request fidelity', () => {
    it('preserves duplicate multipart fields without opening files', () => {
        const source = `curl --form-string 'x=@literal' -F x=second https://example.com`;
        expect(parseCurl(source).forms).toEqual([['x', '@literal'], ['x', 'second']]);
        expect(curlToPython(source)).toContain('("x", (None, "@literal"))');
    });
    it('handles empty request bodies and literal @ with data-raw', () => {
        expect(parseCurl(`curl -d '' https://example.com`)).toMatchObject({ method: 'POST', body: '' });
        expect(parseCurl(`curl --data-raw @literal https://example.com`).body).toBe('@literal');
    });
    it('keeps quoted shell metacharacters as data and accepts escaped dollar signs', () => {
        expect(parseCurl("curl --data-raw '$HOME; echo hi | cat' https://example.com").body).toBe('$HOME; echo hi | cat');
        expect(parseCurl('curl --data-raw "\\$HOME" https://example.com').body).toBe('$HOME');
    });
    it('keeps custom JSON headers and concatenates repeated --json fragments', () => {
        expect(parseCurl(`curl -H 'content-type: custom' --json '{' --json '}' https://example.com`)).toMatchObject({ body: '{}', headers: { 'content-type': 'custom', Accept: 'application/json' } });
    });
    it('supports IPv6 URLs without treating hosts as curl glob ranges', () => {
        expect(parseCurl('curl http://[::1]:8080/a').url).toBe('http://[::1]:8080/a');
    });
    it.each(['curl -H', 'curl --request', 'curl "https://example.com', 'curl --compressed https://example.com',
        'curl --data-urlencode name@file https://example.com', 'curl --json a -d b https://example.com',
        'curl -F a=b -d c=d https://example.com', 'curl --location=true https://example.com',
        'curl --url https://example.com -H "Content-Length: 2"', 'curl -H "Accept-Encoding: br" https://example.com',
        'curl -u user:pass -H "Authorization: Bearer x" https://example.com',
        'curl ftp://example.com', 'curl https://user:pass@example.com',
        "curl 'https://example.com/[1-3]'", 'curl -F "a=b;type=text/plain" https://example.com'])('rejects semantics that cannot be represented safely: %s', text => {
        expect(() => parseCurl(text)).toThrow();
    });
});

describe('curl / requests transport differences', () => {
    it.each(['curl -Xpost https://example.com', 'curl -L -X POST https://example.com',
        "curl -L -b 'a=1' https://example.com", "curl -H 'X-Name: 你好' https://example.com",
        "curl -u 'café:password' https://example.com"])('rejects lossy transport mapping: %s', source => {
        expect(() => curlToPython(source)).toThrow();
    });
});
