/**
 * 网页油猴 v2 - Vue 应用
 */

Date.prototype.format = function (pattern) {
    let pad = (s, l) => String(s).padStart(l, '0');
    if (typeof pattern !== 'string') return this.toString();
    return pattern
        .replace(/yyyy/g, this.getFullYear())
        .replace(/MM/g, pad(this.getMonth() + 1, 2))
        .replace(/dd/g, pad(this.getDate(), 2))
        .replace(/HH/g, pad(this.getHours(), 2))
        .replace(/mm/g, pad(this.getMinutes(), 2))
        .replace(/ss/g, pad(this.getSeconds(), 2));
};

// 本地开发兼容
if (new URL(location.href).protocol.startsWith('http')) {
    window.chrome = window.chrome || {};
    window.chrome.storage = window.chrome.storage || {
        local: {
            get(key, cb) {
                let obj = {};
                [].concat(key).forEach(k => { obj[k] = localStorage.getItem(k); });
                cb && cb(obj);
            },
            set(obj, cb) {
                Object.keys(obj).forEach(k => localStorage.setItem(k, obj[k]));
                cb && cb();
            }
        }
    };
    window.chrome.runtime = window.chrome.runtime || {
        sendMessage(msg, cb) { console.log('[mock chrome.runtime.sendMessage]', msg); cb && cb(null); },
        openOptionsPage() { console.log('[mock openOptionsPage]'); }
    };
}

const PAGE_MONKEY_LOCAL_STORAGE_KEY = 'PAGE-MODIFIER-LOCAL-STORAGE-KEY';
const PAGE_MONKEY_LOG_KEY = 'PAGE-MODIFIER-LOG-KEY';
const THEME_KEY = 'PAGE-MODIFIER-THEME';
const ORDER_KEY = 'PAGE-MODIFIER-ORDER';

let cmCode = null, cmStyle = null, cmFull = null;

/* ===================== 匹配引擎（与 background 对齐） ===================== */
const matchOnePattern = (pattern, url) => {
    if (!pattern) return false;
    let m = String(pattern).match(/^\/(.*)\/([gimsuy]*)$/);
    if (m) { try { return new RegExp(m[1], m[2] || '').test(url); } catch (e) { return false; } }
    if (pattern.indexOf('*') > -1) {
        let p = pattern;
        if (p.startsWith('*://')) p = p.replace('*://', '(http|https|file)://');
        else if (p.indexOf('://') < 0) p = '(http|https|file)://' + p;
        try {
            return new RegExp('^' + p.replace(/\./g, '\\.').replace(/\//g, '\\/').replace(/\*/g, '.*').replace(/\?/g, '\\?') + '$').test(url);
        } catch (e) { return false; }
    }
    let arr = [pattern, `${pattern}/`];
    if (!pattern.startsWith('http://') && !pattern.startsWith('https://') && !pattern.startsWith('file://')) {
        arr = arr.concat([`http://${pattern}`, `http://${pattern}/`, `https://${pattern}`, `https://${pattern}/`]);
    }
    return arr.includes(url);
};

const isMatchAll = (cm, url) => {
    let inc = cm.mIncludes && cm.mIncludes.length ? cm.mIncludes : (cm.mPattern ? [cm.mPattern] : []);
    if (!inc.length) return false;
    if (!inc.some(p => matchOnePattern(p, url))) return false;
    if ((cm.mExcludes || []).some(p => matchOnePattern(p, url))) return false;
    return true;
};

/* ===================== 数据迁移 ===================== */
const migrate = (cm) => {
    if (!cm || typeof cm !== 'object') return cm;
    if (!cm.mIncludes || !cm.mIncludes.length) cm.mIncludes = cm.mPattern ? [cm.mPattern] : [];
    if (!Array.isArray(cm.mExcludes)) cm.mExcludes = [];
    if (!cm.mRunAt) cm.mRunAt = 'document-end';
    if (typeof cm.mAllFrames !== 'boolean') cm.mAllFrames = false;
    if (!cm.mWorld) cm.mWorld = 'MAIN';
    if (!Array.isArray(cm.mGrants)) cm.mGrants = [];
    if (!Array.isArray(cm.mTags)) cm.mTags = [];
    if (typeof cm.mHits !== 'number') cm.mHits = 0;
    if (typeof cm.mStyle !== 'string') cm.mStyle = '';
    if (!cm.mUpdatedAt) cm.mUpdatedAt = '';
    return cm;
};

const newMonkey = () => ({
    id: 'mf_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
    mName: '',
    mIncludes: ['*://*/*'],
    mExcludes: [],
    mScript: '',
    mStyle: '',
    mRequireJs: '',
    mRunAt: 'document-end',
    mAllFrames: false,
    mWorld: 'MAIN',
    mRefresh: 0,
    mDisabled: false,
    mGrants: [],
    mTags: [],
    mHits: 0,
    mAuthor: '',
    mVersion: '1.0.0',
    mDescription: '',
    mUpdatedAt: new Date().format('yyyy-MM-dd HH:mm:ss')
});


/* ===================== Vue 应用 ===================== */
new Vue({
    el: '#pageContainer',
    data: {
        editing: false,
        editWithUI: true,
        tab: 'meta',
        editCM: newMonkey(),
        cachedMonkeys: [],

        search: '',
        filterStatus: 'all',
        filterTag: '',
        selectedIds: [],

        showTemplateModal: false,
        showImportModal: false,
        showLogModal: false,
        templates: window.MonkeyTemplates || [],

        importUrl: '',
        logs: [],
        errorBadge: 0,

        toastMsg: '',
        toastTimer: null,

        dialog: {
            visible: false,
            title: '',
            message: '',
            type: 'info',          // info | warning | danger | success
            alertOnly: false,
            confirmText: '确定',
            cancelText: '取消',
            _resolve: null
        },

        testUrl: '',
        isDark: false,

        dragId: null,
        dropTargetId: null,

        availableGrants: [
            'GM_setValue', 'GM_getValue', 'GM_deleteValue', 'GM_listValues',
            'GM_addStyle', 'GM_xmlhttpRequest', 'GM_notification',
            'GM_openInTab', 'GM_setClipboard', 'GM_log', 'unsafeWindow'
        ]
    },

    computed: {
        enabledCount() { return this.cachedMonkeys.filter(c => !c.mDisabled).length; },
        disabledCount() { return this.cachedMonkeys.filter(c => c.mDisabled).length; },
        totalHits() { return this.cachedMonkeys.reduce((s, c) => s + (c.mHits || 0), 0); },
        allTags() {
            let s = new Set();
            this.cachedMonkeys.forEach(c => (c.mTags || []).forEach(t => s.add(t)));
            return Array.from(s);
        },
        filteredMonkeys() {
            let kw = this.search.trim().toLowerCase();
            return this.cachedMonkeys.filter(c => {
                if (this.filterStatus === 'enabled' && c.mDisabled) return false;
                if (this.filterStatus === 'disabled' && !c.mDisabled) return false;
                if (this.filterTag && !(c.mTags || []).includes(this.filterTag)) return false;
                if (kw) {
                    let bag = [
                        c.mName, c.mDescription, c.mAuthor,
                        ...(c.mIncludes || []), ...(c.mExcludes || []),
                        ...(c.mTags || [])
                    ].join(' ').toLowerCase();
                    if (!bag.includes(kw)) return false;
                }
                return true;
            });
        },
        matchResult() {
            if (!this.testUrl) return false;
            return isMatchAll(this.editCM, this.testUrl);
        }
    },

    mounted() {
        this.initTheme();
        this.loadMonkeys();
        this.loadLogs(true);

        window.onbeforeunload = (e) => {
            if (this.editCM.unSaved) (e || window.event).returnValue = '当前有未保存的修改，确定要离开吗？';
        };

        document.addEventListener('keydown', (e) => {
            if (this.dialog.visible) {
                if (e.key === 'Escape') { e.preventDefault(); this.onDialogCancel(); }
                else if (e.key === 'Enter') { e.preventDefault(); this.onDialogConfirm(); }
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                if (this.editing) { e.preventDefault(); this.saveMonkey(); }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (this.editing) { e.preventDefault(); this.saveMonkey(true); }
            }
        });

        // 监听日志消息（来自 background 主动推送 - 暂未启用，预留）
        try {
            chrome.runtime.onMessage && chrome.runtime.onMessage.addListener && chrome.runtime.onMessage.addListener((msg) => {
                if (msg && msg.type === 'fh-page-monkey-log-updated') {
                    this.loadLogs();
                }
            });
        } catch (e) {}

        // 周期性轻量刷新日志徽标（避免 SW 推送漏掉）
        setInterval(() => this.loadLogs(true), 8000);
    },

    methods: {

        /* ============ 主题 ============ */
        initTheme() {
            let saved = localStorage.getItem(THEME_KEY);
            if (saved === 'dark') this.isDark = true;
            else if (saved === 'light') this.isDark = false;
            else this.isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme();
        },
        applyTheme() {
            document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
        },
        toggleTheme() {
            this.isDark = !this.isDark;
            this.applyTheme();
            localStorage.setItem(THEME_KEY, this.isDark ? 'dark' : 'light');
        },

        /* ============ 数据加载/保存 ============ */
        loadMonkeys() {
            chrome.storage.local.get([PAGE_MONKEY_LOCAL_STORAGE_KEY, ORDER_KEY], (resps) => {
                let raw = resps && resps[PAGE_MONKEY_LOCAL_STORAGE_KEY];
                let storageMode = false;
                if (!raw) {
                    raw = localStorage.getItem(PAGE_MONKEY_LOCAL_STORAGE_KEY) || '[]';
                    storageMode = true;
                }
                let arr = [];
                try { arr = JSON.parse(raw); } catch (e) {}
                arr = (arr || []).filter(c => c && (c.mName || c.mPattern || c.mScript || (c.mIncludes && c.mIncludes.length))).map(migrate);

                let order = [];
                try { order = JSON.parse(resps[ORDER_KEY] || '[]'); } catch (e) {}
                if (order && order.length) {
                    let map = new Map(arr.map(m => [m.id, m]));
                    let sorted = [];
                    order.forEach(id => { if (map.has(id)) { sorted.push(map.get(id)); map.delete(id); } });
                    map.forEach(v => sorted.push(v));
                    arr = sorted;
                }

                this.cachedMonkeys = arr;
                if (storageMode && arr.length) this.persist();
            });
        },

        persist(silent) {
            let data = {};
            data[PAGE_MONKEY_LOCAL_STORAGE_KEY] = JSON.stringify(this.cachedMonkeys);
            data[ORDER_KEY] = JSON.stringify(this.cachedMonkeys.map(m => m.id));
            chrome.storage.local.set(data, () => { if (!silent) this.toast('已保存'); });
        },

        markUnsaved() { this.editCM.unSaved = true; },

        /* ============ 编辑器 ============ */
        ensureEditor() {
            this.$nextTick(() => {
                if (!cmCode && this.$refs.mScript) {
                    cmCode = CodeMirror.fromTextArea(this.$refs.mScript, {
                        mode: 'text/javascript', lineNumbers: true, matchBrackets: true,
                        styleActiveLine: true, lineWrapping: true, indentUnit: 4, tabSize: 4
                    });
                    cmCode.on('change', () => { this.editCM.mScript = cmCode.getValue(); this.markUnsaved(); });
                }
                if (!cmStyle && this.$refs.mStyle) {
                    cmStyle = CodeMirror.fromTextArea(this.$refs.mStyle, {
                        mode: 'text/css', lineNumbers: true, lineWrapping: true, indentUnit: 2, tabSize: 2
                    });
                    cmStyle.on('change', () => { this.editCM.mStyle = cmStyle.getValue(); this.markUnsaved(); });
                }
                if (!cmFull && this.$refs.mFullScript) {
                    cmFull = CodeMirror.fromTextArea(this.$refs.mFullScript, {
                        mode: 'text/javascript', lineNumbers: true, matchBrackets: true,
                        styleActiveLine: true, lineWrapping: true, indentUnit: 4, tabSize: 4
                    });
                    cmFull.on('change', () => { this.markUnsaved(); });
                }
                this.refreshEditors();
            });
        },

        refreshEditors() {
            if (cmCode) cmCode.setValue(this.editCM.mScript || '');
            if (cmStyle) cmStyle.setValue(this.editCM.mStyle || '');
            if (cmFull) cmFull.setValue(window.TampermonkeyParser.stringify(this.editCM));
            setTimeout(() => {
                cmCode && cmCode.refresh();
                cmStyle && cmStyle.refresh();
                cmFull && cmFull.refresh();
            }, 50);
        },

        createMonkey() {
            this.editing = true;
            this.editCM = newMonkey();
            this.editCM.mScript = window.MonkeyNewGuide || '';
            this.editCM.unSaved = true;
            this.tab = 'meta';
            this.editWithUI = true;
            this.ensureEditor();
        },

        selectMonkey(cm) {
            this.editing = true;
            this.editCM = JSON.parse(JSON.stringify(migrate(cm)));
            this.editCM.unSaved = false;
            this.tab = 'meta';
            this.editWithUI = true;
            this.ensureEditor();
        },

        cloneMonkey(cm) {
            let copy = JSON.parse(JSON.stringify(migrate(cm)));
            copy.id = newMonkey().id;
            copy.mName = (copy.mName || '未命名') + ' (副本)';
            copy.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
            copy.mHits = 0;
            this.cachedMonkeys.push(copy);
            this.persist();
        },

        saveMonkey(closeAfter) {
            // 如果是纯代码模式，先把 cmFull 解析回 editCM
            if (!this.editWithUI && cmFull) {
                let text = cmFull.getValue();
                try {
                    let parsed = window.TampermonkeyParser.parse(text);
                    if (parsed) {
                        window.TampermonkeyParser.parseFhExtras(text, parsed);
                        // 保留原 id
                        parsed.id = this.editCM.id;
                        parsed.mHits = this.editCM.mHits || 0;
                        Object.assign(this.editCM, parsed);
                    }
                } catch (e) { this.toast('代码解析失败：' + e.message); return; }
            } else {
                if (cmCode) this.editCM.mScript = cmCode.getValue();
                if (cmStyle) this.editCM.mStyle = cmStyle.getValue();
            }

            if (!this.editCM.mName || !this.editCM.mName.trim()) {
                this.toast('请填写脚本名称'); this.tab = 'meta'; return;
            }
            this.editCM.mIncludes = (this.editCM.mIncludes || []).map(s => s.trim()).filter(Boolean);
            if (!this.editCM.mIncludes.length) {
                this.toast('请至少配置一条 Include 规则'); this.tab = 'meta'; return;
            }
            this.editCM.mExcludes = (this.editCM.mExcludes || []).map(s => s.trim()).filter(Boolean);
            this.editCM.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
            this.editCM.unSaved = false;

            let idx = this.cachedMonkeys.findIndex(c => c.id === this.editCM.id);
            if (idx >= 0) this.$set(this.cachedMonkeys, idx, JSON.parse(JSON.stringify(this.editCM)));
            else this.cachedMonkeys.push(JSON.parse(JSON.stringify(this.editCM)));
            this.persist();
            this.toast('已保存并生效');
            if (closeAfter) this.closeEditor(true);
        },

        async closeEditor(force) {
            if (!force && this.editCM.unSaved) {
                let ok = await this.confirmDialog({
                    type: 'warning',
                    title: '当前有未保存的修改',
                    message: '直接离开会丢弃这些改动，是否继续？',
                    confirmText: '丢弃修改', cancelText: '继续编辑'
                });
                if (!ok) return;
            }
            this.editing = false;
            this.editCM = newMonkey();
            cmCode = cmStyle = cmFull = null;
        },

        toggleEditMode() {
            if (this.editWithUI) {
                if (cmCode) this.editCM.mScript = cmCode.getValue();
                if (cmStyle) this.editCM.mStyle = cmStyle.getValue();
            } else {
                if (cmFull) {
                    let text = cmFull.getValue();
                    try {
                        let parsed = window.TampermonkeyParser.parse(text);
                        if (parsed) {
                            window.TampermonkeyParser.parseFhExtras(text, parsed);
                            parsed.id = this.editCM.id;
                            parsed.mHits = this.editCM.mHits || 0;
                            Object.assign(this.editCM, parsed);
                        }
                    } catch (e) { this.toast('代码解析失败：' + e.message); return; }
                }
            }
            this.editWithUI = !this.editWithUI;
            cmCode = cmStyle = cmFull = null;
            this.ensureEditor();
        },

        /* ============ Include / Exclude 多规则 ============ */
        addInclude() { (this.editCM.mIncludes = this.editCM.mIncludes || []).push(''); this.markUnsaved(); },
        updateInclude(i, v) { this.$set(this.editCM.mIncludes, i, v); this.markUnsaved(); },
        removeInclude(i) { this.editCM.mIncludes.splice(i, 1); this.markUnsaved(); },
        addExclude() { (this.editCM.mExcludes = this.editCM.mExcludes || []).push(''); this.markUnsaved(); },
        updateExclude(i, v) { this.$set(this.editCM.mExcludes, i, v); this.markUnsaved(); },
        removeExclude(i) { this.editCM.mExcludes.splice(i, 1); this.markUnsaved(); },

        testRulePattern(pattern, url) {
            if (!url) return 'empty';
            return matchOnePattern(pattern, url) ? 'match' : 'miss';
        },

        setRunAt(v) { this.editCM.mRunAt = v; this.markUnsaved(); },
        toggleGrant(g) {
            this.editCM.mGrants = this.editCM.mGrants || [];
            let i = this.editCM.mGrants.indexOf(g);
            if (i >= 0) this.editCM.mGrants.splice(i, 1);
            else this.editCM.mGrants.push(g);
            this.markUnsaved();
        },

        /* ============ 启停 / 删除 / 多选 ============ */
        disableMonkey(cm) {
            cm.mDisabled = !cm.mDisabled;
            cm.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
            this.persist(true);
            this.toast(cm.mDisabled ? `已停用「${cm.mName}」` : `已启用「${cm.mName}」`);
        },
        async removeMonkey(cm) {
            let ok = await this.confirmDialog({
                type: 'danger',
                title: `确定删除「${cm.mName || '未命名'}」？`,
                message: '该操作不可撤销，删除后脚本将永久消失。',
                confirmText: '删除', cancelText: '取消'
            });
            if (!ok) return;
            this.cachedMonkeys = this.cachedMonkeys.filter(c => c.id !== cm.id);
            this.selectedIds = this.selectedIds.filter(id => id !== cm.id);
            this.persist();
        },
        toggleSelect(id) {
            let i = this.selectedIds.indexOf(id);
            if (i >= 0) this.selectedIds.splice(i, 1); else this.selectedIds.push(id);
        },
        bulkToggle(disabled) {
            this.cachedMonkeys.forEach(c => {
                if (this.selectedIds.includes(c.id)) {
                    c.mDisabled = disabled;
                    c.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                }
            });
            this.persist();
            this.selectedIds = [];
        },
        async bulkRemove() {
            let n = this.selectedIds.length;
            let ok = await this.confirmDialog({
                type: 'danger',
                title: `确定批量删除选中的 ${n} 个脚本？`,
                message: `这 ${n} 个脚本将被永久删除，且无法恢复。`,
                confirmText: `全部删除（${n}）`, cancelText: '取消'
            });
            if (!ok) return;
            this.cachedMonkeys = this.cachedMonkeys.filter(c => !this.selectedIds.includes(c.id));
            this.selectedIds = [];
            this.persist();
        },
        bulkExport() {
            let arr = this.cachedMonkeys.filter(c => this.selectedIds.includes(c.id));
            this.downloadBackup(arr, `FeHelper-Monkeys-${this.selectedIds.length}.json`);
        },

        /* ============ 拖拽排序 ============ */
        onDragStart(e, cm) {
            this.dragId = cm.id;
            try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', cm.id); } catch (err) {}
        },
        onDragOver(e, cm) {
            if (this.dragId && this.dragId !== cm.id) this.dropTargetId = cm.id;
        },
        onDragLeave(e, cm) { if (this.dropTargetId === cm.id) this.dropTargetId = null; },
        onDrop(e, cm) {
            if (!this.dragId || this.dragId === cm.id) return;
            let arr = this.cachedMonkeys.slice();
            let from = arr.findIndex(c => c.id === this.dragId);
            let to = arr.findIndex(c => c.id === cm.id);
            if (from < 0 || to < 0) return;
            let item = arr.splice(from, 1)[0];
            arr.splice(to, 0, item);
            this.cachedMonkeys = arr;
            this.persist(true);
        },
        onDragEnd() { this.dragId = null; this.dropTargetId = null; },

        /* ============ 模板市场 ============ */
        openTemplateModal() { this.showTemplateModal = true; },
        installTemplate(tpl) {
            let copy = JSON.parse(JSON.stringify(tpl));
            copy.id = newMonkey().id;
            copy.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
            copy.mHits = 0;
            copy.mDisabled = false;
            migrate(copy);
            this.cachedMonkeys.push(copy);
            this.persist();
            this.showTemplateModal = false;
            this.toast(`已安装「${copy.mName}」`);
        },

        /* ============ 导入导出 ============ */
        openImportModal() { this.importUrl = ''; this.showImportModal = true; },

        exportMonkey(cm) {
            let text = window.TampermonkeyParser.stringify(migrate(JSON.parse(JSON.stringify(cm))));
            this.downloadFile(text, `FhMonkey-${(cm.mName || 'untitled').replace(/[^\w\u4e00-\u9fa5\-]+/g, '_')}.user.js`, 'application/javascript');
        },

        exportAll() {
            this.downloadBackup(this.cachedMonkeys, `FeHelper-Monkeys-Backup-${new Date().format('yyyyMMdd-HHmmss')}.json`);
        },

        downloadBackup(arr, filename) {
            let payload = {
                __format: 'fehelper-monkey-backup',
                __version: 2,
                __exportedAt: new Date().toISOString(),
                monkeys: arr
            };
            this.downloadFile(JSON.stringify(payload, null, 2), filename, 'application/json');
        },

        downloadFile(text, filename, type) {
            let blob = new Blob([text], { type: type || 'application/octet-stream' });
            let a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        },

        importFromFile() {
            this.pickFile(['.user.js', '.js', '.json'], (file, text) => {
                this.handleImportText(text, file.name);
            });
        },

        importBackup() {
            this.pickFile(['.json'], (file, text) => {
                this.handleImportText(text, file.name);
            });
        },

        importFromUrl() {
            let url = (this.importUrl || '').trim();
            if (!url) return;
            this.toast('正在下载脚本...');
            fetch(url).then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text();
            }).then(text => {
                this.handleImportText(text, url);
            }).catch(e => {
                this.toast('下载失败：' + e.message);
            });
        },

        pickFile(accept, cb) {
            let inp = document.createElement('input');
            inp.type = 'file';
            inp.accept = accept.join(',');
            inp.onchange = (ev) => {
                let f = ev.target.files[0]; if (!f) return;
                let r = new FileReader();
                r.onload = (e) => cb(f, e.target.result);
                r.readAsText(f, 'utf-8');
            };
            inp.click();
        },

        handleImportText(text, name) {
            text = String(text || '').trim();
            // 1) JSON 备份格式
            if (text.startsWith('{') && /fehelper-monkey-backup/.test(text)) {
                try {
                    let payload = JSON.parse(text);
                    let arr = (payload.monkeys || []).map(migrate);
                    this.mergeMonkeys(arr);
                    return;
                } catch (e) {}
            }
            // 2) 老的 JSON 数组导出
            if (text.startsWith('[')) {
                try {
                    let arr = JSON.parse(text.replace(/^\/\*[\s\S]*?\*\//, '')).map(migrate);
                    this.mergeMonkeys(arr);
                    return;
                } catch (e) {}
            }
            // 3) Tampermonkey .user.js
            if (/==UserScript==/.test(text)) {
                try {
                    let m = window.TampermonkeyParser.parse(text);
                    if (m) { window.TampermonkeyParser.parseFhExtras(text, m); this.mergeMonkeys([migrate(m)]); return; }
                } catch (e) {}
            }
            // 4) FeHelper 旧导出 .js（FeHelperMonkey 格式）
            if (/==FeHelperMonkey==/.test(text)) {
                try {
                    let m = this.parseLegacyFhJs(text);
                    if (m) { this.mergeMonkeys([migrate(m)]); return; }
                } catch (e) {}
            }
            this.toast('无法识别此文件格式：' + name);
        },

        parseLegacyFhJs(text) {
            let parts = text.split('// ==/FeHelperMonkey==');
            let comments = parts[0]; let scripts = (parts[1] || '').trim();
            let m = newMonkey(); m.mScript = scripts; m.mIncludes = [];
            comments.split('\n').forEach(line => {
                let g = (k) => { let mm = line.match(new RegExp('^// @' + k + '\\s+(.*)$')); return mm ? mm[1].trim() : null; };
                let v;
                if ((v = g('id'))) m.id = v;
                else if ((v = g('name'))) m.mName = v;
                else if ((v = g('url-pattern'))) m.mIncludes.push(v);
                else if ((v = g('enable'))) m.mDisabled = v === 'false';
                else if ((v = g('auto-refresh'))) m.mRefresh = parseInt(v) || 0;
                else if ((v = g('updated'))) m.mUpdatedAt = v;
                else if ((v = g('require-js'))) m.mRequireJs = (m.mRequireJs ? m.mRequireJs + ',' : '') + v;
            });
            if (!m.mIncludes.length) m.mIncludes = ['*://*/*'];
            return m;
        },

        async mergeMonkeys(arr) {
            if (!arr || !arr.length) { this.toast('未导入任何脚本'); return; }
            let dups = arr.filter(item =>
                this.cachedMonkeys.find(c => c.id === item.id || (c.mName && c.mName === item.mName))
            );
            let merge = false;
            if (dups.length) {
                merge = await this.confirmDialog({
                    type: 'warning',
                    title: `发现 ${dups.length} 个同名/同 ID 的脚本`,
                    message: '<b>覆盖</b>：使用导入的版本替换现有脚本。<br><b>保留</b>：作为新脚本一并加入，不影响现有脚本。',
                    confirmText: '覆盖现有', cancelText: '保留作为新脚本'
                });
            }
            let imported = 0, replaced = 0;
            arr.forEach(item => {
                let dup = this.cachedMonkeys.find(c => c.id === item.id || (c.mName && c.mName === item.mName));
                if (dup) {
                    if (merge) {
                        Object.assign(dup, item, { mUpdatedAt: new Date().format('yyyy-MM-dd HH:mm:ss') });
                        replaced++;
                    } else {
                        let copy = Object.assign({}, item, { id: newMonkey().id, mUpdatedAt: new Date().format('yyyy-MM-dd HH:mm:ss') });
                        this.cachedMonkeys.push(copy);
                        imported++;
                    }
                } else {
                    if (!item.id) item.id = newMonkey().id;
                    if (!item.mUpdatedAt) item.mUpdatedAt = new Date().format('yyyy-MM-dd HH:mm:ss');
                    this.cachedMonkeys.push(item);
                    imported++;
                }
            });
            this.persist();
            this.showImportModal = false;
            this.toast(`导入完成：新增 ${imported} 个，覆盖 ${replaced} 个`);
        },

        /* ============ 日志 ============ */
        openLogPanel() { this.showLogModal = true; this.loadLogs(); this.errorBadge = 0; },

        loadLogs(silentBadgeOnly) {
            chrome.storage.local.get(PAGE_MONKEY_LOG_KEY, (resps) => {
                let arr = [];
                try { arr = JSON.parse((resps && resps[PAGE_MONKEY_LOG_KEY]) || '[]'); } catch (e) {}
                if (silentBadgeOnly) {
                    let lastSeen = parseInt(localStorage.getItem('PMK_LOG_LAST_SEEN') || '0');
                    let unread = arr.filter(l => (l.time || 0) > lastSeen && l.level === 'error').length;
                    this.errorBadge = unread;
                } else {
                    this.logs = arr;
                    localStorage.setItem('PMK_LOG_LAST_SEEN', String(Date.now()));
                    this.errorBadge = 0;
                }
            });
        },
        async clearLogs() {
            let ok = await this.confirmDialog({
                type: 'warning',
                title: '清空所有运行日志？',
                message: '将清空最近 300 条日志记录。',
                confirmText: '清空', cancelText: '取消'
            });
            if (!ok) return;
            let d = {}; d[PAGE_MONKEY_LOG_KEY] = '[]';
            chrome.storage.local.set(d, () => { this.logs = []; this.errorBadge = 0; });
        },
        formatTime(t) {
            if (!t) return '';
            let d = new Date(t);
            return d.format('HH:mm:ss');
        },

        /* ============ 文案 ============ */
        runAtLabel(v) {
            return ({
                'document-start': '尽早执行',
                'document-end': 'DOM完成',
                'document-idle': '加载完成'
            })[v] || 'DOM完成';
        },

        toast(msg) {
            this.toastMsg = msg;
            clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => { this.toastMsg = ''; }, 2000);
        },

        /* ============ 自定义 Confirm / Alert 对话框 ============ */
        confirmDialog(opts) {
            return new Promise((resolve) => {
                if (typeof opts === 'string') opts = { title: opts };
                this.dialog = {
                    visible: true,
                    title: opts.title || '提示',
                    message: opts.message || '',
                    type: opts.type || 'info',
                    alertOnly: !!opts.alertOnly,
                    confirmText: opts.confirmText || '确定',
                    cancelText: opts.cancelText || '取消',
                    _resolve: resolve
                };
            });
        },
        alertDialog(opts) {
            if (typeof opts === 'string') opts = { title: opts };
            return this.confirmDialog(Object.assign({ alertOnly: true }, opts));
        },
        onDialogConfirm() {
            let r = this.dialog._resolve;
            this.dialog.visible = false;
            this.dialog._resolve = null;
            r && r(true);
        },
        onDialogCancel() {
            let r = this.dialog._resolve;
            this.dialog.visible = false;
            this.dialog._resolve = null;
            r && r(false);
        },

        /* ============ FeHelper 集成 ============ */
        openDonateModal(e) {
            e && e.preventDefault();
            try {
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'open-donate-modal',
                    params: { toolName: 'page-monkey' }
                });
            } catch (err) {}
        },
        openOptionsPage(e) {
            e && e.preventDefault();
            try { chrome.runtime.openOptionsPage(); } catch (err) {}
        }
    }
});
