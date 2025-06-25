/**
 * 假数据生成器主逻辑
 * 使用Vue.js构建交互式界面
 */

new Vue({
    el: '#pageContainer',
    data: {
        // 当前激活的标签页
        activeTab: 'personal',
        
        // 选中的字段
        selectedFields: {
            // 个人信息
            name: false,
            email: false,
            phone: false,
            idCard: false,
            gender: false,
            age: false,
            birthday: false,
            address: false,
            
            // 商业数据
            company: false,
            department: false,
            position: false,
            salary: false,
            bankCard: false,
            creditCard: false,
            price: false,
            currency: false,
            
            // 技术数据
            uuid: false,
            ip: false,
            mac: false,
            userAgent: false,
            url: false,
            domain: false,
            password: false,
            token: false,
            color: false,
            timestamp: false,
            filename: false,
            mimeType: false
        },
        
        // 自定义字段
        customField: {
            name: '',
            type: 'string',
            rule: ''
        },
        customFields: [],
        
        // 生成配置
        generateCount: 10,
        outputFormat: 'json',
        
        // 生成的数据
        generatedData: '',
        dataSize: '0 B',
        
        // 数据生成器实例
        generator: null,
        
        // 预设模板
        templates: {
            user: {
                name: '用户信息模板',
                fields: ['name', 'email', 'phone', 'gender', 'age', 'address']
            },
            employee: {
                name: '员工信息模板',
                fields: ['name', 'email', 'phone', 'company', 'department', 'position', 'salary']
            },
            product: {
                name: '商品信息模板',
                fields: ['name', 'price', 'currency', 'uuid', 'timestamp']
            },
            order: {
                name: '订单信息模板',
                fields: ['uuid', 'name', 'email', 'phone', 'address', 'price', 'timestamp']
            },
            api: {
                name: 'API测试数据模板',
                fields: ['uuid', 'token', 'ip', 'userAgent', 'timestamp', 'boolean']
            }
        }
    },
    
    mounted() {
        // 初始化数据生成器
        this.generator = new FakeDataGenerator();
        
        // 检查URL参数，如果有模板参数则自动加载
        const urlParams = new URLSearchParams(window.location.search);
        const template = urlParams.get('template');
        if (template && this.templates[template]) {
            this.loadTemplate(template);
        }
    },
    
    methods: {
        /**
         * 添加自定义字段
         */
        addCustomField() {
            if (!this.customField.name.trim()) {
                alert('请输入字段名称');
                return;
            }
            
            // 检查字段名是否已存在
            const exists = this.customFields.some(field => field.name === this.customField.name);
            if (exists) {
                alert('字段名已存在');
                return;
            }
            
            this.customFields.push({
                name: this.customField.name,
                type: this.customField.type,
                rule: this.customField.rule
            });
            
            // 重置输入框
            this.customField = {
                name: '',
                type: 'string',
                rule: ''
            };
        },
        
        /**
         * 删除自定义字段
         */
        removeCustomField(index) {
            this.customFields.splice(index, 1);
        },
        
        /**
         * 全选当前标签页的字段
         */
        selectAll() {
            const fieldGroups = {
                personal: ['name', 'email', 'phone', 'idCard', 'gender', 'age', 'birthday', 'address'],
                business: ['company', 'department', 'position', 'salary', 'bankCard', 'creditCard', 'price', 'currency'],
                technical: ['uuid', 'ip', 'mac', 'userAgent', 'url', 'domain', 'password', 'token', 'color', 'timestamp', 'filename', 'mimeType']
            };
            
            const fields = fieldGroups[this.activeTab] || [];
            fields.forEach(field => {
                this.selectedFields[field] = true;
            });
        },
        
        /**
         * 清空所有选择
         */
        clearAll() {
            Object.keys(this.selectedFields).forEach(key => {
                this.selectedFields[key] = false;
            });
            this.customFields = [];
            this.generatedData = '';
            this.dataSize = '0 B';
        },
        
        /**
         * 生成假数据
         */
        generateData() {
            const selectedFieldKeys = Object.keys(this.selectedFields).filter(key => this.selectedFields[key]);
            
            // 检查是否选择了字段
            if (selectedFieldKeys.length === 0 && this.customFields.length === 0) {
                alert('请至少选择一个字段');
                return;
            }
            
            // 生成数据
            const data = [];
            for (let i = 0; i < this.generateCount; i++) {
                const item = {};
                
                // 生成预定义字段
                selectedFieldKeys.forEach(field => {
                    item[field] = this.generator.generateByType(field);
                });
                
                // 生成自定义字段
                this.customFields.forEach(field => {
                    item[field.name] = this.generateCustomFieldData(field);
                });
                
                data.push(item);
            }
            
            // 格式化输出
            this.formatOutput(data);
        },
        
        /**
         * 生成自定义字段数据
         */
        generateCustomFieldData(field) {
            switch (field.type) {
                case 'string':
                    return this.generator.randomString(this.generator.randomInt(5, 20));
                case 'number':
                    return this.generator.randomInt(1, 1000);
                case 'boolean':
                    return this.generator.generateBoolean();
                case 'date':
                    return this.generator.generateDate();
                case 'array':
                    const arrayLength = this.generator.randomInt(1, 5);
                    const array = [];
                    for (let i = 0; i < arrayLength; i++) {
                        array.push(this.generator.randomString(5));
                    }
                    return array;
                default:
                    return this.generator.randomString(10);
            }
        },
        
        /**
         * 格式化输出数据
         */
        formatOutput(data) {
            switch (this.outputFormat) {
                case 'json':
                    this.generatedData = JSON.stringify(data, null, 2);
                    break;
                case 'csv':
                    this.generatedData = this.convertToCSV(data);
                    break;
                case 'sql':
                    this.generatedData = this.convertToSQL(data);
                    break;
                case 'xml':
                    this.generatedData = this.convertToXML(data);
                    break;
                default:
                    this.generatedData = JSON.stringify(data, null, 2);
            }
            
            // 计算数据大小
            this.dataSize = this.calculateSize(this.generatedData);
        },
        
        /**
         * 转换为CSV格式
         */
        convertToCSV(data) {
            if (data.length === 0) return '';
            
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        // 处理包含逗号或引号的值
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');
            
            return csvContent;
        },
        
        /**
         * 转换为SQL INSERT语句
         */
        convertToSQL(data) {
            if (data.length === 0) return '';
            
            const tableName = 'fake_data';
            const headers = Object.keys(data[0]);
            
            let sql = `-- 表结构\nCREATE TABLE ${tableName} (\n`;
            sql += headers.map(header => `  ${header} VARCHAR(255)`).join(',\n');
            sql += '\n);\n\n-- 数据插入\n';
            
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header];
                    if (typeof value === 'string') {
                        return `'${value.replace(/'/g, "''")}'`;
                    }
                    return value;
                }).join(', ');
                
                sql += `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values});\n`;
            });
            
            return sql;
        },
        
        /**
         * 转换为XML格式
         */
        convertToXML(data) {
            if (data.length === 0) return '';
            
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
            
            data.forEach((item, index) => {
                xml += `  <item id="${index + 1}">\n`;
                Object.keys(item).forEach(key => {
                    const value = item[key];
                    xml += `    <${key}>${this.escapeXML(value)}</${key}>\n`;
                });
                xml += '  </item>\n';
            });
            
            xml += '</data>';
            return xml;
        },
        
        /**
         * XML字符转义
         */
        escapeXML(value) {
            if (typeof value !== 'string') {
                value = String(value);
            }
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        },
        
        /**
         * 计算数据大小
         */
        calculateSize(data) {
            const bytes = new Blob([data]).size;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            
            if (bytes === 0) return '0 B';
            
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            const size = (bytes / Math.pow(1024, i)).toFixed(2);
            
            return `${size} ${sizes[i]}`;
        },
        
        /**
         * 复制结果到剪贴板
         */
        async copyResult() {
            if (!this.generatedData) {
                alert('没有可复制的数据');
                return;
            }
            
            try {
                await navigator.clipboard.writeText(this.generatedData);
                this.showMessage('数据已复制到剪贴板', 'success');
            } catch (err) {
                console.error('复制失败:', err);
                // 备用方法
                this.fallbackCopyText(this.generatedData);
            }
        },
        
        /**
         * 备用复制方法
         */
        fallbackCopyText(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showMessage('数据已复制到剪贴板', 'success');
            } catch (err) {
                this.showMessage('复制失败，请手动选择复制', 'error');
            }
            
            document.body.removeChild(textArea);
        },
        
        /**
         * 下载数据文件
         */
        downloadData() {
            if (!this.generatedData) {
                alert('没有可下载的数据');
                return;
            }
            
            const extensions = {
                json: 'json',
                csv: 'csv',
                sql: 'sql',
                xml: 'xml'
            };
            
            const mimeTypes = {
                json: 'application/json',
                csv: 'text/csv',
                sql: 'application/sql',
                xml: 'application/xml'
            };
            
            const extension = extensions[this.outputFormat] || 'txt';
            const mimeType = mimeTypes[this.outputFormat] || 'text/plain';
            
            const blob = new Blob([this.generatedData], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `fake-data-${Date.now()}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            this.showMessage('文件下载已开始', 'success');
        },
        
        /**
         * 加载预设模板
         */
        loadTemplate(templateKey) {
            const template = this.templates[templateKey];
            if (!template) return;
            
            // 清空当前选择
            this.clearAll();
            
            // 选择模板字段
            template.fields.forEach(field => {
                if (this.selectedFields.hasOwnProperty(field)) {
                    this.selectedFields[field] = true;
                }
            });
            
            // 切换到相应的标签页
            if (template.fields.some(field => ['name', 'email', 'phone', 'idCard', 'gender', 'age', 'birthday', 'address'].includes(field))) {
                this.activeTab = 'personal';
            } else if (template.fields.some(field => ['company', 'department', 'position', 'salary', 'bankCard', 'creditCard', 'price', 'currency'].includes(field))) {
                this.activeTab = 'business';
            } else {
                this.activeTab = 'technical';
            }
            
            // 自动生成数据
            this.$nextTick(() => {
                this.generateData();
            });
            
            this.showMessage(`已加载 ${template.name} 并生成数据`, 'success');
        },
        

        // 打开工具市场页面
        openOptionsPage: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        },

        openDonateModal: function(event){
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'mock-data' }
            });
        },

        /**
         * 显示消息提示
         */
        showMessage(message, type = 'info') {
            // 创建消息元素
            const messageEl = document.createElement('div');
            messageEl.className = `${type}-message`;
            messageEl.textContent = message;
            messageEl.style.position = 'fixed';
            messageEl.style.top = '20px';
            messageEl.style.right = '20px';
            messageEl.style.zIndex = '9999';
            messageEl.style.padding = '10px 15px';
            messageEl.style.borderRadius = '4px';
            messageEl.style.fontSize = '14px';
            messageEl.style.fontWeight = '500';
            messageEl.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.15)';
            
            // 设置样式
            if (type === 'success') {
                messageEl.style.background = '#d4edda';
                messageEl.style.color = '#155724';
                messageEl.style.border = '1px solid #c3e6cb';
            } else if (type === 'error') {
                messageEl.style.background = '#f8d7da';
                messageEl.style.color = '#721c24';
                messageEl.style.border = '1px solid #f5c6cb';
            } else {
                messageEl.style.background = '#d1ecf1';
                messageEl.style.color = '#0c5460';
                messageEl.style.border = '1px solid #bee5eb';
            }
            
            document.body.appendChild(messageEl);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 3000);
        }
    },
    
    watch: {
        // 监听生成数量变化，限制范围
        generateCount(newVal) {
            if (newVal < 1) {
                this.generateCount = 1;
            } else if (newVal > 1000) {
                this.generateCount = 1000;
            }
        }
    }
}); 