/**
 * FeHelper - 专业时间戳工具
 * 使用原生JavaScript实现，无需Vue依赖，兼容Chrome扩展CSP策略
 */

// 全局状态管理
var AppState = {
    // 当前活跃的标签页
    activeTab: 'smart-parser',
    
    // 当前时间显示
    currentTime: {
        local: '',
        timestamp: 0,
        timestampMs: 0
    },
    isTimeRunning: true,
    
    // 智能时间解析器
    smartParser: {
        input: '',
        results: [],
        error: '',
        detectedFormat: ''
    },
    
    // 代码生成器
    codeGenerator: {
        input: '',
        codes: [],
        selectedLang: 'all'
    },
    
    // 时间计算器
    calculator: {
        startTime: '',
        endTime: '',
        difference: null
    },
    
    // 批量转换器
    batchConverter: {
        input: '',
        results: []
    },
    
    // 时区转换
    timezoneExpert: {
        inputTime: '',
        fromTimezone: 'Asia/Shanghai',
        toTimezone: 'America/New_York',
        result: null
    },
    
    // 数据库工具
    dbTools: {
        inputTime: '',
        dbType: 'mysql',
        formats: []
    }
};

// 工具类 - 简易时间处理
var TimeUtils = {
    // 解析时间输入
    parseTimeInput: function(input) {
        if (!input || !input.trim()) {
            throw new Error('请输入时间值');
        }
        
        input = input.trim();
        
        // Unix时间戳(秒) - 10位数字
        if (/^\d{10}$/.test(input)) {
            return {
                timestamp: parseInt(input) * 1000,
                format: 'Unix时间戳(秒)'
            };
        }
        
        // Unix时间戳(毫秒) - 13位数字  
        if (/^\d{13}$/.test(input)) {
            return {
                timestamp: parseInt(input),
                format: 'Unix时间戳(毫秒)'
            };
        }
        
        // 特殊关键字
        var now = new Date();
        if (input.toLowerCase() === 'now') {
            return {
                timestamp: now.getTime(),
                format: '当前时间(now)'
            };
        }
        
        if (input.toLowerCase() === 'today') {
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return {
                timestamp: today.getTime(),
                format: '今天开始时间(today)'
            };
        }
        
        if (input.toLowerCase() === 'yesterday') {
            var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            return {
                timestamp: yesterday.getTime(),
                format: '昨天开始时间(yesterday)'
            };
        }
        
        // 尝试解析为日期字符串
        var date = new Date(input);
        if (!isNaN(date.getTime())) {
            return {
                timestamp: date.getTime(),
                format: '日期字符串'
            };
        }
        
        throw new Error('无法识别的时间格式');
    },
    
    // 格式化时间戳为各种格式
    formatTimestamp: function(timestamp) {
        var date = new Date(timestamp);
        
        return [
            { label: '标准格式', value: this.formatDate(date, 'YYYY-MM-DD HH:mm:ss') },
            { label: 'Unix时间戳(秒)', value: Math.floor(timestamp / 1000).toString() },
            { label: 'Unix时间戳(毫秒)', value: timestamp.toString() },
            { label: 'UTC时间', value: this.formatDate(new Date(date.getTime() + date.getTimezoneOffset() * 60000), 'YYYY-MM-DD HH:mm:ss') + ' UTC' },
            { label: '本地格式', value: date.toLocaleString('zh-CN') },
            { label: '相对时间', value: this.getRelativeTime(date) },
            { label: 'ISO 8601', value: date.toISOString() }
        ];
    },
    
    // 格式化日期
    formatDate: function(date, format) {
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        var hour = date.getHours().toString().padStart(2, '0');
        var minute = date.getMinutes().toString().padStart(2, '0');
        var second = date.getSeconds().toString().padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    },
    
    // 获取相对时间
    getRelativeTime: function(date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var seconds = Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);
        
        if (days > 0) {
            return days + '天前';
        } else if (hours > 0) {
            return hours + '小时前';
        } else if (minutes > 0) {
            return minutes + '分钟前';
        } else if (seconds > 0) {
            return seconds + '秒前';
        } else {
            return '刚刚';
        }
    },
    
    // 生成各种语言代码
    generateCode: function(input, lang) {
        var parsed = this.parseTimeInput(input);
        var timestamp = Math.floor(parsed.timestamp / 1000); // 转为秒
        
        var codes = {
            javascript: 'var date = new Date(' + parsed.timestamp + ');\nconsole.log(date.toISOString());\n// 输出: ' + new Date(parsed.timestamp).toISOString(),
            
            python: 'import datetime\nfrom datetime import timezone\n\ntimestamp = ' + timestamp + '\ndate = datetime.datetime.fromtimestamp(timestamp, timezone.utc)\nprint(date.isoformat())\n# 输出: ' + new Date(parsed.timestamp).toISOString(),
            
            java: 'import java.time.Instant;\nimport java.time.ZoneId;\nimport java.time.format.DateTimeFormatter;\n\nInstant instant = Instant.ofEpochSecond(' + timestamp + ');\nString formatted = instant.atZone(ZoneId.systemDefault())\n    .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);\nSystem.out.println(formatted);',
            
            go: 'package main\n\nimport (\n    "fmt"\n    "time"\n)\n\nfunc main() {\n    timestamp := int64(' + timestamp + ')\n    t := time.Unix(timestamp, 0)\n    fmt.Println(t.Format(time.RFC3339))\n    // 输出: ' + new Date(parsed.timestamp).toISOString() + '\n}',
            
            php: '<?php\n$timestamp = ' + timestamp + ';\n$date = new DateTime("@$timestamp");\necho $date->format("c");\n// 输出: ' + new Date(parsed.timestamp).toISOString() + '\n?>',
            
            sql: '-- MySQL\nSELECT FROM_UNIXTIME(' + timestamp + ') AS formatted_date;\n\n-- PostgreSQL\nSELECT to_timestamp(' + timestamp + ') AS formatted_date;\n\n-- SQLite\nSELECT datetime(' + timestamp + ', "unixepoch") AS formatted_date;'
        };
        
        return codes[lang] || '不支持的语言';
    }
};

// DOM操作工具
var DOMUtils = {
    // 查找元素
    $: function(selector) {
        return document.querySelector(selector);
    },
    
    // 查找所有元素
    $$: function(selector) {
        return document.querySelectorAll(selector);
    },
    
    // 设置元素内容
    setText: function(element, text) {
        if (element) {
            element.textContent = text;
        }
    },
    
    // 设置元素值
    setValue: function(element, value) {
        if (element) {
            element.value = value;
        }
    },
    
    // 设置元素HTML
    setHTML: function(element, html) {
        if (element) {
            element.innerHTML = html;
        }
    },
    
    // 添加类
    addClass: function(element, className) {
        if (element) {
            element.classList.add(className);
        }
    },
    
    // 移除类
    removeClass: function(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    },
    
    // 切换类
    toggleClass: function(element, className) {
        if (element) {
            element.classList.toggle(className);
        }
    },
    
    // 显示元素
    show: function(element) {
        if (element) {
            element.style.display = '';
        }
    },
    
    // 隐藏元素
    hide: function(element) {
        if (element) {
            element.style.display = 'none';
        }
    }
};

// 应用主类
var TimestampApp = {
    // 初始化
    init: function() {
        console.log('初始化时间戳工具...');
        
        // 移除Vue相关的HTML属性
        this.cleanupVueAttributes();
        
        // 初始化事件监听器
        this.initEventListeners();
        
        // 初始化界面
        this.initUI();
        
        // 启动时间更新
        this.startTimeUpdates();
        
        console.log('时间戳工具初始化完成');
    },
    
    // 清理Vue属性
    cleanupVueAttributes: function() {
        // 移除所有Vue相关的属性 - 直接遍历所有元素
        var allElements = document.querySelectorAll('*');
        allElements.forEach(function(el) {
            // 移除Vue指令属性
            var attributes = el.attributes;
            for (var i = attributes.length - 1; i >= 0; i--) {
                var attr = attributes[i];
                if (attr.name.startsWith('v-') || attr.name.startsWith(':') || attr.name.startsWith('@')) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    },
    
    // 初始化事件监听器
    initEventListeners: function() {
        var self = this;
        
        // 标签页切换
        var tabLinks = DOMUtils.$$('.nav-tabs a');
        tabLinks.forEach(function(link, index) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var tabName = ['smart-parser', 'code-generator', 'time-calculator', 'batch-converter', 'timezone-expert', 'database-tools'][index];
                self.setActiveTab(tabName);
            });
        });
        
        // 时间控制按钮
        var timeToggleBtn = DOMUtils.$('.time-toggle-btn');
        if (timeToggleBtn) {
            timeToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.toggleTime();
            });
        }
        
        // 智能解析输入
        var smartInput = DOMUtils.$('.smart-input');
        if (smartInput) {
            smartInput.addEventListener('input', function() {
                AppState.smartParser.input = this.value;
                self.parseSmartTime();
            });
        }
        
        // 代码生成输入
        var codeInput = DOMUtils.$('.time-input');
        if (codeInput) {
            codeInput.addEventListener('input', function() {
                AppState.codeGenerator.input = this.value;
                self.generateCodes();
            });
        }
        
        // 代码语言选择
        var codeLangSelect = DOMUtils.$('.language-selector select');
        if (codeLangSelect) {
            codeLangSelect.addEventListener('change', function() {
                AppState.codeGenerator.selectedLang = this.value;
                self.updateCodeDisplay();
            });
        }
        
        // 时间显示点击复制
        var timeDisplays = DOMUtils.$$('.time-display');
        timeDisplays.forEach(function(display) {
            display.addEventListener('click', function() {
                self.copyToClipboard(this.value);
            });
        });
        
        // 快捷操作按钮
        var quickButtons = DOMUtils.$$('.quick-buttons .btn');
        quickButtons.forEach(function(btn, index) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var actions = ['now', 'today', 'yesterday', 'week_start', 'month_start', 'clear'];
                self.handleQuickAction(actions[index]);
            });
        });
        
        // 智能解析器按钮
        var parseBtn = DOMUtils.$('.parse-btn');
        if (parseBtn) {
            parseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.parseSmartTime();
            });
        }
        
        var clearInputBtn = DOMUtils.$('.clear-input-btn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var smartInput = DOMUtils.$('.smart-input');
                if (smartInput) {
                    smartInput.value = '';
                    AppState.smartParser.input = '';
                    self.parseSmartTime();
                }
            });
        }
        
        // 新的快捷操作按钮
        var quickBtns = DOMUtils.$$('.quick-btn');
        quickBtns.forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var action = this.getAttribute('data-action');
                self.handleQuickAction(action);
            });
        });
        
        // 代码生成器按钮
        var generateBtn = DOMUtils.$('.generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.generateCodes();
            });
        }
        
        // 时间计算器按钮
        var calcBtn = DOMUtils.$('.calc-btn');
        if (calcBtn) {
            calcBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.calculateTimeDiff();
            });
        }
        
        var calcAddBtn = DOMUtils.$('.calc-add-btn');
        if (calcAddBtn) {
            calcAddBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.calculateTimeAddSubtract();
            });
        }
        
        // 批量转换器按钮
        var batchConvertBtn = DOMUtils.$('.batch-convert-btn');
        if (batchConvertBtn) {
            batchConvertBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.batchConvert();
            });
        }
        
        var batchExportBtn = DOMUtils.$('.batch-export-btn');
        if (batchExportBtn) {
            batchExportBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.exportBatchResults();
            });
        }
        
        var batchClearBtn = DOMUtils.$('.batch-clear-btn');
        if (batchClearBtn) {
            batchClearBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var batchInput = DOMUtils.$('.batch-input');
                if (batchInput) {
                    batchInput.value = '';
                }
            });
        }
        
        // 时区转换器按钮
        var timezoneConvertBtn = DOMUtils.$('.timezone-convert-btn');
        if (timezoneConvertBtn) {
            timezoneConvertBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.convertTimezone();
            });
        }
        
        // 数据库工具按钮
        var dbGenerateBtn = DOMUtils.$('.db-generate-btn');
        if (dbGenerateBtn) {
            dbGenerateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                self.generateDatabaseFormats();
            });
        }
    },
    
    // 初始化UI
    initUI: function() {
        // 设置初始标签页
        this.setActiveTab(AppState.activeTab);
        
        // 初始化时间显示
        this.updateTimeDisplay();
    },
    
    // 设置活跃标签页
    setActiveTab: function(tabName) {
        AppState.activeTab = tabName;
        
        // 更新标签链接样式
        var tabLinks = DOMUtils.$$('.nav-tabs li');
        var tabPanes = DOMUtils.$$('.tab-pane');
        
        tabLinks.forEach(function(link, index) {
            var tabNames = ['smart-parser', 'code-generator', 'time-calculator', 'batch-converter', 'timezone-expert', 'database-tools'];
            if (tabNames[index] === tabName) {
                DOMUtils.addClass(link, 'active');
            } else {
                DOMUtils.removeClass(link, 'active');
            }
        });
        
        // 更新标签页内容显示
        tabPanes.forEach(function(pane) {
            if (pane.id === tabName) {
                DOMUtils.addClass(pane, 'active');
                DOMUtils.show(pane);
            } else {
                DOMUtils.removeClass(pane, 'active');
                DOMUtils.hide(pane);
            }
        });
    },
    
    // 启动时间更新
    startTimeUpdates: function() {
        var self = this;
        
        function updateTime() {
            var now = new Date();
            AppState.currentTime.local = TimeUtils.formatDate(now, 'YYYY-MM-DD HH:mm:ss');
            AppState.currentTime.timestamp = Math.floor(now.getTime() / 1000);
            AppState.currentTime.timestampMs = now.getTime();
            
            self.updateTimeDisplay();
        }
        
        updateTime();
        setInterval(function() {
            if (AppState.isTimeRunning) {
                updateTime();
            }
        }, 1000);
    },
    
    // 更新时间显示
    updateTimeDisplay: function() {
        var timeInputs = DOMUtils.$$('.time-display');
        if (timeInputs.length >= 3) {
            DOMUtils.setValue(timeInputs[0], AppState.currentTime.local);
            DOMUtils.setValue(timeInputs[1], AppState.currentTime.timestamp);
            DOMUtils.setValue(timeInputs[2], AppState.currentTime.timestampMs);
        }
    },
    
    // 切换时间运行状态
    toggleTime: function() {
        AppState.isTimeRunning = !AppState.isTimeRunning;
        var toggleBtn = DOMUtils.$('.time-toggle-btn');
        if (toggleBtn) {
            DOMUtils.setText(toggleBtn, AppState.isTimeRunning ? '⏸️ 暂停' : '▶️ 开始');
            toggleBtn.className = AppState.isTimeRunning ? 'btn btn-sm btn-warning time-toggle-btn' : 'btn btn-sm btn-success time-toggle-btn';
        }
    },
    
    // 智能解析时间
    parseSmartTime: function() {
        var resultContainer = DOMUtils.$('.result-container');
        var formatHints = DOMUtils.$('.format-hints');
        
        if (!AppState.smartParser.input.trim()) {
            DOMUtils.setHTML(resultContainer, '');
            DOMUtils.setHTML(formatHints, '');
            return;
        }
        
        try {
            var parsed = TimeUtils.parseTimeInput(AppState.smartParser.input);
            var results = TimeUtils.formatTimestamp(parsed.timestamp);
            
            AppState.smartParser.results = results;
            AppState.smartParser.detectedFormat = parsed.format;
            AppState.smartParser.error = '';
            
            // 显示检测到的格式
            DOMUtils.setHTML(formatHints, '<span class="badge badge-info">检测到格式: ' + parsed.format + '</span>');
            
            // 显示解析结果 - 使用网格布局
            var html = '<div class="parse-results-grid">';
            results.forEach(function(result, index) {
                var isIsoResult = result.label === 'ISO 8601';
                var resultClass = isIsoResult ? 'result-item iso-result' : 'result-item';
                
                html += '<div class="' + resultClass + '">' +
                    '<label>' + result.label + '</label>' +
                    '<div class="result-value" onclick="TimestampApp.copyToClipboard(\'' + result.value.replace(/'/g, "\\'") + '\')" title="点击复制">' + 
                    result.value + 
                    '</div>' +
                    '</div>';
            });
            html += '</div>';
            DOMUtils.setHTML(resultContainer, html);
            
        } catch (error) {
            AppState.smartParser.error = error.message;
            AppState.smartParser.results = [];
            AppState.smartParser.detectedFormat = '';
            
            DOMUtils.setHTML(resultContainer, '<div class="alert alert-danger">❌ ' + error.message + '</div>');
            DOMUtils.setHTML(formatHints, '');
        }
    },
    
    // 生成代码
    generateCodes: function() {
        if (!AppState.codeGenerator.input.trim()) {
            AppState.codeGenerator.codes = [];
            this.updateCodeDisplay();
            return;
        }
        
        try {
            var languages = ['javascript', 'python', 'java', 'go', 'php', 'sql'];
            AppState.codeGenerator.codes = languages.map(function(lang) {
                return {
                    lang: lang.charAt(0).toUpperCase() + lang.slice(1),
                    code: TimeUtils.generateCode(AppState.codeGenerator.input, lang)
                };
            });
            
            this.updateCodeDisplay();
            
        } catch (error) {
            AppState.codeGenerator.codes = [{
                lang: 'Error',
                code: '代码生成失败: ' + error.message
            }];
            this.updateCodeDisplay();
        }
    },
    
    // 更新代码显示
    updateCodeDisplay: function() {
        var codeResults = DOMUtils.$('.code-results');
        if (!codeResults) return;
        
        // 过滤代码
        var filteredCodes = AppState.codeGenerator.codes;
        if (AppState.codeGenerator.selectedLang !== 'all') {
            filteredCodes = AppState.codeGenerator.codes.filter(function(code) {
                return code.lang.toLowerCase().includes(AppState.codeGenerator.selectedLang.toLowerCase());
            });
        }
        
        // 显示代码
        var html = '';
        filteredCodes.forEach(function(code) {
            html += '<div class="code-block">' +
                '<div class="code-header">' +
                '<span class="code-lang">' + code.lang + '</span>' +
                '<button class="btn btn-xs btn-default" onclick="TimestampApp.copyToClipboard(\'' + code.code.replace(/'/g, "\\'").replace(/\n/g, '\\n') + '\')">📋 复制</button>' +
                '</div>' +
                '<pre class="code-content">' + code.code + '</pre>' +
                '</div>';
        });
        DOMUtils.setHTML(codeResults, html);
    },
    
    // 复制到剪贴板
    copyToClipboard: function(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    TimestampApp.showToast('已复制到剪贴板');
                }).catch(function(error) {
                    console.error('复制失败:', error);
                    TimestampApp.fallbackCopy(text);
                });
            } else {
                TimestampApp.fallbackCopy(text);
            }
        } catch (error) {
            console.error('复制失败:', error);
            TimestampApp.fallbackCopy(text);
        }
    },
    
    // 备用复制方法
    fallbackCopy: function(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            var successful = document.execCommand('copy');
            if (successful) {
                this.showToast('已复制到剪贴板');
            } else {
                this.showToast('复制失败');
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('复制失败');
        }
        
        document.body.removeChild(textarea);
    },
    
    // 快捷操作处理
    handleQuickAction: function(action) {
        var smartInput = DOMUtils.$('.smart-input');
        if (!smartInput) return;
        
        var value = '';
        var now = new Date();
        
        switch(action) {
            case 'now':
                value = 'now';
                break;
            case 'today':
                value = 'today';
                break;
            case 'yesterday':
                value = 'yesterday';
                break;
            case 'week_start':
                var weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                weekStart.setHours(0, 0, 0, 0);
                value = TimeUtils.formatDate(weekStart, 'YYYY-MM-DD HH:mm:ss');
                break;
            case 'month_start':
                var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                value = TimeUtils.formatDate(monthStart, 'YYYY-MM-DD HH:mm:ss');
                break;
            case 'clear':
                value = '';
                // 清空所有输入框
                var allInputs = DOMUtils.$$('input[type="text"], textarea');
                allInputs.forEach(function(input) {
                    if (!input.readOnly) {
                        input.value = '';
                    }
                });
                this.showToast('已清空所有输入');
                return;
        }
        
        smartInput.value = value;
        AppState.smartParser.input = value;
        this.parseSmartTime();
        
        if (value) {
            this.showToast('已插入: ' + value);
        }
    },
    
    // 显示提示信息
    showToast: function(message) {
        // 移除已存在的toast
        var existingToast = DOMUtils.$('.toast-message');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }
        
        var toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#333;color:#fff;padding:10px 20px;border-radius:4px;z-index:9999;transition:opacity 0.3s;';
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    },
    
    // 计算时间差
    calculateTimeDiff: function() {
        var startInput = DOMUtils.$('.start-time');
        var endInput = DOMUtils.$('.end-time');
        var resultsDiv = DOMUtils.$('.calc-results');
        
        if (!startInput || !endInput || !resultsDiv) return;
        
        var startTime = startInput.value.trim();
        var endTime = endInput.value.trim();
        
        if (!startTime || !endTime) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-warning">请输入开始时间和结束时间</div>');
            return;
        }
        
        try {
            var start = TimeUtils.parseTimeInput(startTime);
            var end = TimeUtils.parseTimeInput(endTime);
            var diff = Math.floor((end.timestamp - start.timestamp) / 1000); // 转换为秒
            
            var html = '<div class="result-item">';
            html += '<strong>时间差：</strong><br>';
            html += '秒数：' + diff + ' 秒<br>';
            html += '分钟：' + Math.floor(diff / 60) + ' 分钟<br>';
            html += '小时：' + Math.floor(diff / 3600) + ' 小时<br>';
            html += '天数：' + Math.floor(diff / 86400) + ' 天<br>';
            html += '</div>';
            
            DOMUtils.setHTML(resultsDiv, html);
        } catch (error) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-danger">错误：' + error.message + '</div>');
        }
    },
    
    // 计算时间加减
    calculateTimeAddSubtract: function() {
        var baseTimeInput = DOMUtils.$('.base-time');
        var operationSelect = DOMUtils.$('.operation-select');
        var amountInput = DOMUtils.$('.amount-input');
        var unitSelect = DOMUtils.$('.unit-select');
        var resultsDiv = DOMUtils.$('.add-subtract-results');
        
        if (!baseTimeInput || !operationSelect || !amountInput || !unitSelect || !resultsDiv) return;
        
        var baseTime = baseTimeInput.value.trim();
        var operation = operationSelect.value;
        var amount = parseInt(amountInput.value);
        var unit = unitSelect.value;
        
        if (!baseTime || isNaN(amount)) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-warning">请输入基准时间和数量</div>');
            return;
        }
        
        try {
            var base = TimeUtils.parseTimeInput(baseTime);
            var timestamp = base.timestamp;
            
            var multiplier = {
                'seconds': 1000,
                'minutes': 60 * 1000,
                'hours': 3600 * 1000,
                'days': 86400 * 1000,
                'months': 30 * 86400 * 1000,
                'years': 365 * 86400 * 1000
            };
            
            var change = amount * multiplier[unit];
            if (operation === 'subtract') {
                change = -change;
            }
            
            var newTimestamp = timestamp + change;
            var results = TimeUtils.formatTimestamp(newTimestamp);
            
            var html = '<div class="result-item">';
            html += '<strong>计算结果：</strong><br>';
            results.forEach(function(result) {
                html += result.label + '：' + result.value + '<br>';
            });
            html += '</div>';
            
            DOMUtils.setHTML(resultsDiv, html);
        } catch (error) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-danger">错误：' + error.message + '</div>');
        }
    },
    
    // 批量转换
    batchConvert: function() {
        var batchInput = DOMUtils.$('.batch-input');
        var resultsDiv = DOMUtils.$('.batch-results');
        var statsSpan = DOMUtils.$('.result-stats');
        
        if (!batchInput || !resultsDiv) return;
        
        var lines = batchInput.value.split('\n').filter(function(line) {
            return line.trim();
        });
        
        if (lines.length === 0) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-warning">请输入要转换的时间值</div>');
            return;
        }
        
        var results = [];
        var successCount = 0;
        var errorCount = 0;
        
        lines.forEach(function(line, index) {
            try {
                var parsed = TimeUtils.parseTimeInput(line.trim());
                var formatted = TimeUtils.formatTimestamp(parsed.timestamp);
                results.push({
                    line: index + 1,
                    input: line.trim(),
                    success: true,
                    results: formatted
                });
                successCount++;
            } catch (error) {
                results.push({
                    line: index + 1,
                    input: line.trim(),
                    success: false,
                    error: error.message
                });
                errorCount++;
            }
        });
        
        // 更新统计信息
        if (statsSpan) {
            DOMUtils.setHTML(statsSpan, '（成功：' + successCount + '，失败：' + errorCount + '）');
        }
        
        // 显示结果
        var html = '';
        results.forEach(function(result) {
            if (result.success) {
                html += '<div class="mb-3">';
                html += '<strong>第' + result.line + '行：</strong> ' + result.input + '<br>';
                result.results.forEach(function(format) {
                    html += '• ' + format.label + '：' + format.value + '<br>';
                });
                html += '</div>';
            } else {
                html += '<div class="mb-3 text-danger">';
                html += '<strong>第' + result.line + '行错误：</strong> ' + result.input + '<br>';
                html += '错误：' + result.error + '<br>';
                html += '</div>';
            }
        });
        
        DOMUtils.setHTML(resultsDiv, html);
    },
    
    // 导出批量结果
    exportBatchResults: function() {
        this.showToast('导出功能开发中...');
    },
    
    // 时区转换
    convertTimezone: function() {
        var timeInput = DOMUtils.$('.timezone-time-input');
        var fromSelect = DOMUtils.$('.from-timezone-select');
        var toSelect = DOMUtils.$('.to-timezone-select');
        var resultsDiv = DOMUtils.$('.timezone-results');
        
        if (!timeInput || !fromSelect || !toSelect || !resultsDiv) return;
        
        var timeValue = timeInput.value.trim();
        var fromTimezone = fromSelect.value;
        var toTimezone = toSelect.value;
        
        if (!timeValue) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-warning">请输入时间</div>');
            return;
        }
        
        try {
            // 1. 解析为UTC时间戳
            var utcTimestamp = getUTCTimestampFromLocal(timeValue, fromTimezone);

            // 2. 用Intl.DateTimeFormat格式化为目标时区的本地时间
            var dt = new Date(utcTimestamp);
            var fmt = new Intl.DateTimeFormat('zh-CN', {
                timeZone: toTimezone,
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            });
            var parts = fmt.formatToParts(dt);
            var get = t => parts.find(p => p.type === t).value;
            var targetStr = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;

            var html = '<div class="result-item">';
            html += '<strong>时区转换结果：</strong><br>';
            html += '原时间：' + timeValue + ' (' + fromTimezone + ')<br>';
            html += '目标时区：' + toTimezone + '<br>';
            html += '转换结果：' + targetStr + '<br>';
            html += '</div>';

            DOMUtils.setHTML(resultsDiv, html);
        } catch (error) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-danger">错误：' + error.message + '</div>');
        }
    },
    
    // 生成数据库格式
    generateDatabaseFormats: function() {
        var timeInput = DOMUtils.$('.db-time-input');
        var dbSelect = DOMUtils.$('.db-type-select');
        var resultsDiv = DOMUtils.$('.db-results');
        
        if (!timeInput || !dbSelect || !resultsDiv) return;
        
        var timeValue = timeInput.value.trim();
        var dbType = dbSelect.value;
        
        if (!timeValue) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-warning">请输入时间值</div>');
            return;
        }
        
        try {
            var parsed = TimeUtils.parseTimeInput(timeValue);
            var date = new Date(parsed.timestamp);
            
            var html = '<div class="result-item">';
            html += '<strong>' + dbType.toUpperCase() + ' 格式：</strong><br>';
            
            switch (dbType) {
                case 'mysql':
                    html += 'DATETIME：' + TimeUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss') + '<br>';
                    html += 'TIMESTAMP：' + Math.floor(parsed.timestamp / 1000) + '<br>';
                    html += 'SQL示例：<br>';
                    html += '<code>SELECT * FROM table WHERE created_at = \'' + TimeUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss') + '\';</code><br>';
                    break;
                case 'postgresql':
                    html += 'TIMESTAMP：' + TimeUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss') + '<br>';
                    html += 'TIMESTAMPTZ：' + date.toISOString() + '<br>';
                    html += 'EPOCH：' + Math.floor(parsed.timestamp / 1000) + '<br>';
                    break;
                case 'sqlite':
                    html += 'TEXT：' + TimeUtils.formatDate(date, 'YYYY-MM-DD HH:mm:ss') + '<br>';
                    html += 'INTEGER：' + Math.floor(parsed.timestamp / 1000) + '<br>';
                    break;
                case 'mongodb':
                    html += 'ISODate：ISODate("' + date.toISOString() + '")<br>';
                    html += 'ObjectId时间戳：' + Math.floor(parsed.timestamp / 1000).toString(16).padStart(8, '0') + '0000000000000000<br>';
                    break;
            }
            html += '</div>';
            
            DOMUtils.setHTML(resultsDiv, html);
        } catch (error) {
            DOMUtils.setHTML(resultsDiv, '<div class="text-danger">错误：' + error.message + '</div>');
        }
    }
};

function loadPatchHotfix() {
    // 页面加载时自动获取并注入页面的补丁
    chrome.runtime.sendMessage({
        type: 'fh-dynamic-any-thing',
        thing: 'fh-get-tool-patch',
        toolName: 'datetime-calc'
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
                    console.error('datetime-calc补丁JS执行失败', e);
                }
            }
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    TimestampApp.init();
    // 打赏按钮点击事件
    var donateBtn = document.querySelector('.x-donate-link');
    if (donateBtn) {
        donateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'datetime-calc' }
            });
        });
    }
    // 更多工具按钮点击事件
    var moreToolsBtn = document.querySelector('.x-other-tools');
    if (moreToolsBtn) {
        moreToolsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            chrome.runtime.openOptionsPage();
        });
    }
    loadPatchHotfix();
});

// 全局暴露主要对象（用于调试）
window.TimestampApp = TimestampApp;
window.AppState = AppState;
window.TimeUtils = TimeUtils;

// === 新增：更准确的原生JS IANA时区转换辅助函数 ===
function getUTCTimestampFromLocal(timeStr, tz) {
    // 只支持 yyyy-MM-dd HH:mm:ss
    var m = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
    if (!m) throw new Error('请输入格式为 yyyy-MM-dd HH:mm:ss 的时间');
    var y = Number(m[1]), mon = Number(m[2]), d = Number(m[3]), h = Number(m[4]), min = Number(m[5]), s = Number(m[6]);
    // 构造一个"源时区"下的本地时间的UTC时间戳
    // 1. 先用Date.UTC得到UTC时间戳
    var utcGuess = Date.UTC(y, mon - 1, d, h, min, s);
    // 2. 用Intl.DateTimeFormat格式化utcGuess为源时区的本地时间
    var fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    var parts = fmt.formatToParts(new Date(utcGuess));
    var get = t => parts.find(p => p.type === t).value;
    var localStr = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
    // 3. 计算本地时间和输入时间的差值（毫秒）
    var input = Date.UTC(y, mon - 1, d, h, min, s);
    var local = Date.UTC(
        Number(get('year')),
        Number(get('month')) - 1,
        Number(get('day')),
        Number(get('hour')),
        Number(get('minute')),
        Number(get('second'))
    );
    var diff = input - local;
    // 4. 用utcGuess + diff 得到正确的UTC时间戳
    return utcGuess + diff;
}

// 事件委托：解析结果区域点击复制
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        var parseResultsModule = document.querySelector('.parse-results-module');
        if (parseResultsModule) {
            parseResultsModule.addEventListener('click', function(e) {
                var target = e.target;
                if (target.classList.contains('result-value')) {
                    var text = target.textContent;
                    TimestampApp.copyToClipboard(text);
                }
            });
        }
    });
})(); 
