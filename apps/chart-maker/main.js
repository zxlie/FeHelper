document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const simpleDataContainer = document.getElementById('simple-data-container');
    const seriesDataContainer = document.getElementById('series-data-container');
    const csvDataContainer = document.getElementById('csv-data-container');
    const generateBtn = document.getElementById('generate-btn');
    const sampleDataBtn = document.getElementById('sample-data-btn');
    const exportPngBtn = document.getElementById('export-png-btn');
    const exportJpgBtn = document.getElementById('export-jpg-btn');
    const copyImgBtn = document.getElementById('copy-img-btn');
    const manualFormatSelect = document.getElementById('manual-format');
    const fileUploadInput = document.getElementById('file-upload');
    const manualFormatContainer = document.getElementById('manual-format-container');
    const donateLink = document.querySelector('.x-donate-link');
    const otherToolsLink = document.querySelector('.x-other-tools');

    const manualInputContainers = [simpleDataContainer, seriesDataContainer, csvDataContainer];
    
    // 初始化显示状态
    const initialMethod = document.querySelector('input[name="data-input-method"]:checked').value;
    toggleManualInputs(initialMethod === 'manual');
    fileUploadInput.parentElement.style.display = initialMethod === 'upload-csv' ? 'block' : 'none';

    // 初始化图表类型画廊
    initChartTypeGallery();

    function toggleManualInputs(show) {
        manualFormatContainer.style.display = show ? 'block' : 'none';
        const selectedFormat = manualFormatSelect.value;
        manualInputContainers.forEach(container => {
            const containerId = container.id.split('-')[0]; // 'simple', 'series', 'csv'
            container.style.display = (show && containerId === selectedFormat) ? 'block' : 'none';
        });
    }

    // 初始化时调用updateChartTypeOptions函数
    // 无论当前选择的是什么输入方式，都初始化图表类型
    // 默认使用'series'格式以显示最多的图表类型选项
    updateChartTypeOptions('series');

    // 监听数据输入方式切换
    document.querySelectorAll('input[name="data-input-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const method = this.value;
            toggleManualInputs(method === 'manual');
            fileUploadInput.parentElement.style.display = method === 'upload-csv' ? 'block' : 'none';
            
            // 在切换到"上传Excel/CSV"时，更新图表类型选项为多系列数据
            if (method === 'upload-csv') {
                updateChartTypeOptions('series');
            } else if (method === 'manual') {
                // 切换回"手动录入"时，根据当前选择的格式更新图表类型选项
                updateChartTypeOptions(manualFormatSelect.value);
                uploadedData = null;
                fileUploadInput.value = ''; // 清空文件选择
            }
        });
    });

    // 监听打赏链接点击事件
    donateLink.addEventListener('click', function(event) {
        event.preventDefault();
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'open-donate-modal', 
            params: { toolName: 'chart-maker' }
        });
    });

    // 监听探索更多工具链接点击事件
    otherToolsLink.addEventListener('click', function(event) {
        event.preventDefault(); 
        chrome.runtime.openOptionsPage();
    });

    // 监听手动格式选择变化
    manualFormatSelect.addEventListener('change', function() {
        const format = this.value;
        manualInputContainers.forEach(container => {
            const containerId = container.id.split('-')[0];
            container.style.display = (containerId === format) ? 'block' : 'none';
        });
        
        // 更新图表类型选项
        updateChartTypeOptions(format);
    });

    // 文件上传处理
    fileUploadInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) {
            uploadedData = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                uploadedData = parseExcelData(jsonData);
                showNotification('文件上传成功，可以点击"生成图表"');
                
                // 上传Excel文件后，更新图表类型选项为多系列数据类型
                updateChartTypeOptions('series');
            } catch (error) {
                showNotification('文件解析失败: ' + error.message, true);
                uploadedData = null;
                fileUploadInput.value = ''; // 清空文件选择
            }
        };
        reader.onerror = function() {
            showNotification('文件读取失败', true);
            uploadedData = null;
            fileUploadInput.value = ''; // 清空文件选择
        };
        reader.readAsArrayBuffer(file);
    });

    // 生成图表按钮点击事件 (修改为独立的函数)
    function generateChart() {
        try {
            let parsedData;
            const method = document.querySelector('input[name="data-input-method"]:checked').value;

            if (method === 'upload-csv' && uploadedData) {
                parsedData = uploadedData;
            } else if (method === 'manual') {
                parsedData = parseInputData(); // 使用现有的手动数据解析函数
            } else if (method === 'upload-csv' && !uploadedData) {
                throw new Error('请先上传文件');
            } else {
                throw new Error('请选择有效的数据输入方式并提供数据');
            }
            
            if (!parsedData || 
                (parsedData.labels && parsedData.labels.length === 0) || 
                (parsedData.datasets && parsedData.datasets.length === 0)) {
                throw new Error('无法解析数据或数据为空');
            }
            
            // 保存数据到全局变量，方便其他函数访问
            window.chartData = parsedData;
            
            const chartSettings = getChartSettings();
            
            // 将简单数据标记添加到设置中
            if (parsedData.isSimpleData) {
                chartSettings.isSimpleData = true;
            }
            
            // 调用chart-generator.js中的createChart函数
            if (typeof createChart !== 'function') {
                throw new Error('createChart函数未定义，请确保chart-generator.js正确加载');
            }
            
            createChart(parsedData, chartSettings);
            
            exportPngBtn.disabled = false;
            exportJpgBtn.disabled = false;
            copyImgBtn.disabled = false;
        } catch (error) {
            showNotification(error.message, true);
        }
    }

    // 将generateChart函数暴露为全局函数
    window.generateChart = generateChart;

    generateBtn.addEventListener('click', generateChart);

    // 监听图表设置的变化事件，实时更新图表 (仅在有图表时)
    ['chart-title', 'x-axis-label', 'y-axis-label', 'color-scheme', 'legend-position'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            const instance = getChartInstance();
            if (instance) { // 检查是否有图表实例
                generateChart(); // 重新生成图表以应用设置
            }
        });
    });
    
    // 初始化图表类型画廊
    function initChartTypeGallery() {
        // 获取所有图表类型预览项
        const chartTypeItems = document.querySelectorAll('.chart-type-item');
        
        // 为每个预览项添加点击事件
        chartTypeItems.forEach(item => {
            item.addEventListener('click', function() {
                const chartType = this.getAttribute('data-chart-type');
                
                // 更新活动状态
                chartTypeItems.forEach(item => item.classList.remove('active'));
                this.classList.add('active');
                
                // 无论是否有图表实例都应该重新生成图表
                // 删除之前的检查条件，始终调用generateChart
                generateChart();
            });
        });
        
        // 初始设置默认图表类型为活动状态
        const defaultChartType = "bar"; // 默认为柱状图
        const activeItem = document.querySelector(`.chart-type-item[data-chart-type="${defaultChartType}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }
    
    // 加载样例数据
    sampleDataBtn.addEventListener('click', function() {
        // 确保选中"手动录入"选项
        const manualRadio = document.querySelector('input[name="data-input-method"][value="manual"]');
        if (manualRadio && !manualRadio.checked) {
            manualRadio.checked = true;
            // 触发change事件以显示相关的输入控件
            manualRadio.dispatchEvent(new Event('change'));
        }
        
        const currentFormat = manualFormatSelect.value;
        
        switch(currentFormat) {
            case 'simple':
                document.getElementById('data-input').value = 
                    '智能手机,2458\n平板电脑,1678\n笔记本电脑,1892\n智能手表,986\n耳机,1342';
                document.getElementById('chart-title').value = '2023年电子产品销量（万台）';
                document.getElementById('x-axis-label').value = '产品类别';
                document.getElementById('y-axis-label').value = '销量（万台）';
                break;
            case 'series':
                document.getElementById('series-data-input').value = 
                    '第一季度,2458,1678,1892,986,1342\n第二季度,2612,1524,1953,1104,1587\n第三季度,2845,1701,2135,1287,1643\n第四季度,3256,1835,2278,1452,1821';
                document.getElementById('series-labels').value = 
                    '智能手机,平板电脑,笔记本电脑,智能手表,耳机';
                document.getElementById('chart-title').value = '2023年电子产品季度销量（万台）';
                document.getElementById('x-axis-label').value = '产品类别';
                document.getElementById('y-axis-label').value = '销量（万台）';
                break;
            case 'csv':
                document.getElementById('csv-data-input').value = 
                    '品牌,2021年,2022年,2023年\n华为,786.5,845.2,921.6\n小米,651.2,712.8,768.3\n苹果,598.7,642.1,724.5\n三星,542.3,575.8,612.4\nOPPO,487.6,524.3,547.8\nvivo,452.8,501.7,532.9';
                document.getElementById('chart-title').value = '国内智能手机品牌销量趋势（万台）';
                document.getElementById('x-axis-label').value = '品牌';
                document.getElementById('y-axis-label').value = '销量（万台）';
                break;
        }
        
        // 提示用户下一步操作
        showNotification('已加载样例数据，点击"生成图表"查看效果');
    });
    
    // 显示通知
    function showNotification(message, isError = false) {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 创建新通知
        const notification = document.createElement('div');
        notification.className = 'notification' + (isError ? ' error' : '');
        notification.textContent = message;
        
        // 添加到文档
        document.body.appendChild(notification);
        
        // 显示通知
        setTimeout(() => notification.classList.add('show'), 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 解析输入数据
    function parseInputData() {
        const currentFormat = manualFormatSelect.value;
        
        switch(currentFormat) {
            case 'simple':
                return parseSimpleData();
            case 'series':
                return parseSeriesData();
            case 'csv':
                return parseCsvData();
            default:
                throw new Error('未知的数据格式');
        }
    }
    
    // 解析简单数据
    function parseSimpleData() {
        const input = document.getElementById('data-input').value.trim();
        if (!input) {
            throw new Error('请输入数据');
        }
        
        const lines = input.split('\n').filter(line => line.trim());
        const labels = [];
        const data = [];
        
        lines.forEach(line => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                labels.push(parts[0]);
                const value = parseFloat(parts[1]);
                if (isNaN(value)) {
                    throw new Error(`"${parts[1]}"不是有效的数值`);
                }
                data.push(value);
            }
        });
        
        if (labels.length === 0 || data.length === 0) {
            throw new Error('无法解析数据，请检查格式是否正确');
        }
        
        return {
            labels: labels,
            datasets: [{
                data: data,
                label: '数值'
            }],
            isSimpleData: true // 添加标记，表示这是简单数据格式
        };
    }
    
    // 解析系列数据
    function parseSeriesData() {
        const input = document.getElementById('series-data-input').value.trim();
        const labelsInput = document.getElementById('series-labels').value.trim();
        
        if (!input) {
            throw new Error('请输入系列数据');
        }
        
        if (!labelsInput) {
            throw new Error('请输入标签数据');
        }
        
        const lines = input.split('\n').filter(line => line.trim());
        const labels = labelsInput.split(',').map(label => label.trim());
        const datasets = [];
        
        lines.forEach(line => {
            const parts = line.split(',').map(part => part.trim());
            if (parts.length >= 2) {
                const seriesName = parts[0];
                const seriesData = parts.slice(1).map(val => {
                    const value = parseFloat(val);
                    if (isNaN(value)) {
                        throw new Error(`"${val}"不是有效的数值`);
                    }
                    return value;
                });
                
                datasets.push({
                    label: seriesName,
                    data: seriesData
                });
            }
        });
        
        if (labels.length === 0 || datasets.length === 0) {
            throw new Error('无法解析数据，请检查格式是否正确');
        }
        
        return {
            labels: labels,
            datasets: datasets
        };
    }
    
    // 解析CSV数据
    function parseCsvData() {
        const input = document.getElementById('csv-data-input').value.trim();
        const firstRowHeader = document.getElementById('first-row-header').checked;
        const firstColLabels = document.getElementById('first-col-labels').checked;
        
        if (!input) {
            throw new Error('请输入CSV数据');
        }
        
        const lines = input.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV数据至少需要两行');
        }
        
        const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
        
        let labels = [];
        let datasets = [];
        
        if (firstRowHeader && firstColLabels) {
            // 第一行是标题，第一列是标签
            labels = rows.slice(1).map(row => row[0]);
            
            const headers = rows[0].slice(1);
            headers.forEach((header, i) => {
                const data = rows.slice(1).map(row => {
                    const value = parseFloat(row[i+1]);
                    if (isNaN(value)) {
                        throw new Error(`"${row[i+1]}"不是有效的数值`);
                    }
                    return value;
                });
                
                datasets.push({
                    label: header,
                    data: data
                });
            });
        } else if (firstRowHeader && !firstColLabels) {
            // 第一行是标题，但第一列不是标签
            labels = Array.from({length: rows[0].length}, (_, i) => `数据${i+1}`);
            
            const headers = rows[0];
            headers.forEach((header, i) => {
                const data = rows.slice(1).map(row => {
                    const value = parseFloat(row[i]);
                    if (isNaN(value)) {
                        throw new Error(`"${row[i]}"不是有效的数值`);
                    }
                    return value;
                });
                
                datasets.push({
                    label: header,
                    data: data
                });
            });
        } else if (!firstRowHeader && firstColLabels) {
            // 第一行不是标题，第一列是标签
            labels = rows.map(row => row[0]);
            
            for (let i = 1; i < rows[0].length; i++) {
                const data = rows.map(row => {
                    const value = parseFloat(row[i]);
                    if (isNaN(value)) {
                        throw new Error(`"${row[i]}"不是有效的数值`);
                    }
                    return value;
                });
                
                datasets.push({
                    label: `系列${i}`,
                    data: data
                });
            }
        } else {
            // 第一行不是标题，第一列也不是标签
            labels = Array.from({length: rows.length}, (_, i) => `标签${i+1}`);
            
            for (let i = 0; i < rows[0].length; i++) {
                const data = rows.map(row => {
                    const value = parseFloat(row[i]);
                    if (isNaN(value)) {
                        throw new Error(`"${row[i]}"不是有效的数值`);
                    }
                    return value;
                });
                
                datasets.push({
                    label: `系列${i+1}`,
                    data: data
                });
            }
        }
        
        if (labels.length === 0 || datasets.length === 0) {
            throw new Error('无法解析数据，请检查格式是否正确');
        }
        
        return {
            labels: labels,
            datasets: datasets
        };
    }
    
    // 获取图表设置
    function getChartSettings() {
        // 从活跃的图表类型项获取图表类型，而不是从下拉框
        let chartType = 'bar'; // 默认值
        const activeChartTypeItem = document.querySelector('.chart-type-item.active');
        if (activeChartTypeItem) {
            chartType = activeChartTypeItem.getAttribute('data-chart-type');
        }
        
        return {
            type: chartType,
            title: document.getElementById('chart-title').value,
            xAxisLabel: document.getElementById('x-axis-label').value,
            yAxisLabel: document.getElementById('y-axis-label').value,
            colorScheme: document.getElementById('color-scheme').value,
            legendPosition: document.getElementById('legend-position').value,
            showGridLines: document.getElementById('show-grid-lines').checked,
            animateChart: document.getElementById('animate-chart').checked
        };
    }
    
    // 导出PNG图像
    exportPngBtn.addEventListener('click', function() {
        exportChart('png');
    });
    
    // 导出JPG图像
    exportJpgBtn.addEventListener('click', function() {
        exportChart('jpg');
    });
    
    // 复制图像到剪贴板
    copyImgBtn.addEventListener('click', function() {
        copyChartToClipboard();
    });
    
    // 导出图表为图像
    function exportChart(format) {
        const chartWrapper = document.getElementById('chart-wrapper');
        
        // 创建加载指示器
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        chartWrapper.appendChild(loadingOverlay);
        
        setTimeout(() => {
            // 获取原始canvas的尺寸
            const originalCanvas = document.getElementById('chart-canvas');
            const width = originalCanvas.width;
            const height = originalCanvas.height;
            
            // 创建一个临时的高分辨率canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 设置更高的分辨率
            const scale = 8; // 提升到8倍分辨率
            tempCanvas.width = width * scale;
            tempCanvas.height = height * scale;
            
            // 优化渲染质量
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            html2canvas(originalCanvas, {
                backgroundColor: '#ffffff',
                scale: scale, // 使用8倍缩放
                width: width,
                height: height,
                useCORS: true,
                allowTaint: true,
                logging: false,
                imageTimeout: 0,
                onclone: (document) => {
                    const clonedCanvas = document.getElementById('chart-canvas');
                    if(clonedCanvas) {
                        clonedCanvas.style.width = width + 'px';
                        clonedCanvas.style.height = height + 'px';
                    }
                },
                // 添加高级渲染选项
                canvas: tempCanvas,
                renderCallback: (canvas) => {
                    // 应用锐化效果
                    const ctx = canvas.getContext('2d');
                    ctx.filter = 'contrast(1.1) saturate(1.2)';
                }
            }).then(canvas => {
                // 移除加载指示器
                loadingOverlay.remove();
                
                // 导出图像时使用更高的质量设置
                let imgUrl;
                if (format === 'jpg') {
                    // JPEG使用最高质量
                    imgUrl = canvas.toDataURL('image/jpeg', 1.0);
                } else {
                    // PNG使用无损压缩
                    imgUrl = canvas.toDataURL('image/png');
                }
                
                // 创建下载链接
                const link = document.createElement('a');
                const chartTitle = document.getElementById('chart-title').value || '图表';
                const fileName = `${chartTitle.replace(/[^\w\u4e00-\u9fa5]/g, '_')}_Ultra_HD.${format}`;
                
                link.download = fileName;
                link.href = imgUrl;
                link.click();
                
                showNotification(`已成功导出超高清${format.toUpperCase()}图像`);
            }).catch(error => {
                // 移除加载指示器
                loadingOverlay.remove();
                
                showNotification('导出图像失败，请重试', true);
            });
        }, 100);
    }
    
    // 复制图表到剪贴板
    function copyChartToClipboard() {
        const chartWrapper = document.getElementById('chart-wrapper');
        
        // 创建加载指示器
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        chartWrapper.appendChild(loadingOverlay);
        
        setTimeout(() => {
            html2canvas(document.getElementById('chart-canvas'), {
                backgroundColor: '#ffffff',
                scale: 2
            }).then(canvas => {
                // 移除加载指示器
                loadingOverlay.remove();
                
                canvas.toBlob(blob => {
                    try {
                        // 尝试使用现代API复制到剪贴板
                        if (navigator.clipboard && navigator.clipboard.write) {
                            const clipboardItem = new ClipboardItem({'image/png': blob});
                            navigator.clipboard.write([clipboardItem])
                                .then(() => {
                                    showNotification('图表已复制到剪贴板');
                                })
                                .catch(err => {
                                    legacyCopyToClipboard(canvas);
                                });
                        } else {
                            legacyCopyToClipboard(canvas);
                        }
                    } catch (e) {
                        legacyCopyToClipboard(canvas);
                    }
                });
            }).catch(error => {
                // 移除加载指示器
                loadingOverlay.remove();
                
                showNotification('复制图像失败，请重试', true);
            });
        }, 100);
    }
    
    // 兼容性较好的复制方法（通过创建临时链接）
    function legacyCopyToClipboard(canvas) {
        const imgUrl = canvas.toDataURL('image/png');
        
        // 创建临时链接
        const link = document.createElement('a');
        link.download = '图表.png';
        link.href = imgUrl;
        
        showNotification('已准备下载图表，无法直接复制到剪贴板');
        link.click();
    }
    
    // 解析Excel数据
    function parseExcelData(jsonData) {
        if (!jsonData || jsonData.length < 2 || !jsonData[0] || jsonData[0].length < 2) {
            throw new Error('Excel数据格式不正确，至少需要表头行和数据行');
        }
        
        // 假设第一行为标题，第一列为标签
        const labels = jsonData.slice(1).map(row => row && row[0] ? row[0].toString() : '');
        const datasets = [];

        const headers = jsonData[0].slice(1);
        headers.forEach((header, i) => {
            const data = jsonData.slice(1).map(row => {
                // 确保每个单元格数据都是数值类型
                if (!row || !row[i + 1]) return 0;
                const value = parseFloat(row[i + 1]);
                return isNaN(value) ? 0 : value;
            });
            
            datasets.push({
                label: header ? header.toString() : `系列${i+1}`,
                data: data
            });
        });

        return {
            labels: labels,
            datasets: datasets
        };
    }

    // 从chart-generator.js中导入图表生成函数
    function getChartInstance() {
        return window.chartInstance;
    }

    function setChartInstance(instance) {
        window.chartInstance = instance;
    }

    // 根据数据格式更新图表类型选项
    function updateChartTypeOptions(dataFormat) {
        // 由于移除了图表类型下拉框，这个函数现在仅记录当前数据格式，不再修改任何选项
    }
}); 