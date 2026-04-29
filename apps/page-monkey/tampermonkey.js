/**
 * Tampermonkey / Greasemonkey .user.js 解析器
 * 解析 ==UserScript== ... ==/UserScript== metadata block
 */
window.TampermonkeyParser = (function () {

    const META_RE = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/;

    /**
     * 解析 .user.js 文本为 monkey 配置
     * @param {string} text 整个 .user.js 文件内容
     * @returns {object|null}
     */
    function parse(text) {
        if (!text || typeof text !== 'string') return null;
        let m = text.match(META_RE);
        if (!m) return null;

        let metaBlock = m[1];
        let body = text.slice(m.index + m[0].length).trim();

        let meta = {};
        metaBlock.split(/\r?\n/).forEach(line => {
            let mm = line.match(/^\s*\/\/\s*@([\w-]+)\s+(.+?)\s*$/);
            if (!mm) return;
            let key = mm[1];
            let val = mm[2].trim();
            if (!meta[key]) meta[key] = [];
            meta[key].push(val);
        });

        const first = (k) => (meta[k] && meta[k][0]) || '';
        const all = (k) => meta[k] || [];

        // 转换 @run-at
        let runAtMap = {
            'document-start': 'document-start',
            'document-body': 'document-start',
            'document-end': 'document-end',
            'document-idle': 'document-idle',
            'context-menu': 'document-end'
        };
        let runAt = runAtMap[first('run-at')] || 'document-end';

        let monkey = {
            id: 'mf_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            mName: first('name') || '未命名脚本',
            mNamespace: first('namespace'),
            mVersion: first('version'),
            mDescription: first('description'),
            mAuthor: first('author'),
            mIcon: first('icon') || first('iconURL'),
            mIncludes: [].concat(all('match'), all('include')),
            mExcludes: [].concat(all('exclude')),
            mScript: body,
            mStyle: '',
            mRequireJs: all('require').join(','),
            mRunAt: runAt,
            mAllFrames: !!first('all-frames') && !meta['noframes'],
            mWorld: 'MAIN',
            mRefresh: 0,
            mDisabled: false,
            mGrants: all('grant'),
            mTags: [],
            mHits: 0,
            mUpdatedAt: ''
        };

        if (meta['noframes']) monkey.mAllFrames = false;
        if (!monkey.mIncludes.length) monkey.mIncludes = ['*://*/*'];

        return monkey;
    }

    /**
     * 反序列化：把 monkey 配置导出为 .user.js 文本（Tampermonkey 兼容）
     */
    function stringify(monkey) {
        let lines = ['// ==UserScript=='];
        const pad = (k) => ('// @' + k).padEnd(20, ' ');
        lines.push(pad('name') + (monkey.mName || ''));
        if (monkey.mNamespace) lines.push(pad('namespace') + monkey.mNamespace);
        if (monkey.mVersion) lines.push(pad('version') + monkey.mVersion);
        if (monkey.mDescription) lines.push(pad('description') + monkey.mDescription);
        if (monkey.mAuthor) lines.push(pad('author') + monkey.mAuthor);
        if (monkey.mIcon) lines.push(pad('icon') + monkey.mIcon);

        (monkey.mIncludes || []).forEach(p => lines.push(pad('match') + p));
        (monkey.mExcludes || []).forEach(p => lines.push(pad('exclude') + p));
        (monkey.mGrants || []).forEach(g => lines.push(pad('grant') + g));

        let requires = (monkey.mRequireJs || '').split(/[\s,，]+/).map(s => s.trim()).filter(Boolean);
        requires.forEach(u => lines.push(pad('require') + u));

        lines.push(pad('run-at') + (monkey.mRunAt || 'document-end'));

        // FeHelper 私有扩展字段
        lines.push(pad('fh-id') + monkey.id);
        lines.push(pad('fh-style') + (monkey.mStyle ? 'inline' : ''));
        lines.push(pad('fh-world') + (monkey.mWorld || 'MAIN'));
        lines.push(pad('fh-allframes') + (monkey.mAllFrames ? 'true' : 'false'));
        lines.push(pad('fh-refresh') + (monkey.mRefresh || 0));
        lines.push(pad('fh-disabled') + (monkey.mDisabled ? 'true' : 'false'));
        lines.push(pad('fh-tags') + (monkey.mTags || []).join(','));
        lines.push(pad('fh-updated') + (monkey.mUpdatedAt || ''));

        lines.push('// ==/UserScript==');
        lines.push('');

        if (monkey.mStyle && monkey.mStyle.trim()) {
            lines.push('// === FeHelper Inline CSS ===');
            lines.push('// /* ' + monkey.mStyle.replace(/\*\//g, '*\\/') + ' */');
            lines.push('');
        }

        lines.push(monkey.mScript || '');
        return lines.join('\n');
    }

    /**
     * 从导出的 .user.js 文本中再读出 fh-style 等私有字段
     * （用于双向兼容：导出 → 再导入 不丢字段）
     */
    function parseFhExtras(text, monkey) {
        if (!monkey || !text) return monkey;
        let m = text.match(META_RE);
        if (!m) return monkey;
        let block = m[1];
        block.split(/\r?\n/).forEach(line => {
            let mm = line.match(/^\s*\/\/\s*@fh-([\w-]+)\s+(.*)$/);
            if (!mm) return;
            let k = mm[1], v = mm[2].trim();
            if (k === 'id') monkey.id = v || monkey.id;
            else if (k === 'world') monkey.mWorld = v || 'MAIN';
            else if (k === 'allframes') monkey.mAllFrames = v === 'true';
            else if (k === 'refresh') monkey.mRefresh = parseInt(v) || 0;
            else if (k === 'disabled') monkey.mDisabled = v === 'true';
            else if (k === 'tags') monkey.mTags = v.split(',').map(s => s.trim()).filter(Boolean);
            else if (k === 'updated') monkey.mUpdatedAt = v;
        });
        let cssMatch = text.match(/\/\/\s*\/\*\s*([\s\S]*?)\s*\*\//);
        if (cssMatch && /=== FeHelper Inline CSS ===/.test(text)) monkey.mStyle = cssMatch[1];
        return monkey;
    }

    return { parse, stringify, parseFhExtras };
})();
