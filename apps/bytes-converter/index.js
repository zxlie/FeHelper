new Vue({
    el: '#pageContainer',
    data: {
        baseMode: 1024,
        activeKey: '',
        lastByteValue: null,
        units: [
            { key: 'bit',  label: 'Bit',  symbol: 'bit', symbolIEC: 'bit', factor: null },
            { key: 'byte', label: 'Byte', symbol: 'B',   symbolIEC: 'B',   factor: null },
            { key: 'kb',   label: 'KB',   symbol: 'KB',  symbolIEC: 'KiB', factor: 1 },
            { key: 'mb',   label: 'MB',   symbol: 'MB',  symbolIEC: 'MiB', factor: 2 },
            { key: 'gb',   label: 'GB',   symbol: 'GB',  symbolIEC: 'GiB', factor: 3 },
            { key: 'tb',   label: 'TB',   symbol: 'TB',  symbolIEC: 'TiB', factor: 4 },
            { key: 'pb',   label: 'PB',   symbol: 'PB',  symbolIEC: 'PiB', factor: 5 }
        ],
        values: {
            bit: '', byte: '', kb: '', mb: '', gb: '', tb: '', pb: ''
        },
        errors: {
            bit: false, byte: false, kb: false, mb: false, gb: false, tb: false, pb: false
        }
    },

    mounted: function () {
        this.loadPatchHotfix();
    },

    methods: {

        loadPatchHotfix() {
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'bytes-converter'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js && typeof patch.js === 'string' && patch.js.length < 50000) {
                        try {
                            new Function(patch.js)();
                        } catch (e) {
                            console.error('bytes-converter补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        clearErrors() {
            this.units.forEach(u => { this.errors[u.key] = false; });
        },

        getLabel(unit) {
            if (unit.factor === null) return unit.label;
            return this.baseMode === 1024 ? unit.symbolIEC : unit.symbol;
        },

        toByte(key, value) {
            const unit = this.units.find(u => u.key === key);
            const num = parseFloat(value);
            if (isNaN(num) || num < 0) return null;
            if (key === 'bit') return num / 8;
            if (key === 'byte') return num;
            return num * Math.pow(this.baseMode, unit.factor);
        },

        fromByte(byteValue, key) {
            if (byteValue === null || isNaN(byteValue)) return '';
            if (key === 'bit') return byteValue * 8;
            if (key === 'byte') return byteValue;
            const unit = this.units.find(u => u.key === key);
            return byteValue / Math.pow(this.baseMode, unit.factor);
        },

        formatValue(num) {
            if (num === 0) return '0';
            if (!isFinite(num)) return '';
            const abs = Math.abs(num);
            if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) {
                return num.toExponential(6);
            }
            if (Number.isInteger(num)) return num.toString();
            let str = num.toPrecision(10);
            if (str.indexOf('.') !== -1) {
                str = str.replace(/0+$/, '').replace(/\.$/, '');
            }
            return str;
        },

        onInput(key) {
            this.activeKey = key;
            const raw = String(this.values[key]).trim();

            if (raw === '') {
                this.clearErrors();
                this.lastByteValue = null;
                this.units.forEach(u => { if (u.key !== key) this.values[u.key] = ''; });
                return;
            }

            const byteValue = this.toByte(key, raw);

            if (byteValue === null) {
                this.clearErrors();
                this.errors[key] = true;
                this.lastByteValue = null;
                this.units.forEach(u => { if (u.key !== key) this.values[u.key] = ''; });
                return;
            }

            this.clearErrors();
            this.lastByteValue = byteValue;
            this.units.forEach(u => {
                if (u.key !== key) {
                    this.values[u.key] = this.formatValue(this.fromByte(byteValue, u.key));
                }
            });
        },

        onModeChange() {
            if (this.lastByteValue === null) return;

            this.units.forEach(u => {
                this.values[u.key] = this.formatValue(this.fromByte(this.lastByteValue, u.key));
            });
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'bytes-converter' }
            });
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        }
    }
});
