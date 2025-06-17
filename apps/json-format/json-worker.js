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
        return text.replace(
            /([:,\[]\s*)(-?\d{16,})([,\]\}])/g, 
            function(match, prefix, number, suffix) {
                // 将大数字转换为特殊格式的字符串
                return prefix + '"__BigInt__' + number + '"' + suffix;
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
                // 尝试转换为BigInt
                return BigInt(numStr);
            } catch (e) {
                // 如果转换失败，保留原始字符串
                console.warn('无法转换为BigInt:', numStr);
                return numStr;
            }
        }
        return value;
    }
};

// 处理主线程消息
self.onmessage = function(event) {
    
    // 格式化JSON
    if (event.data.jsonString) {
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
        return '<a href="' + escapedUrl + '" target="_blank" rel="noopener noreferrer">' + htmlspecialchars(str) + '</a>';
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
                            + htmlspecialchars(this.value) + '" target="_blank" rel="noopener noreferrer">' 
                            + htmlspecialchars(JSON.stringify(this.value)) + '</a></span></div>';
                    } else {
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
                        this.value.toString() + 
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
                
                html += '<div class="item">';
                
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
                    // 对于对象和数组，将开始大括号/方括号放在同一行，但不包含展开按钮
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
                '<div class="kv-list">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block">';
                
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
                
                html += '<div class="item">';
                
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
                '<div class="kv-list">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block">';
                
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
                
                html += '<div class="item">';
                
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
            
            html += '</div><span class="brace">}</span>';
            return html;
        },
        
        getInlineArrayHTMLWithoutExpand: function() {
            if (!this.value || this.value.length === 0) {
                return '<span class="brace">[</span><span class="brace">]</span>';
            }
            
            let html = '<span class="brace">[</span>' +
                '<span class="ellipsis"></span>' +
                '<div class="kv-list">';
                
            this.value.forEach((item, index) => {
                let childNode = createNode(item);
                
                html += '<div class="item item-block">';
                
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
        if (Array.isArray(value)) return 'array';
    }
    return type;
}

function isUrl(str) {
    const urlRegex = /^(https?:\/\/|ftp:\/\/)[^\s<>"'\\]+$/i;
    return urlRegex.test(str);
} 

