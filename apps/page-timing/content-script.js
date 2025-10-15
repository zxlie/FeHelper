/**
 * 计算并保存网页加载时间
 * @author zhaoxianlie
 */
window.pagetimingContentScript = function () {

    /**
     * Navigation Timing API helpers
     * timing.getTimes();
     **/
    window.timing = window.timing || {
        /**
         * Outputs extended measurements using Navigation Timing API
         * @param  Object opts Options (simple (bool) - opts out of full data view)
         * @return Object      measurements
         */
        getTimes: function(opts) {
            var performance = window.performance || window.webkitPerformance || window.msPerformance || window.mozPerformance;

            if (performance === undefined) {
                return false;
            }

            var timing = performance.timing;
            var api = {};
            opts = opts || {};

            if (timing) {
                if(opts && !opts.simple) {
                    for (var k in timing) {
                        if(isNumeric(timing[k])) {
                            api[k] = parseFloat(timing[k]);
                        }
                    }
                }

                // Time to first paint
                if (api.firstPaint === undefined) {
                    var firstPaint = 0;

                    // IE
                    if (typeof timing.msFirstPaint === 'number') {
                        firstPaint = timing.msFirstPaint;
                        api.firstPaintTime = firstPaint - timing.navigationStart;
                    } else if (performance.getEntriesByName !== undefined) {
                        var firstPaintPerformanceEntry = performance.getEntriesByName('first-paint');
                        if (firstPaintPerformanceEntry.length === 1) {
                            var firstPaintTime = firstPaintPerformanceEntry[0].startTime;
                            firstPaint = performance.timeOrigin + firstPaintTime;
                            api.firstPaintTime = firstPaintTime;
                        }
                    }
                    if (opts && !opts.simple) {
                        api.firstPaint = firstPaint;
                    }
                }

                // Total time from start to load
                api.loadTime = timing.loadEventEnd - timing.fetchStart;
                // Time spent constructing the DOM tree
                api.domReadyTime = timing.domComplete - timing.domInteractive;
                // Time consumed preparing the new page
                api.readyStart = timing.fetchStart - timing.navigationStart;
                // Time spent during redirection
                api.redirectTime = timing.redirectEnd - timing.redirectStart;
                // AppCache
                api.appcacheTime = timing.domainLookupStart - timing.fetchStart;
                // Time spent unloading documents
                api.unloadEventTime = timing.unloadEventEnd - timing.unloadEventStart;
                // DNS query time
                api.lookupDomainTime = timing.domainLookupEnd - timing.domainLookupStart;
                // TCP connection time
                api.connectTime = timing.connectEnd - timing.connectStart;
                // Time spent during the request
                api.requestTime = timing.responseEnd - timing.requestStart;
                // Request to completion of the DOM loading
                api.initDomTreeTime = timing.domInteractive - timing.responseEnd;
                // Load event time
                api.loadEventTime = timing.loadEventEnd - timing.loadEventStart;
            }

            return api;
        },
        /**
         * Uses console.table() to print a complete table of timing information
         * @param  Object opts Options (simple (bool) - opts out of full data view)
         */
        printTable: function(opts) {
            var table = {};
            var data  = this.getTimes(opts) || {};
            Object.keys(data).sort().forEach(function(k) {
                table[k] = {
                    ms: data[k],
                    s: +((data[k] / 1000).toFixed(2))
                };
            });
            console.table(table);
        },
        /**
         * Uses console.table() to print a summary table of timing information
         */
        printSimpleTable: function() {
            this.printTable({simple: true});
        }
    };

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    // 获取资源加载性能数据
    function getResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        return resources.map(resource => ({
            name: resource.name,
            entryType: resource.entryType,
            startTime: resource.startTime,
            duration: resource.duration,
            transferSize: resource.transferSize,
            decodedBodySize: resource.decodedBodySize,
            encodedBodySize: resource.encodedBodySize,
            dnsTime: resource.domainLookupEnd - resource.domainLookupStart,
            tcpTime: resource.connectEnd - resource.connectStart,
            ttfb: resource.responseStart - resource.requestStart,
            downloadTime: resource.responseEnd - resource.responseStart
        }));
    }

    // 获取核心Web指标
    function getCoreWebVitals() {
        return new Promise(resolve => {
            let webVitals = {};
            
            // LCP (Largest Contentful Paint)
            new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                webVitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
            }).observe({entryTypes: ['largest-contentful-paint']});

            // FID (First Input Delay)
            new PerformanceObserver((entryList) => {
                const firstInput = entryList.getEntries()[0];
                if (firstInput) {
                    webVitals.fid = firstInput.processingTime;
                    webVitals.firstInputTime = firstInput.startTime;
                }
            }).observe({entryTypes: ['first-input']});

            // CLS (Cumulative Layout Shift)
            let clsValue = 0;
            new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                webVitals.cls = clsValue;
            }).observe({entryTypes: ['layout-shift']});

            setTimeout(() => resolve(webVitals), 3000);
        });
    }

    // 获取性能指标
    function getPerformanceMetrics() {
        if (window.performance.memory) {
            return {
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                usedJSHeapSize: performance.memory.usedJSHeapSize
            };
        }
        return null;
    }

    // 监控长任务
    function observeLongTasks() {
        const longTasks = [];
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                longTasks.push({
                    duration: entry.duration,
                    startTime: entry.startTime,
                    name: entry.name
                });
            }
        }).observe({entryTypes: ['longtask']});
        return longTasks;
    }

    // 获取网络信息
    function getNetworkInfo() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    // 创建进度提示框
    function createProgressTip() {
        const tipContainer = document.createElement('div');
        tipContainer.id = 'fe-helper-timing-tip';
        tipContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 999999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: opacity 0.3s;
        `;
        document.body.appendChild(tipContainer);
        return tipContainer;
    }

    // 更新提示框内容
    function updateProgressTip(message, progress) {
        const tipContainer = document.getElementById('fe-helper-timing-tip') || createProgressTip();
        tipContainer.innerHTML = `
            <div>${message}</div>
            ${progress ? `<div style="margin-top:8px;background:rgba(255,255,255,0.2);height:2px;border-radius:1px">
                <div style="width:${progress}%;height:100%;background:#4CAF50;border-radius:1px"></div>
            </div>` : ''}
        `;
    }

    // 移除提示框
    function removeProgressTip() {
        const tipContainer = document.getElementById('fe-helper-timing-tip');
        if (tipContainer) {
            tipContainer.style.opacity = '0';
            setTimeout(() => tipContainer.remove(), 300);
        }
    }

    window.pagetimingNoPage = function() {
        updateProgressTip('正在收集页面基础信息...', 20);

        let wpoInfo = {
            pageInfo: {
                title: document.title,
                url: location.href
            },
            time: window.timing.getTimes({simple: true}),
            resources: getResourceTiming(),
            networkInfo: getNetworkInfo(),
            performanceMetrics: getPerformanceMetrics(),
            longTasks: []
        };

        updateProgressTip('正在监控页面性能...', 40);
        // 初始化长任务监控
        const longTasksMonitor = observeLongTasks();

        let sendWpoInfo = function () {
            updateProgressTip('正在处理性能数据...', 60);
            // 合并长任务数据
            wpoInfo.longTasks = longTasksMonitor;

            // 获取核心Web指标
            getCoreWebVitals().then(webVitals => {
                updateProgressTip('正在完成数据采集...', 80);
                wpoInfo.webVitals = webVitals;
                
                chrome.runtime.sendMessage({
                    type: 'fh-dynamic-any-thing',
                    thing: 'set-page-timing-data',
                    wpoInfo: wpoInfo
                }, () => {
                    updateProgressTip('数据采集完成！', 100);
                    setTimeout(removeProgressTip, 1000);
                });
            });
        };

        let getHttpHeaders = function () {
            if (wpoInfo.header && wpoInfo.time && wpoInfo.pageInfo) {
                sendWpoInfo();
            } else {
                updateProgressTip('正在获取页面请求头信息...', 50);
                fetch(location.href).then(resp => {
                    let header = {};
                    for (let pair of resp.headers.entries()) {
                        header[pair[0]] = pair[1];
                    }
                    return header;
                }).then(header => {
                    wpoInfo.header = header;
                    sendWpoInfo();
                }).catch(error => {
                    console.log(error);
                    updateProgressTip('获取请求头信息失败，继续其他数据采集...', 50);
                    sendWpoInfo();
                });
            }
        };

        let detect = function () {
            // 如果是网络地址，才去获取header
            if (/^((http)|(https)):\/\//.test(location.href)) {
                getHttpHeaders();
            } else {
                sendWpoInfo();
            }
        };

        detect();
    };
};
