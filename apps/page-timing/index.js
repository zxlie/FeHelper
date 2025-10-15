/**
 * FeHelper Wpo Tools
 */
new Vue({
    el: '#pageContainer',
    data: {
        pageTitle: '无',
        pageUrl: '无',
        timing: null,
        headerInfo: null,
        webVitals: null,
        resources: null,
        performanceMetrics: null,
        longTasks: null,
        networkInfo: null,
        // 控制各个部分的显示状态
        sectionsVisible: {
            resourceTiming: true,
            longTasks: true,
            headerInfo: true,
            optimization: true
        },
        tmDefination: {
            lookupDomainTime: 'DNS查询耗时',
            connectTime: 'TCP连接耗时',
            requestTime: '网络请求耗时',
            firstPaintTime: '白屏时间',
            readyStart: '构建文档流耗时',
            domReadyTime: 'DOM树构建耗时',
            redirectTime: '重定向耗时',
            appcacheTime: '数据缓存耗时',
            unloadEventTime: '卸载文档耗时',
            initDomTreeTime: '请求完成到可交互',
            loadEventTime: '加载事件耗时',
            loadTime: '加载总耗时'
        }
    },
    computed: {
        // 获取优化建议
        optimizationSuggestions() {
            const suggestions = [];
            
            // 性能指标建议
            if (this.webVitals) {
                // LCP建议
                if (this.webVitals.lcp > 2500) {
                    suggestions.push({
                        category: '页面加载性能',
                        type: 'warning',
                        title: '最大内容绘制(LCP)需要优化',
                        description: '当前LCP时间为 ' + Math.ceil(this.webVitals.lcp) + 'ms，超过了推荐的2500ms',
                        suggestions: [
                            '优化服务器响应时间，考虑使用CDN',
                            '优化关键渲染路径，减少阻塞资源',
                            '优化和压缩图片，考虑使用WebP格式',
                            '实施懒加载策略',
                            '优化CSS和JavaScript的加载顺序'
                        ]
                    });
                }

                // FID建议
                if (this.webVitals.fid > 100) {
                    suggestions.push({
                        category: '交互响应性能',
                        type: 'warning',
                        title: '首次输入延迟(FID)需要改进',
                        description: '当前FID时间为 ' + Math.ceil(this.webVitals.fid) + 'ms，超过了推荐的100ms',
                        suggestions: [
                            '减少主线程工作量，拆分长任务',
                            '优化JavaScript执行时间',
                            '延迟加载非关键JavaScript',
                            '移除未使用的JavaScript代码',
                            '使用Web Workers处理复杂计算'
                        ]
                    });
                }

                // CLS建议
                if (this.webVitals.cls > 0.1) {
                    suggestions.push({
                        category: '视觉稳定性',
                        type: 'warning',
                        title: '累积布局偏移(CLS)需要改进',
                        description: '当前CLS值为 ' + this.webVitals.cls.toFixed(3) + '，超过了推荐的0.1',
                        suggestions: [
                            '为图片和视频元素设置明确的宽高比',
                            '避免在已存在的内容上方插入内容',
                            '使用transform动画代替改变位置的动画',
                            '预留足够的空间给动态加载的内容',
                            '优化字体加载策略'
                        ]
                    });
                }
            }

            // 资源优化建议
            if (this.resources && this.resources.length) {
                let totalSize = 0;
                let largeResources = [];
                let uncompressedResources = [];
                let longLoadingResources = [];

                this.resources.forEach(resource => {
                    totalSize += resource.transferSize || 0;
                    
                    // 检查大文件
                    if (resource.transferSize > 500 * 1024) { // 大于500KB
                        largeResources.push(resource);
                    }
                    
                    // 检查加载时间长的资源
                    if (resource.duration > 1000) { // 超过1秒
                        longLoadingResources.push(resource);
                    }
                });

                if (totalSize > 2 * 1024 * 1024) { // 总大小超过2MB
                    suggestions.push({
                        category: '资源优化',
                        type: 'warning',
                        title: '总资源大小过大',
                        description: '页面总资源大小为 ' + this.formatSize(totalSize),
                        suggestions: [
                            '使用代码分割和懒加载',
                            '优化和压缩图片资源',
                            '启用Gzip/Brotli压缩',
                            '使用合适的缓存策略',
                            '移除未使用的CSS和JavaScript代码'
                        ]
                    });
                }

                if (largeResources.length > 0) {
                    suggestions.push({
                        category: '资源优化',
                        type: 'info',
                        title: '发现大体积资源文件',
                        description: '有 ' + largeResources.length + ' 个资源文件大于500KB',
                        suggestions: largeResources.map(r => 
                            `优化 ${this.getFileName(r.name)} (${this.formatSize(r.transferSize)})`
                        )
                    });
                }

                if (longLoadingResources.length > 0) {
                    suggestions.push({
                        category: '资源加载优化',
                        type: 'warning',
                        title: '资源加载时间过长',
                        description: '有 ' + longLoadingResources.length + ' 个资源加载时间超过1秒',
                        suggestions: longLoadingResources.map(r =>
                            `优化 ${this.getFileName(r.name)} (${Math.ceil(r.duration)}ms)`
                        )
                    });
                }
            }

            // JavaScript性能建议
            if (this.performanceMetrics) {
                const usedHeapRatio = this.performanceMetrics.usedJSHeapSize / this.performanceMetrics.jsHeapSizeLimit;
                if (usedHeapRatio > 0.7) {
                    suggestions.push({
                        category: '内存使用优化',
                        type: 'warning',
                        title: 'JavaScript内存使用率过高',
                        description: '当前内存使用率达到 ' + (usedHeapRatio * 100).toFixed(1) + '%',
                        suggestions: [
                            '检查内存泄漏问题',
                            '优化大对象的创建和销毁',
                            '使用防抖和节流控制频繁操作',
                            '及时清理不再使用的事件监听器',
                            '优化闭包使用，避免过度引用'
                        ]
                    });
                }
            }

            // 长任务优化建议
            if (this.longTasks && this.longTasks.length > 3) {
                suggestions.push({
                    category: '性能优化',
                    type: 'warning',
                    title: '检测到多个长任务',
                    description: '发现 ' + this.longTasks.length + ' 个执行时间超过50ms的任务',
                    suggestions: [
                        '将长任务拆分为更小的任务',
                        '使用Web Workers处理复杂计算',
                        '优化事件处理函数',
                        '使用requestAnimationFrame进行视觉更新',
                        '使用requestIdleCallback处理非关键任务'
                    ]
                });
            }

            // 网络优化建议
            if (this.networkInfo) {
                if (this.networkInfo.effectiveType !== '4g') {
                    suggestions.push({
                        category: '网络优化',
                        type: 'info',
                        title: '检测到非4G网络环境',
                        description: '当前网络类型: ' + this.networkInfo.effectiveType + ', RTT: ' + this.networkInfo.rtt + 'ms',
                        suggestions: [
                            '实施渐进式加载策略',
                            '优先加载关键资源',
                            '使用自适应加载',
                            '考虑使用Service Worker缓存',
                            '优化资源大小和加载顺序'
                        ]
                    });
                }
            }

            // HTTP Header优化建议
            if (this.headerInfo) {
                const headerSuggestions = [];
                
                if (!this.headerInfo['cache-control']) {
                    headerSuggestions.push('添加Cache-Control头以优化缓存策略');
                }
                if (!this.headerInfo['content-encoding']) {
                    headerSuggestions.push('启用Gzip/Brotli压缩以减少传输大小');
                }
                if (!this.headerInfo['x-content-type-options']) {
                    headerSuggestions.push('添加X-Content-Type-Options头以提高安全性');
                }
                if (!this.headerInfo['x-frame-options']) {
                    headerSuggestions.push('添加X-Frame-Options头以防止点击劫持');
                }

                if (headerSuggestions.length > 0) {
                    suggestions.push({
                        category: 'HTTP优化',
                        type: 'info',
                        title: 'HTTP响应头优化建议',
                        description: '发现 ' + headerSuggestions.length + ' 个HTTP头部优化建议',
                        suggestions: headerSuggestions
                    });
                }
            }

            return suggestions;
        }
    },
    mounted: function () {
        // 清理过期数据（7天前的数据）
        this.cleanExpiredData();

        // 在tab创建或者更新时候，监听事件，看看是否有参数传递过来
        if (location.protocol === 'chrome-extension:') {
            chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
                if (!tabs || !tabs.length) {
                    console.warn('未找到活动标签页');
                    return;
                }
                let activeTab = tabs[0];
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'request-page-content',
                    tabId: activeTab.id
                }).then(resp => {
                    if (!resp) {
                        console.warn('未收到响应数据');
                        return;
                    }
                    if (!resp.content) {
                        console.warn('响应数据中没有content字段');
                        return;
                    }
                    try {
                        // 保存数据到localStorage，带上时间戳
                        const storageData = {
                            timestamp: Date.now(),
                            data: resp.content
                        };
                        localStorage.setItem('wpo-data', JSON.stringify(storageData));
                        this.showTiming(resp.content);
                    } catch (e) {
                        console.error('处理性能数据时出错：', e);
                    }
                }).catch(err => {
                    console.error('获取页面性能数据失败：', err);
                });
            });
        } else {
            try {
                // 从localStorage读取数据
                let wpoStorageData = localStorage.getItem('wpo-data');
                if (wpoStorageData) {
                    let storage = JSON.parse(wpoStorageData);
                    this.showTiming(storage.data);
                }
            } catch (e) {
                console.error('读取缓存的性能数据失败：', e);
            }
        }

        this.loadPatchHotfix();
    },

    methods: {

        loadPatchHotfix() {
            // 页面加载时自动获取并注入页面的补丁
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'fh-get-tool-patch',
                toolName: 'page-timing'
            }, patch => {
                if (patch) {
                    if (patch.css) {
                        const style = document.createElement('style');
                        style.textContent = patch.css;
                        document.head.appendChild(style);
                    }
                    if (patch.js) {
                        try {
                            if (window.evalCore && window.evalCore.getEvalInstance) {
                                window.evalCore.getEvalInstance(window)(patch.js);
                            }
                        } catch (e) {
                            console.error('page-timing补丁JS执行失败', e);
                        }
                    }
                }
            });
        },

        // 切换部分的显示/隐藏
        toggleSection(section) {
            this.sectionsVisible[section] = !this.sectionsVisible[section];
            // 更新aria-expanded属性
            this.$nextTick(() => {
                const header = document.querySelector(`#${section} .card-header`);
                if (header) {
                    header.setAttribute('aria-expanded', this.sectionsVisible[section]);
                }
            });
        },

        // 清理过期数据（7天前的数据）
        cleanExpiredData() {
            try {
                const wpoStorageData = localStorage.getItem('wpo-data');
                if (wpoStorageData) {
                    const storage = JSON.parse(wpoStorageData);
                    const expirationTime = 7 * 24 * 60 * 60 * 1000; // 7天
                    if (Date.now() - storage.timestamp > expirationTime) {
                        localStorage.removeItem('wpo-data');
                    }
                }
            } catch (e) {
                console.error('清理过期数据时出错：', e);
            }
        },

        showTiming(wpo) {
            if (!wpo || typeof wpo !== 'object') {
                console.warn('性能数据格式不正确');
                return;
            }

            try {
                this.pageTitle = wpo.pageInfo?.title || "无";
                this.pageUrl = wpo.pageInfo?.url || "无";
                this.timing = wpo.time || null;
                this.headerInfo = wpo.header || null;
                this.webVitals = wpo.webVitals || null;
                this.resources = wpo.resources || null;
                this.performanceMetrics = wpo.performanceMetrics || null;
                this.longTasks = wpo.longTasks || null;
                this.networkInfo = wpo.networkInfo || null;
            } catch (e) {
                console.error('显示性能数据时出错：', e);
            }
        },

        // Core Web Vitals 状态判断
        getLCPStatus(lcp) {
            if (!lcp) return '';
            return lcp <= 2500 ? 'text-success' : lcp <= 4000 ? 'text-warning' : 'text-danger';
        },
        getLCPStatusText(lcp) {
            if (!lcp) return '未知';
            return lcp <= 2500 ? '良好' : lcp <= 4000 ? '需要改进' : '较差';
        },
        getFIDStatus(fid) {
            if (!fid) return '';
            return fid <= 100 ? 'text-success' : fid <= 300 ? 'text-warning' : 'text-danger';
        },
        getFIDStatusText(fid) {
            if (!fid) return '未触发';
            return fid <= 100 ? '良好' : fid <= 300 ? '需要改进' : '较差';
        },
        getCLSStatus(cls) {
            if (!cls) return '';
            return cls <= 0.1 ? 'text-success' : cls <= 0.25 ? 'text-warning' : 'text-danger';
        },
        getCLSStatusText(cls) {
            if (!cls) return '未知';
            return cls <= 0.1 ? '良好' : cls <= 0.25 ? '需要改进' : '较差';
        },

        // 工具函数
        formatSize(bytes) {
            if (!bytes) return '0 B';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < units.length - 1) {
                bytes /= 1024;
                i++;
            }
            return bytes.toFixed(2) + ' ' + units[i];
        },

        formatTime(timestamp) {
            return new Date(timestamp).toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3
            });
        },

        getFileName(url) {
            try {
                return new URL(url).pathname.split('/').pop() || url;
            } catch (e) {
                return url;
            }
        },

        openDonateModal: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'page-timing' }
            });
        },

        openOptionsPage: function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        }   
    }
});
