// 创建一个处理BigInt的JSON解析器
const JSONBigInt = {
    // 自定义的parse方法，处理大数字
    parse: function(text) {
        // 先尝试预处理字符串，将可能的大整数标记出来
        // 以更精确的方式匹配JSON中的大整数
        const preparedText = this._markBigInts(text);
        
        try {
            // 使用标准JSON解析，同时使用reviver函数还原BigInt
            return JSON.parse(preparedText, this._reviver);
        } catch (e) {
            // 如果处理失败，尝试原始解析方式
            console.error('BigInt处理失败，回退到标准解析', e);
            return JSON.parse(text);
        }
    },
    
    // 将JSON字符串中的大整数标记为特殊格式
    _markBigInts: function(text) {
        // 这个正则匹配JSON中的数字，但需要避免匹配到引号内的字符串
        // 匹配模式: 找到数字前面是冒号或左方括号的情况（表示这是个值而不是键名）
        // 允许数字后面有可选的空白字符
        return text.replace(
            /([:,\[]\s*)(-?\d{16,})(\s*)(?=[,\]\}])/g, 
            function(match, prefix, number, spaces, offset) {
                // 检查这个位置是否在字符串内
                let inStr = false;
                let esc = false;
                for (let i = 0; i < offset; i++) {
                    if (esc) {
                        esc = false;
                        continue;
                    }
                    if (text[i] === '\\') {
                        esc = true;
                        continue;
                    }
                    if (text[i] === '"') {
                        inStr = !inStr;
                    }
                }
                
                // 如果在字符串内，不替换
                if (inStr) {
                    return match;
                }
                
                // 将大数字转换为特殊格式的字符串
                return prefix + '"__BigInt__' + number + '"' + spaces;
            }
        );
    },
    
    // 恢复函数，将标记的BigInt字符串转回BigInt类型
    _reviver: function(key, value) {
        // 检查是否是我们标记的BigInt字符串
        if (typeof value === 'string' && value.startsWith('__BigInt__')) {
            // 提取数字部分
            const numStr = value.substring(10);
            try {
                // 使用全局的 BigNumber 构造函数（来自 json-bigint.js）
                // 如果可用，优先使用 BigNumber，否则回退到原生 BigInt
                if (typeof BigNumber !== 'undefined') {
                    return new BigNumber(numStr);
                } else {
                    return BigInt(numStr);
                }
            } catch (e) {
                // 如果转换失败，保留原始字符串
                console.warn('无法转换为BigInt:', numStr);
                return numStr;
            }
        }
        return value;
    }
};

// 转义功能开启标记
let escapeJsonStringEnabled = false;

// 处理主线程消息
self.onmessage = function(event) {
    
    // 格式化JSON
    if (event.data.jsonString) {
        // 接收转义功能标志
        if (event.data.escapeJsonString !== undefined) {
            escapeJsonStringEnabled = event.data.escapeJsonString;
        }
        
        // 发送格式化中的消息
        self.postMessage(['FORMATTING']);
        
        try {
            // 先预处理JSON字符串，防止大整数丢失精度
            let jsonObj;
            
            try {
                // 尝试使用自定义的BigInt解析器
                jsonObj = JSONBigInt.parse(event.data.jsonString);
            } catch (e) {
                // 如果解析失败，回退到标准解析
                console.error('BigInt解析失败，回退到标准解析', e);
                jsonObj = JSON.parse(event.data.jsonString);
            }
            
            // 如果是简单主题，直接返回格式化的JSON
            if (event.data.skin && event.data.skin === 'theme-simple') {
                // 处理BigInt特殊情况
                let formatted = JSON.stringify(jsonObj, function(key, value) {
                    if (typeof value === 'bigint') {
                        // 移除n后缀，只显示数字本身
                        return value.toString();
                    }
                    if (isBigNumberLike(value)) {
                        return getBigNumberDisplayString(value);
                    }
                    // 处理普通数字，避免科学计数法
                    if (typeof value === 'number' && value.toString().includes('e')) {
                        // 大数字转为字符串以避免科学计数法
                        return value.toLocaleString('fullwide', {useGrouping: false});
                    }
                    return value;
                }, 4);
                
                let html = '<div id="formattedJson"><pre class="rootItem">' + 
                    formatted.replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;') + 
                    '</pre></div>';
                
                self.postMessage(['FORMATTED', html]);
                return;
            }
            
            // 默认主题 - 创建更丰富的HTML结构
            let html = '<div id="formattedJson">' +
                formatJsonToHtml(jsonObj) +
                '</div>';
            
            self.postMessage(['FORMATTED', html]);
        } catch (e) {
            // 处理错误情况
            self.postMessage(['FORMATTED', '<div id="formattedJson"><div class="error">格式化失败: ' + e.message + '</div></div>']);
        }
    }
};

// HTML特殊字符格式化
function htmlspecialchars(str) {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#039;');
    return str;
}

// 格式化字符串值，如果是URL则转换为链接
function formatStringValue(str) {
    // URL正则表达式，匹配 http/https/ftp 协议的URL
    const urlRegex = /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i;
    
    if (urlRegex.test(str)) {
        // 如果是URL，转换为链接
        const escapedUrl = htmlspecialchars(str);
        return '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer" data-is-link="1" data-link-url="' + escapedUrl + '">' + htmlspecialchars(str) + '</a>';
    } else {
        // 直接显示解析后的字符串内容，不需要重新转义
        // 这样可以保持用户原始输入的意图
        return htmlspecialchars(str);
    }
}

// 格式化JSON为HTML
function formatJsonToHtml(json) {
    return createNode(json).getHTML();
}

// 创建节点
function createNode(value) {
    let node = {
        type: getType(value),
        value: value,
        children: [],
        
        getHTML: function() {
            switch(this.type) {
                case 'string':
                    // 判断原始字符串是否为URL
                    if (isUrl(this.value)) {
                        // 用JSON.stringify保证转义符显示，内容包裹在<a>里
                        return '<div class="item item-line"><span class="string"><a href="'
                            + htmlspecialchars(this.value) + '" target="_blank" rel="noopener noreferrer" data-is-link="1" data-link-url="' + htmlspecialchars(this.value) + '">' 
                            + htmlspecialchars(JSON.stringify(this.value)) + '</a></span></div>';
                    } else {
                        // 检测字符串是否是有效的JSON（用于转义功能）
                        // 当转义功能开启时，如果字符串是有效的JSON，就格式化显示
                        if (escapeJsonStringEnabled) {
                            const strValue = String(this.value);
                            // 检查字符串是否看起来像JSON（以[或{开头，以]或}结尾）
                            const trimmed = strValue.trim();
                            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
                                (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                                try {
                                    // 尝试解析为JSON，使用全局的 JSON.parse（已被 json-bigint.js 覆盖）
                                    const parsed = JSON.parse(strValue);
                                    // 如果解析成功且是对象或数组，格式化显示
                                    if (typeof parsed === 'object' && parsed !== null) {
                                        const nestedNode = createNode(parsed);
                                        // 获取嵌套JSON的完整HTML（完全展开）
                                        let nestedHTML = nestedNode.getHTML();
                                        // 移除外层的item容器div，只保留内部内容
                                        nestedHTML = nestedHTML.replace(/^<div class="item[^"]*">/, '').replace(/<\/div>$/, '');
                                        // 返回格式化的JSON结构，但保持在外层的字符串容器中
                                        // 使用block显示，确保完全展开
                                        return '<div class="item item-line"><span class="string">' + 
                                            '<span class="quote">"</span>' +
                                            '<div class="string-json-nested" style="display:block;margin-left:0;padding-left:0;">' +
                                            nestedHTML +
                                            '</div>' +
                                            '<span class="quote">"</span>' +
                                            '</span></div>';
                                    }
                                } catch (e) {
                                    // 解析失败，按普通字符串处理
                                }
                            }
                        }
                        return '<div class="item item-line"><span class="string">' + formatStringValue(JSON.stringify(this.value)) + '</span></div>';
                    }
                case 'number':
                    // 确保大数字不使用科学计数法
                    let numStr = typeof this.value === 'number' && this.value.toString().includes('e') 
                        ? this.value.toLocaleString('fullwide', {useGrouping: false})
                        : this.value;
                    return '<div class="item item-line"><span class="number">' + 
                        numStr + 
                        '</span></div>';
                    case 'bigint':
                        // 对BigInt类型特殊处理，只显示数字，不添加n后缀
                        return '<div class="item item-line"><span class="number">' + 
                            getBigNumberDisplayString(this.value) + 
                            '</span></div>';
                case 'boolean':
                    return '<div class="item item-line"><span class="bool">' + 
                        this.value + 
                        '</span></div>';
                case 'null':
                    return '<div class="item item-line"><span class="null">null</span></div>';
                case 'object':
                    return this.getObjectHTML();
                case 'array':
                    return this.getArrayHTML();
                default:
                    return '';
            }
        },
        
        getObjectHTML: function() {
            if (!this.value || Object.keys(this.value).length === 0) {
                return '<div class="item item-object"><span class="brace">{</span><span class="brace">}</span></div>';
            }
            
            let html = '<div class="item item-object">' +
                '<span class="expand"></span>' +
                '<span class="brace">{</span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list">';
                
            let keys = Object.keys(this.value);
            keys.forEach((key, index) => {
                let prop = this.value[key];
                let childNode = createNode(prop);
                // 判断子节点是否为对象或数组，决定是否加item-block
                let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                html += '<div class="' + itemClass + '">';
                // 如果值是对象或数组，在key前面添加展开按钮
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                }
                html += '<span class="quote">"</span>' +
                    '<span class="key">' + htmlspecialchars(key) + '</span>' +
                    '<span class="quote">"</span>' +
                    '<span class="colon">: </span>';
                // 添加值
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                // 如果不是最后一个属性，添加逗号
                if (index < keys.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                html += '</div>';
            });
            
            html += '</div><span class="brace">}</span></div>';
            return html;
        },
        
        getArrayHTML: function() {
            if (!this.value || this.value.length === 0) {
                return '<div class="item item-array"><span class="brace">[</span><span class="brace">]</span></div>';
            }
            
            let html = '<div class="item item-array">' +
                '<span class="expand"></span>' +
                '<span class="brace">[</span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list item-array-container">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                
                // 如果数组元素是对象或数组，在前面添加展开按钮
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                
                // 如果不是最后一个元素，添加逗号
                if (index < this.value.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                
                html += '</div>';
            });
            
            html += '</div><span class="brace">]</span></div>';
            return html;
        },
        
        // 新增内联HTML方法，用于在同一行显示开始大括号/方括号
        getInlineHTML: function() {
            switch(this.type) {
                case 'object':
                    return this.getInlineObjectHTML();
                case 'array':
                    return this.getInlineArrayHTML();
                default:
                    return this.getHTML();
            }
        },
        
        // 新增不包含展开按钮的内联HTML方法
        getInlineHTMLWithoutExpand: function() {
            switch(this.type) {
                case 'object':
                    return this.getInlineObjectHTMLWithoutExpand();
                case 'array':
                    return this.getInlineArrayHTMLWithoutExpand();
                default:
                    return this.getHTML();
            }
        },
        
        getInlineObjectHTML: function() {
            if (!this.value || Object.keys(this.value).length === 0) {
                return '<span class="brace">{</span><span class="brace">}</span>';
            }
            let html = '<span class="brace">{</span>' +
                '<span class="expand"></span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list">';
            let keys = Object.keys(this.value);
            keys.forEach((key, index) => {
                let prop = this.value[key];
                let childNode = createNode(prop);
                // 判断子节点是否为对象或数组，决定是否加item-block
                let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                html += '<div class="' + itemClass + '">';
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                }
                html += '<span class="quote">"</span>' +
                    '<span class="key">' + htmlspecialchars(key) + '</span>' +
                    '<span class="quote">"</span>' +
                    '<span class="colon">: </span>';
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                if (index < keys.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                html += '</div>';
            });
            html += '</div><span class="brace">}</span>';
            return html;
        },
        
        getInlineArrayHTML: function() {
            if (!this.value || this.value.length === 0) {
                return '<span class="brace">[</span><span class="brace">]</span>';
            }
            
            let html = '<span class="brace">[</span>' +
                '<span class="expand"></span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list item-array-container">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                
                // 如果数组元素是对象或数组，在前面添加展开按钮
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                
                // 如果不是最后一个元素，添加逗号
                if (index < this.value.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                
                html += '</div>';
            });
            
            html += '</div><span class="brace">]</span>';
            return html;
        },
        
        getInlineObjectHTMLWithoutExpand: function() {
            if (!this.value || Object.keys(this.value).length === 0) {
                return '<span class="brace">{</span><span class="brace">}</span>';
            }
            let html = '<span class="brace">{</span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list">';
            let keys = Object.keys(this.value);
            keys.forEach((key, index) => {
                let prop = this.value[key];
                let childNode = createNode(prop);
                // 判断子节点是否为对象或数组，决定是否加item-block
                let itemClass = (childNode.type === 'object' || childNode.type === 'array') ? 'item item-block' : 'item';
                html += '<div class="' + itemClass + '">';
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                }
                html += '<span class="quote">"</span>' +
                    '<span class="key">' + htmlspecialchars(key) + '</span>' +
                    '<span class="quote">"</span>' +
                    '<span class="colon">: </span>';
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                if (index < keys.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                html += '</div>';
            });
            html += '</div><span class="brace">}</span>';
            return html;
        },
        
        getInlineArrayHTMLWithoutExpand: function() {
            if (!this.value || this.value.length === 0) {
                return '<span class="brace">[</span><span class="brace">]</span>';
            }
            
            let html = '<span class="brace">[</span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list item-array-container">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block item-array-element" data-array-index="' + index + '">';
                
                // 确保所有类型的数组元素都能正确处理
                if (childNode.type === 'object' || childNode.type === 'array') {
                    html += '<span class="expand"></span>';
                    html += childNode.getInlineHTMLWithoutExpand();
                } else {
                    html += childNode.getHTML().replace(/^<div class="item item-line">/, '').replace(/<\/div>$/, '');
                }
                
                // 如果不是最后一个元素，添加逗号
                if (index < this.value.length - 1) {
                    html += '<span class="comma">,</span>';
                }
                
                html += '</div>';
            });
            
            html += '</div><span class="brace">]</span>';
            return html;
        }
    };
    
    return node;
}

// 获取值类型
function getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    let type = typeof value;
    // 特别处理BigInt类型
    if (type === 'bigint') return 'bigint';
    if (type === 'object') {
        if (isBigNumberLike(value)) {
            return 'bigint'; // 将 BigNumber 对象也当作 bigint 处理
        }
        if (Array.isArray(value)) return 'array';
    }
    return type;
}

function isUrl(str) {
    const urlRegex = /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i;
    return urlRegex.test(str);
} 

function isBigNumberLike(value) {
    return value && typeof value === 'object' &&
        typeof value.s === 'number' &&
        typeof value.e === 'number' &&
        Array.isArray(value.c);
}

function getBigNumberDisplayString(value) {
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (!isBigNumberLike(value)) {
        return String(value);
    }
    const direct = tryConvertBigNumberToString(value);
    if (direct) {
        return direct;
    }
    return rebuildBigNumberFromParts(value);
}

function tryConvertBigNumberToString(value) {
    const nativeToString = value && value.toString;
    if (typeof nativeToString === 'function' && nativeToString !== Object.prototype.toString) {
        try {
            const result = nativeToString.call(value);
            if (typeof result === 'string' && result !== '[object Object]') {
                return result;
            }
        } catch (e) {}
    }
    const ctor = getAvailableBigNumberCtor();
    if (ctor && typeof Object.setPrototypeOf === 'function') {
        try {
            if (!(value instanceof ctor)) {
                Object.setPrototypeOf(value, ctor.prototype);
            }
            if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
                const result = value.toString();
                if (typeof result === 'string' && result !== '[object Object]') {
                    return result;
                }
            }
        } catch (e) {}
    }
    return null;
}

function rebuildBigNumberFromParts(value) {
    const sign = value.s < 0 ? '-' : '';
    const CHUNK_SIZE = 14;
    let digits = '';

    for (let i = 0; i < value.c.length; i++) {
        let chunkStr = Math.abs(value.c[i]).toString();
        if (i > 0) {
            chunkStr = chunkStr.padStart(CHUNK_SIZE, '0');
        }
        digits += chunkStr;
    }

    digits = digits.replace(/^0+/, '') || '0';
    const decimalIndex = value.e + 1;

    if (decimalIndex <= 0) {
        const zeros = '0'.repeat(Math.abs(decimalIndex));
        let fraction = zeros + digits;
        fraction = fraction.replace(/0+$/, '');
        if (!fraction) {
            return sign + '0';
        }
        return sign + '0.' + fraction;
    }
    if (decimalIndex >= digits.length) {
        return sign + digits + '0'.repeat(decimalIndex - digits.length);
    }

    const intPart = digits.slice(0, decimalIndex);
    let fracPart = digits.slice(decimalIndex).replace(/0+$/, '');
    if (!fracPart) {
        return sign + intPart;
    }
    return sign + intPart + '.' + fracPart;
}

function getAvailableBigNumberCtor() {
    if (typeof JSON !== 'undefined' && typeof JSON.BigNumber === 'function') {
        return JSON.BigNumber;
    }
    if (typeof BigNumber === 'function') {
        return BigNumber;
    }
    return null;
}
