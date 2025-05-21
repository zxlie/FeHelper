/**
 * FeHelper 颜色转换工具
 */
new Vue({
    el: '#pageContainer',
    data: {
        fromHEX: '#43ad7f7f',
        fromRGB: '', // Will be calculated
        fromHSL: '', // Will be calculated
        fromHSV: '', // Will be calculated

        toHEX: '',
        toRGB: '',
        toHSL: '',
        toHSV: '',

        // Outputs specifically for HSL/HSV rows to avoid confusion
        // These are no longer needed with the module layout
        /*
        toRGB_fromHSL: '',
        toHEX_fromHSL: '',
        toRGB_fromHSV: '',
        toHEX_fromHSV: '',
        */

        // Internal representation (RGBA object)
        color: { r: 0, g: 0, b: 0, a: 1 },
        alphaPercent: 100 // For slider binding (0-100)
    },

    mounted: function () {
        this.updateFromHEX(); // Initial calculation
    },

    beforeDestroy: function() {
        // Remove picker cleanup logic
    },

    methods: {
        // Remove initColorPicker method
        /*
        initColorPicker: function() { ... },
        */

        // --- Input Update Handlers ---
        updateFromHEX: function() {
            // Remove picker update logic
            /*
            if (!this.isUpdatingFromPicker && this.pickerInstance) {
                this.pickerInstance.setColor(this.fromHEX, true);
            }
            */
            const result = this.parseHEX(this.fromHEX);
            if (result) {
                this.color = result;
                this.updateAllOutputs(); // Removed parameter
            } else {
                this.clearOutputs();
            }
        },

        updateFromRGB: function() {
             // Remove picker update logic
            /*
             if (this.pickerInstance) {
                const parsed = this.parseRGB(this.fromRGB);
                if(parsed) {
                    const hexObj = this.rgbToHex(parsed.r, parsed.g, parsed.b, parsed.a);
                     this.pickerInstance.setColor(this.hexToString(hexObj), true);
                }
            }
            */
            const result = this.parseRGB(this.fromRGB);
            if (result) {
                this.color = result;
                this.updateAllOutputs();
            } else {
                this.clearOutputs();
            }
        },

        updateFromHSL: function() {
            // Remove picker update logic
            /*
            if (this.pickerInstance) {
                const parsed = this.parseHSL(this.fromHSL);
                 if(parsed) {
                    const rgb = this.hslToRgb(parsed.h, parsed.s, parsed.l, parsed.a);
                    const hexObj = this.rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
                     this.pickerInstance.setColor(this.hexToString(hexObj), true);
                 }
            }
            */
            const result = this.parseHSL(this.fromHSL);
            if (result) {
                this.color = this.hslToRgb(result.h, result.s, result.l, result.a);
                this.updateAllOutputs();
            } else {
                this.clearOutputs();
            }
        },

        updateFromHSV: function() {
            // Remove picker update logic
            /*
            if (this.pickerInstance) {
                 const parsed = this.parseHSV(this.fromHSV);
                 if(parsed) {
                     const rgb = this.hsvToRgb(parsed.h, parsed.s, parsed.v, parsed.a);
                     const hexObj = this.rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a);
                      this.pickerInstance.setColor(this.hexToString(hexObj), true);
                 }
            }
            */
            const result = this.parseHSV(this.fromHSV);
            if (result) {
                this.color = this.hsvToRgb(result.h, result.s, result.v, result.a);
                this.updateAllOutputs();
            } else {
                this.clearOutputs();
            }
        },

        updateAlphaFromSlider: function() {
            if (this.color) {
                this.color.a = this.alphaPercent / 100;
                 // Remove picker update logic
                 /*
                if (this.pickerInstance) {
                     const hexObj = this.rgbToHex(this.color.r, this.color.g, this.color.b, this.color.a);
                     this.pickerInstance.setColor(this.hexToString(hexObj), true);
                }
                */
                this.updateAllOutputs();
            }
        },

        // --- Update All Outputs ---
        updateAllOutputs: function() {
            if (!this.color) return;
            const { r, g, b, a } = this.color;

            this.alphaPercent = Math.round(a * 100);

            const hexObj = this.rgbToHex(r, g, b, a);
            const rgbString = this.rgbaToString(r, g, b, a);
            const hslObj = this.rgbToHsl(r, g, b, a);
            const hsvObj = this.rgbToHsv(r, g, b, a);

            const newHEX = this.hexToString(hexObj);
            const newRGB = rgbString;
            const newHSL = this.hslToString(hslObj);
            const newHSV = this.hsvToString(hsvObj);

            // Update output models (directly use these in template)
            this.toHEX = newHEX;
            this.toRGB = newRGB;
            this.toHSL = newHSL;
            this.toHSV = newHSV;

             // Update inputs (only if they differ to avoid cursor jumps)
             if (this.fromHEX !== newHEX) this.fromHEX = newHEX;
             if (this.fromRGB !== newRGB) this.fromRGB = newRGB;
             if (this.fromHSL !== newHSL) this.fromHSL = newHSL;
             if (this.fromHSV !== newHSV) this.fromHSV = newHSV;

            // Update the color picker IF the change didn't originate from it
            // Remove picker update logic
            /*
            if (!this.isUpdatingFromPicker && this.pickerInstance) {
                 // Use HEX8 format which a-color-picker likely prefers
                this.pickerInstance.setColor(newHEX, true);
            }
            */
        },

        clearOutputs: function() {
            this.toHEX = '';
            this.toRGB = '';
            this.toHSL = '';
            this.toHSV = '';
             // Remove clears for specific row outputs
            /*
            this.toRGB_fromHSL = '';
            this.toHEX_fromHSL = '';
            this.toRGB_fromHSV = '';
            this.toHEX_fromHSV = '';
            */
            this.alphaPercent = 100;
        },

        // --- Parsers ---
        parseHEX: function(hex) {
            hex = hex.trim().replace(/^#/, '');
            if (!/^[0-9a-fA-F]+$/.test(hex) || ![3, 4, 6, 8].includes(hex.length)) {
                return null;
            }

            let r, g, b, a = 1;
            if (hex.length === 3 || hex.length === 4) {
                r = parseInt(hex[0] + hex[0], 16);
                g = parseInt(hex[1] + hex[1], 16);
                b = parseInt(hex[2] + hex[2], 16);
                if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
            } else { // 6 or 8
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
                if (hex.length === 8) a = parseInt(hex.substring(6, 8), 16) / 255;
            }

            if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
            return { r, g, b, a };
        },

        parseRGB: function(rgbStr) {
            rgbStr = rgbStr.trim().toLowerCase();
            const match = rgbStr.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9\.]+))?\s*\)$/);
            if (!match) return null;

            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            let a = 1;
            if (match[4] !== undefined) {
                a = parseFloat(match[4]);
            }

            if (r > 255 || g > 255 || b > 255 || a < 0 || a > 1 || isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
                return null;
            }
            return { r, g, b, a };
        },

        parseHSL: function(hslStr) {
            hslStr = hslStr.trim().toLowerCase();
            const match = hslStr.match(/^hsla?\(\s*([0-9\.]+)\s*,\s*([0-9\.]+)%?\s*,\s*([0-9\.]+)%?\s*(?:,\s*([0-9\.]+))?\s*\)$/);
            if (!match) return null;

            const h = parseFloat(match[1]);
            const s = parseFloat(match[2]);
            const l = parseFloat(match[3]);
            let a = 1;
            if (match[4] !== undefined) {
                a = parseFloat(match[4]);
            }

             if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100 || a < 0 || a > 1 || isNaN(h) || isNaN(s) || isNaN(l) || isNaN(a)) {
                return null;
            }
            return { h, s, l, a };
        },

         parseHSV: function(hsvStr) {
            hsvStr = hsvStr.trim().toLowerCase();
             // Assuming HSV format like hsv(H, S%, V%) or hsva(H, S%, V%, A)
            const match = hsvStr.match(/^hsva?\(\s*([0-9\.]+)\s*,\s*([0-9\.]+)%?\s*,\s*([0-9\.]+)%?\s*(?:,\s*([0-9\.]+))?\s*\)$/);
            if (!match) return null;

            const h = parseFloat(match[1]);
            const s = parseFloat(match[2]);
            const v = parseFloat(match[3]);
            let a = 1;
            if (match[4] !== undefined) {
                a = parseFloat(match[4]);
            }

             if (h < 0 || h > 360 || s < 0 || s > 100 || v < 0 || v > 100 || a < 0 || a > 1 || isNaN(h) || isNaN(s) || isNaN(v) || isNaN(a)) {
                return null;
            }
            return { h, s, v, a };
        },

        // --- Conversion Functions (RGB as Base) ---
        // RGB -> HEX
        rgbToHex: function(r, g, b, a) {
            const toHex = (c) => parseInt(c, 10).toString(16).padStart(2, '0');
            const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            if (a < 1) {
                const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
                return { hex: hex + alphaHex, hasAlpha: true };
            }
            return { hex: hex, hasAlpha: false };
        },

        // RGB -> HSL
        rgbToHsl: function(r, g, b, a) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h * 360, s: s * 100, l: l * 100, a: a };
        },

        // RGB -> HSV
        rgbToHsv: function(r, g, b, a) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, v = max;

            const d = max - min;
            s = max === 0 ? 0 : d / max;

            if (max === min) {
                h = 0; // achromatic
            } else {
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return { h: h * 360, s: s * 100, v: v * 100, a: a };
        },

        // HSL -> RGB
        hslToRgb: function(h, s, l, a) {
            h /= 360; s /= 100; l /= 100;
            let r, g, b;

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: a };
        },

        // HSV -> RGB
        hsvToRgb: function(h, s, v, a) {
             h /= 360; s /= 100; v /= 100;
            let r, g, b;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);

            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
            }
            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: a };
        },

        // --- Formatters ---
        rgbaToString: function(r, g, b, a) {
            if (a < 1) {
                return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2).replace(/\.0+$/,'')})`;
            } else {
                return `rgb(${r}, ${g}, ${b})`;
            }
        },

        hexToString: function(hexObj) {
            return hexObj.hex;
        },

        hslToString: function(hslObj) {
            const h = hslObj.h.toFixed(0);
            const s = hslObj.s.toFixed(1).replace(/\.0$/,'');
            const l = hslObj.l.toFixed(1).replace(/\.0$/,'');
            if (hslObj.a < 1) {
                return `hsla(${h}, ${s}%, ${l}%, ${hslObj.a.toFixed(2).replace(/\.0+$/,'')})`;
            } else {
                return `hsl(${h}, ${s}%, ${l}%)`;
            }
        },

        hsvToString: function(hsvObj) {
            const h = hsvObj.h.toFixed(0);
            const s = hsvObj.s.toFixed(1).replace(/\.0$/,'');
            const v = hsvObj.v.toFixed(1).replace(/\.0$/,'');
            if (hsvObj.a < 1) {
                return `hsva(${h}, ${s}%, ${v}%, ${hsvObj.a.toFixed(2).replace(/\.0+$/,'')})`;
            } else {
                return `hsv(${h}, ${s}%, ${v}%)`;
            }
        },

        // --- Utilities ---
        copyToClipboard: function(text) {
            if (text && navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                   // Optional: Show feedback to user
                   // console.log('Copied:', text);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        },

        safeBgColor: function() {
            // Ignore the input colorStr, always use the internal RGBA color object
            if (this.color && typeof this.color.r === 'number') {
                // Generate an RGBA string which is universally supported by browsers
                const { r, g, b, a } = this.color;
                return `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
                 // Return transparent or a default if the internal color is invalid
                return 'transparent';
            }
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'trans-color' }
            });
        },  

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        }
        
        
    }
});