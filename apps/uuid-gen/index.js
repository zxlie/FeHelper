/**
 * FeHelper UUID/ID Generator
 */
(function () {
    var snowflakeSeq = 0;
    var snowflakeLastTs = -1;

    var $ = function (id) { return document.getElementById(id); };

    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 2);
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function formatUUID(uuid) {
        var fmt = $('uuidFormat').value;
        switch (fmt) {
            case 'nohyphen': return uuid.replace(/-/g, '');
            case 'upper': return uuid.toUpperCase();
            case 'braces': return '{' + uuid + '}';
            default: return uuid;
        }
    }

    function generateUUIDs() {
        var count = Math.min(Math.max(parseInt($('uuidCount').value) || 1, 1), 100);
        var results = [];
        for (var i = 0; i < count; i++) {
            results.push(formatUUID(generateUUID()));
        }
        $('uuidResult').value = results.join('\n');
    }

    function generateSnowflakeId() {
        var EPOCH = 1288834974657n;
        var now = BigInt(Date.now());
        if (now === BigInt(snowflakeLastTs)) {
            snowflakeSeq = (snowflakeSeq + 1) & 0xFFF;
            if (snowflakeSeq === 0) {
                while (now <= BigInt(snowflakeLastTs)) {
                    now = BigInt(Date.now());
                }
            }
        } else {
            snowflakeSeq = 0;
        }
        snowflakeLastTs = Number(now);
        var ts = now - EPOCH;
        var dc = BigInt(parseInt($('datacenterId').value) & 0x1F);
        var mc = BigInt(parseInt($('machineId').value) & 0x1F);
        var seq = BigInt(snowflakeSeq);
        return ((ts << 22n) | (dc << 17n) | (mc << 12n) | seq).toString();
    }

    function generateSnowflakes() {
        var count = Math.min(Math.max(parseInt($('snowflakeCount').value) || 1, 1), 100);
        var results = [];
        for (var i = 0; i < count; i++) {
            results.push(generateSnowflakeId());
        }
        $('snowflakeResult').value = results.join('\n');
    }

    function parseSnowflake() {
        try {
            var EPOCH = 1288834974657n;
            var id = BigInt($('snowflakeInput').value.trim());
            var timestamp = Number((id >> 22n) + EPOCH);
            var datacenterId = Number((id >> 17n) & 0x1Fn);
            var machineId = Number((id >> 12n) & 0x1Fn);
            var sequence = Number(id & 0xFFFn);
            var d = new Date(timestamp);
            var pad = function (n, w) { return String(n).padStart(w || 2, '0'); };
            var datetime = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
                ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
                '.' + pad(d.getMilliseconds(), 3);

            $('parsedTimestamp').textContent = timestamp;
            $('parsedDatetime').textContent = datetime;
            $('parsedDatacenterId').textContent = datacenterId;
            $('parsedMachineId').textContent = machineId;
            $('parsedSequence').textContent = sequence;
            $('snowflakeParsed').style.display = '';
        } catch (e) {
            alert('无法解析该雪花ID，请检查输入');
        }
    }

    function generateNanoId() {
        var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
        var len = Math.min(Math.max(parseInt($('nanoIdLength').value) || 1, 1), 256);
        var bytes = crypto.getRandomValues(new Uint8Array(len));
        var id = '';
        for (var i = 0; i < len; i++) {
            id += alphabet[bytes[i] & 63];
        }
        return id;
    }

    function generateNanoIds() {
        var count = Math.min(Math.max(parseInt($('nanoIdCount').value) || 1, 1), 100);
        var results = [];
        for (var i = 0; i < count; i++) {
            results.push(generateNanoId());
        }
        $('nanoIdResult').value = results.join('\n');
    }

    function selectAll(e) {
        var el = e && e.target;
        if (el && typeof el.select === 'function') {
            el.select();
        }
    }

    function loadPatchHotfix() {
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'fh-get-tool-patch',
            toolName: 'uuid-gen'
        }, function (patch) {
            if (patch) {
                if (patch.css) {
                    var style = document.createElement('style');
                    style.textContent = patch.css;
                    document.head.appendChild(style);
                }
                if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                    var script = document.createElement('script');
                    script.textContent = patch.js;
                    document.head.appendChild(script);
                }
            }
        });
    }

    $('btnGenUUID').addEventListener('click', generateUUIDs);
    $('btnGenSnowflake').addEventListener('click', generateSnowflakes);
    $('btnParseSnowflake').addEventListener('click', parseSnowflake);
    $('btnGenNanoId').addEventListener('click', generateNanoIds);

    $('btnDonate').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'open-donate-modal',
            params: { toolName: 'uuid-gen' }
        });
    });

    $('btnOptions').addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.openOptionsPage();
    });

    document.querySelectorAll('.x-result').forEach(function (el) {
        el.addEventListener('click', selectAll);
    });

    generateUUIDs();
    loadPatchHotfix();
})();
