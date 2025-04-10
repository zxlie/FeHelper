// 图表实例，方便后续更新
window.chartInstance = null;

// 注册Chart.js插件
if (Chart && Chart.register) {
    // 如果有ChartDataLabels插件，注册它
    if (window.ChartDataLabels) {
        Chart.register(ChartDataLabels);
    }
}

// 生成图表的主函数
function createChart(data, settings) {
    // 获取Canvas元素
    const canvas = document.getElementById('chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // 如果已有图表，先销毁
    if (window.chartInstance) {
        window.chartInstance.destroy();
    }
    
    // 应用颜色方案
    applyColorScheme(data, settings.colorScheme, settings.type);
    
    // 配置图表选项
    const options = getChartOptions(settings);
    
    // 处理特殊图表类型
    let type = settings.type;
    let chartData = {...data};

    // 检查是否为首系列图表类型
    const isFirstSeriesOnly = settings.type.includes(" (首系列)");
    if (isFirstSeriesOnly) {
        // 提取真正的图表类型
        type = settings.type.replace(" (首系列)", "");
        
        // 只保留第一个数据系列
        if (chartData.datasets.length > 1) {
            const firstDataset = chartData.datasets[0];
            chartData.datasets = [{
                ...firstDataset,
                label: firstDataset.label || '数据'
            }];
        }
    }

    // 移除可能存在的旧堆叠设置
    if (options.scales && options.scales.x) {
        delete options.scales.x.stacked;
    }
    if (options.scales && options.scales.y) {
        delete options.scales.y.stacked;
    }

    // 移除旧的填充设置和其他特殊属性
    chartData.datasets.forEach(dataset => {
        delete dataset.fill;
        delete dataset.tension;
        delete dataset.stepped;
        delete dataset.borderDash;
    });

    // 基本图表类型处理
    switch(type) {
        // 柱状图系列
        case 'horizontalBar':
            type = 'bar';
            options.indexAxis = 'y';
            break;
        case 'stackedBar':
            type = 'bar';
            if (!options.scales) options.scales = {};
            if (!options.scales.x) options.scales.x = {};
            if (!options.scales.y) options.scales.y = {};
            options.scales.x.stacked = true;
            options.scales.y.stacked = true;
            break;
        case 'groupedBar':
            type = 'bar';
            // 分组柱状图是默认行为
            break;
        case 'gradientBar':
            type = 'bar';
            // 渐变效果在applyColorScheme函数中处理
            break;
        case 'barWithError':
            type = 'bar';
            // 添加误差线
            chartData.datasets.forEach(dataset => {
                dataset.errorBars = {
                    y: {
                        plus: dataset.data.map(() => Math.random() * 5 + 2),
                        minus: dataset.data.map(() => Math.random() * 5 + 2)
                    }
                };
            });
            break;
        case 'rangeBar':
            type = 'bar';
            // 转换数据为范围格式
            chartData.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(value => {
                    const min = Math.max(0, value - Math.random() * value * 0.4);
                    return [min, value];
                });
            });
            break;
        
        // 线/面积图系列
        case 'area':
            type = 'line';
            chartData.datasets.forEach(dataset => {
                dataset.fill = true;
            });
            break;
        case 'curvedLine':
            type = 'line';
            chartData.datasets.forEach(dataset => {
                dataset.tension = 0.4; // 更平滑的曲线
            });
            break;
        case 'stepLine':
            type = 'line';
            chartData.datasets.forEach(dataset => {
                dataset.stepped = true;
            });
            break;
        case 'stackedArea':
            type = 'line';
            chartData.datasets.forEach(dataset => {
                dataset.fill = true;
            });
            if (!options.scales) options.scales = {};
            if (!options.scales.y) options.scales.y = {};
            options.scales.y.stacked = true;
            break;
        case 'streamgraph':
            type = 'line';
            // 流图效果：堆叠面积图 + 居中对齐
            chartData.datasets.forEach(dataset => {
                dataset.fill = true;
            });
            if (!options.scales) options.scales = {};
            if (!options.scales.y) options.scales.y = {};
            options.scales.y.stacked = true;
            options.scales.y.offset = true; // 居中对齐堆叠
            break;
        case 'timeline':
            type = 'line';
            chartData.datasets.forEach(dataset => {
                dataset.stepped = 'before';
                dataset.borderDash = [5, 5]; // 虚线效果
            });
            break;
        
        // 饼图/环形图系列
        case 'halfPie':
            type = 'doughnut';
            options.circumference = Math.PI;
            options.rotation = -Math.PI / 2;
            break;
        case 'nestedPie':
            type = 'doughnut';
            // 嵌套效果通过多个饼图叠加实现，简化实现仅调整内外半径
            if (chartData.datasets.length > 0) {
                chartData.datasets[0].radius = '70%';
                chartData.datasets[0].weight = 0.7;
            }
            break;
        
        // 散点/气泡图系列
        case 'scatter':
            chartData.datasets = transformScatterData(chartData.datasets);
            break;
        case 'bubble':
            chartData.datasets = transformBubbleData(chartData.datasets);
            type = 'bubble';
            break;
        case 'scatterSmooth':
            chartData.datasets = transformScatterData(chartData.datasets);
            type = 'scatter';
            // 添加趋势线
            chartData.datasets.forEach(dataset => {
                const smoothedDataset = {
                    ...dataset,
                    type: 'line',
                    data: [...dataset.data],
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                };
                chartData.datasets.push(smoothedDataset);
            });
            break;
        
        // 专业图表系列
        case 'funnel':
            type = 'bar';
            // 简化的漏斗图实现
            options.indexAxis = 'y';
            if (chartData.datasets.length > 0) {
                // 对数据进行排序
                const sortedData = [...chartData.datasets[0].data].sort((a, b) => b - a);
                chartData.datasets[0].data = sortedData;
                // 确保Y轴反转
                if (!options.scales) options.scales = {};
                if (!options.scales.y) options.scales.y = {};
                options.scales.y.reverse = true;
            }
            break;
        case 'gauge':
            type = 'doughnut';
            // 简化的仪表盘实现
            if (chartData.datasets.length > 0 && chartData.datasets[0].data.length > 0) {
                const value = chartData.datasets[0].data[0];
                const max = Math.max(...chartData.datasets[0].data) * 1.2;
                const remainder = max - value;
                
                chartData.datasets[0].data = [value, remainder];
                chartData.datasets[0].backgroundColor = ['#36A2EB', '#E0E0E0'];
                chartData.labels = ['Value', ''];
                
                options.circumference = Math.PI;
                options.rotation = -Math.PI;
                options.cutout = '70%';
            }
            break;
        case 'boxplot':
            // 简化的箱线图实现（基于柱状图）
            type = 'bar';
            // 转换数据为箱线图格式
            chartData.datasets.forEach(dataset => {
                dataset.data = dataset.data.map(value => {
                    const q1 = Math.max(0, value * 0.7);
                    const median = value * 0.85;
                    const q3 = value * 1.15;
                    const min = Math.max(0, q1 - (median - q1));
                    const max = q3 + (q3 - median);
                    return [min, q1, median, q3, max];
                });
            });
            break;
        case 'waterfall':
            type = 'bar';
            // 瀑布图实现
            if (chartData.datasets.length > 0) {
                const data = chartData.datasets[0].data;
                let cumulative = 0;
                
                // 创建新的数据数组，包含每个点的起点和终点
                const waterfallData = data.map((value, index) => {
                    const start = cumulative;
                    cumulative += value;
                    return {
                        start: start,
                        end: cumulative,
                        value: value
                    };
                });
                
                // 转换为柱状图数据
                chartData.datasets[0].data = waterfallData.map(d => d.end - d.start);
                
                // 添加起点数据集
                chartData.datasets.push({
                    label: '起点',
                    data: waterfallData.map(d => d.start),
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderColor: 'rgba(0,0,0,0)',
                    stack: 'waterfall'
                });
                
                // 设置为堆叠柱状图
                if (!options.scales) options.scales = {};
                if (!options.scales.x) options.scales.x = {};
                if (!options.scales.y) options.scales.y = {};
                options.scales.x.stacked = true;
                options.scales.y.stacked = true;
            }
            break;
        case 'treemap':
        case 'sunburst':
        case 'sankey':
        case 'chord':
        case 'network':
            // 这些高级图表需要专门的库支持，这里简化为提示信息
            type = 'bar';
            if (chartData.datasets.length > 0) {
                // 显示一个提示信息
                chartData.datasets = [{
                    label: `${settings.type}需要专门的图表库支持`,
                    data: [100],
                    backgroundColor: '#f8d7da'
                }];
                chartData.labels = ['请尝试其他图表类型'];
            }
            break;
    }

    // 热力图特殊处理
    if (type === 'heatmap') {
        // 热力图不是Chart.js的标准类型，需要使用插件或自定义渲染
        // 简单实现一个基于颜色渐变的矩阵图
        type = 'matrix';
        renderHeatmap(ctx, chartData, options);
        return;
    }

    // 饼图、环形图和极地面积图特殊处理 (如果不是由其他类型转换而来的)
    if (['pie', 'doughnut', 'polarArea'].includes(type) && !['halfPie', 'nestedPie', 'gauge'].includes(settings.type) && !isFirstSeriesOnly) {
        // 如果有多个数据集，只取第一个
        if (chartData.datasets.length > 1) {
            const firstDataset = chartData.datasets[0];
            chartData.datasets = [{
                ...firstDataset,
                label: undefined // 这些图表类型不需要数据集标签
            }];
        }
    }

    // 创建图表实例
    window.chartInstance = new Chart(ctx, {
        type: type,
        data: chartData,
        options: options
    });
    
    // 设置标记属性，表示图表已渲染，去除背景
    canvas.setAttribute('data-chart-rendered', 'true');
    
    return window.chartInstance;
}

// 辅助函数：获取当前图表实例
function getChartInstance() {
    return window.chartInstance;
}

// 辅助函数：设置当前图表实例
function setChartInstance(instance) {
    window.chartInstance = instance;
}

// 获取图表配置选项
function getChartOptions(settings) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: !!settings.title,
                text: settings.title,
                font: {
                    size: 18,
                    weight: 'bold'
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            },
            legend: {
                display: settings.legendPosition !== 'none',
                position: settings.legendPosition === 'none' ? 'top' : settings.legendPosition,
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    size: 14
                },
                bodyFont: {
                    size: 13
                },
                padding: 10,
                displayColors: true
            }
        },
        animation: {
            duration: settings.animateChart ? 1000 : 0,
            easing: 'easeOutQuart'
        }
    };
    
    // 检查是否为简单数据模式（只有一个数据集）
    const isSimpleData = settings.isSimpleData || 
                         (window.chartData && window.chartData.datasets && window.chartData.datasets.length === 1);
    
    // 如果是简单数据模式，隐藏图例
    if (isSimpleData) {
        options.plugins.legend.display = false;
    }
    
    // 只有部分图表类型需要轴线配置
    if (!['pie', 'doughnut', 'polarArea'].includes(settings.type.replace(" (首系列)", ""))) { // 兼容(首系列)后缀
        options.scales = {
            x: {
                title: {
                    display: !!settings.xAxisLabel,
                    text: settings.xAxisLabel,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10
                    }
                },
                grid: {
                    display: settings.showGridLines,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 12
                    }
                }
            },
            y: {
                title: {
                    display: !!settings.yAxisLabel,
                    text: settings.yAxisLabel,
                    font: {
                        size: 14,
                        weight: 'bold'
                    },
                    padding: {
                        bottom: 10
                    }
                },
                grid: {
                    display: settings.showGridLines,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    beginAtZero: true
                }
            }
        };
        
        // 水平柱状图X和Y轴配置需要互换
        if (settings.type === 'horizontalBar') {
            const temp = options.scales.x;
            options.scales.x = options.scales.y;
            options.scales.y = temp;
        }
    }
    
    // 数据标签配置
    if (settings.showDataLabels) {
        options.plugins.datalabels = {
            display: true,
            color: function(context) {
                const actualType = settings.type.replace(" (首系列)", "");
                const dataset = context.dataset;
                
                // 首先检查数据集是否有自定义的datalabels配置
                if (dataset.datalabels && dataset.datalabels.color) {
                    const labelColors = dataset.datalabels.color;
                    
                    // 如果color是数组，则使用对应索引的颜色
                    if (Array.isArray(labelColors)) {
                        return labelColors[context.dataIndex] || '#333333';
                    }
                    // 如果color是单个颜色值
                    return labelColors;
                }
                
                // 如果没有自定义配置，则使用智能检测
                // 为饼图和环形图使用对比色
                if (['pie', 'doughnut', 'polarArea'].includes(actualType)) {
                    // 获取背景色
                    const index = context.dataIndex;
                    const backgroundColor = dataset.backgroundColor[index];
                    
                    // 计算背景色的亮度
                    return isColorDark(backgroundColor) ? '#ffffff' : '#000000';
                } else if (actualType === 'bar' || actualType === 'horizontalBar' || 
                           actualType === 'stackedBar' || actualType === 'gradientBar') {
                    // 柱状图系列也需要对比色
                    let backgroundColor;
                    
                    // 背景色可能是数组或单个颜色
                    if (Array.isArray(dataset.backgroundColor)) {
                        backgroundColor = dataset.backgroundColor[context.dataIndex];
                    } else {
                        backgroundColor = dataset.backgroundColor;
                    }
                    
                    return isColorDark(backgroundColor) ? '#ffffff' : '#333333';
                } else {
                    // 其他图表类型使用默认深色
                    return '#333333';
                }
            },
            align: function(context) {
                const dataset = context.dataset;
                // 使用数据集中的align配置（如果有的话）
                if (dataset.datalabels && dataset.datalabels.align) {
                    return dataset.datalabels.align;
                }
                
                // 默认配置
                const chartType = settings.type.replace(" (首系列)", "");
                if (['line', 'area', 'scatter', 'bubble'].includes(chartType)) {
                    return 'top';
                }
                return 'center';
            },
            font: {
                weight: 'bold'
            },
            formatter: function(value, context) {
                const actualType = settings.type.replace(" (首系列)", "");
                
                // 饼图、环形图和极地面积图显示百分比
                if (['pie', 'doughnut', 'polarArea'].includes(actualType)) {
                    // 计算百分比
                    const dataset = context.chart.data.datasets[context.datasetIndex];
                    const total = dataset.data.reduce((total, value) => total + value, 0);
                    const percentage = ((value / total) * 100).toFixed(1) + '%';
                    
                    // 对于较小的扇区只显示百分比，否则显示值和百分比
                    const percent = value / total * 100;
                    if (percent < 5) {
                        return percentage;
                    } else {
                        return `${value} (${percentage})`;
                    }
                }
                
                // 对散点图特殊处理
                if (settings.type === 'scatter') {
                    if (context && context.dataset && context.dataset.data && 
                        context.dataset.data[context.dataIndex] && 
                        typeof context.dataset.data[context.dataIndex].y !== 'undefined') {
                        return context.dataset.data[context.dataIndex].y;
                    }
                    return '';
                }
                
                return value;
            }
        };
    }
    
    return options;
}

// 判断颜色是否为深色
function isColorDark(color) {
    // 处理rgba格式
    if (color && color.startsWith('rgba')) {
        const parts = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (parts) {
            const r = parseInt(parts[1]);
            const g = parseInt(parts[2]);
            const b = parseInt(parts[3]);
            // 计算亮度 (根据人眼对RGB的敏感度加权)
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            return brightness < 0.7; // 亮度小于0.7认为是深色
        }
    }
    
    // 处理rgb格式
    if (color && color.startsWith('rgb(')) {
        const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (parts) {
            const r = parseInt(parts[1]);
            const g = parseInt(parts[2]);
            const b = parseInt(parts[3]);
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
            return brightness < 0.7;
        }
    }
    
    // 处理十六进制格式
    if (color && color.startsWith('#')) {
        color = color.replace('#', '');
        const r = parseInt(color.length === 3 ? color.substring(0, 1).repeat(2) : color.substring(0, 2), 16);
        const g = parseInt(color.length === 3 ? color.substring(1, 2).repeat(2) : color.substring(2, 4), 16);
        const b = parseInt(color.length === 3 ? color.substring(2, 3).repeat(2) : color.substring(4, 6), 16);
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        return brightness < 0.7;
    }
    
    // 默认返回true，使用白色文本
    return true;
}

// 应用颜色方案
function applyColorScheme(data, colorScheme, chartType) {
    // 定义颜色方案 - 全新设计，确保各个方案风格迥异
    const colorSchemes = {
        default: [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#6f42c1', '#fd7e14', '#20c9a6', '#36b9cc', '#858796'
        ],
        pastel: [
            '#FFB6C1', '#FFD700', '#98FB98', '#87CEFA', '#FFA07A',
            '#DDA0DD', '#FFDAB9', '#B0E0E6', '#F0E68C', '#E6E6FA'
        ],
        bright: [
            '#FF1E1E', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF',
            '#FF00FF', '#FF7F00', '#FF1493', '#00FA9A', '#7B68EE'
        ],
        cool: [
            '#5F4B8B', '#42BFDD', '#00A7E1', '#00344B', '#143642',
            '#0F8B8D', '#4CB5F5', '#1D3557', '#A8DADC', '#457B9D'
        ],
        warm: [
            '#FF7700', '#FF9E00', '#FFCF00', '#FFF400', '#E20000',
            '#D91A1A', '#A60000', '#FF5252', '#FF7B7B', '#FFBF69'
        ],
        corporate: [
            '#003F5C', '#2F4B7C', '#665191', '#A05195', '#D45087',
            '#F95D6A', '#FF7C43', '#FFA600', '#004D40', '#00695C'
        ],
        contrast: [
            '#000000', '#E63946', '#457B9D', '#F1C40F', '#2ECC71',
            '#9B59B6', '#1ABC9C', '#F39C12', '#D35400', '#7F8C8D'
        ],
        rainbow: [
            '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF',
            '#4B0082', '#9400D3', '#FF1493', '#00FFFF', '#FF00FF'
        ],
        earth: [
            '#5D4037', '#795548', '#A1887F', '#4E342E', '#3E2723',
            '#33691E', '#558B2F', '#7CB342', '#8D6E63', '#6D4C41'
        ],
        ocean: [
            '#006064', '#00838F', '#0097A7', '#00ACC1', '#00BCD4',
            '#26C6DA', '#4DD0E1', '#80DEEA', '#01579B', '#0277BD'
        ],
        vintage: [
            '#8D8741', '#659DBD', '#DAAD86', '#BC986A', '#FBEEC1',
            '#605B56', '#837A75', '#9E8B8B', '#D8C3A5', '#E8DDCD'
        ]
    };
    
    // 获取选定的颜色方案
    const colors = colorSchemes[colorScheme] || colorSchemes.default;
    
    const actualChartType = chartType.replace(" (首系列)", ""); // 获取基础类型

    // 为每个数据集应用颜色
    data.datasets.forEach((dataset, index) => {
        const color = colors[index % colors.length];
        
        // 设置不同图表类型的颜色
        if (['pie', 'doughnut', 'polarArea', 'halfPie', 'nestedPie', 'gauge'].includes(actualChartType)) {
            // 这些图表类型需要为每个数据点设置不同颜色
            // 对于gauge特殊处理，不使用这种方式
            if (actualChartType === 'gauge' && dataset.backgroundColor) {
                // 保留gauge的特殊颜色设置
            } else {
                dataset.backgroundColor = dataset.data.map((_, i) => colors[i % colors.length]);
                dataset.borderColor = 'white';
                dataset.borderWidth = 1;
                
                // 为每个扇区添加对应的前景色（用于数据标签）
                dataset.datalabels = {
                    color: dataset.backgroundColor.map(bgColor => isColorDark(bgColor) ? '#ffffff' : '#000000')
                };
            }
        } else if (['line', 'area', 'stackedArea', 'curvedLine', 'stepLine', 'timeline', 'streamgraph'].includes(actualChartType)) {
            // 折线图和面积图样式
            dataset.borderColor = color;
            // 根据图表类型调整透明度
            let alpha = 0.1; // 默认折线图半透明
            if (['area', 'stackedArea', 'streamgraph'].includes(actualChartType)) {
                alpha = 0.3; // 面积图相对更不透明
            }
            dataset.backgroundColor = hexToRgba(color, alpha);
            dataset.pointBackgroundColor = color;
            dataset.pointBorderColor = '#fff';
            dataset.pointHoverBackgroundColor = '#fff';
            dataset.pointHoverBorderColor = color;
            
            // 特殊线型
            if (actualChartType === 'curvedLine') {
                dataset.tension = 0.4;
            } else if (actualChartType === 'stepLine') {
                dataset.stepped = true;
            } else if (actualChartType === 'timeline') {
                dataset.stepped = 'before';
                dataset.borderDash = [5, 5];
            } else {
                dataset.tension = 0.3; 
            }
            
            // 设置数据标签颜色
            // 对于线图和面积图，标签通常放在点的上方，使用与线条相同的颜色
            dataset.datalabels = {
                color: isColorDark(color) ? color : '#333333',
                align: 'top'
            };
        } else if (actualChartType === 'radar') {
            // 雷达图样式
            dataset.borderColor = color;
            dataset.backgroundColor = hexToRgba(color, 0.2);
            dataset.pointBackgroundColor = color;
            dataset.pointBorderColor = '#fff';
            
            // 雷达图数据标签颜色 - 使用与边框相同的颜色
            dataset.datalabels = {
                color: isColorDark(color) ? color : '#333333'
            };
        } else if (['scatter', 'bubble', 'scatterSmooth'].includes(actualChartType)) {
            // 散点图样式
            dataset.backgroundColor = color;
            dataset.borderColor = hexToRgba(color, 0.8);
            
            // 散点平滑图特殊处理
            if (actualChartType === 'scatterSmooth' && dataset.type === 'line') {
                dataset.borderColor = color;
                dataset.backgroundColor = 'transparent';
            }
            
            // 散点图数据标签颜色
            dataset.datalabels = {
                color: isColorDark(color) ? '#ffffff' : '#333333',
                align: 'top'
            };
        } else if (actualChartType === 'gradientBar') {
            // 渐变柱状图
            const ctx = document.createElement('canvas').getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, hexToRgba(color, 0.3));
            dataset.backgroundColor = gradient;
            dataset.borderColor = color;
            dataset.borderWidth = 1;
            dataset.hoverBackgroundColor = color;
            
            // 渐变柱状图标签颜色 - 使用顶部颜色判断
            dataset.datalabels = {
                color: isColorDark(color) ? '#ffffff' : '#333333'
            };
        } else if (actualChartType === 'waterfall') {
            // 瀑布图特殊处理
            if (dataset.label === '起点') {
                // 这是为瀑布图添加的起点数据集，保持透明
            } else {
                const values = dataset.data;
                // 根据值的正负设置不同颜色
                const positiveColor = '#36b9cc';
                const negativeColor = '#e74a3b';
                
                dataset.backgroundColor = values.map(value => 
                    value >= 0 ? hexToRgba(positiveColor, 0.7) : hexToRgba(negativeColor, 0.7)
                );
                dataset.borderColor = values.map(value => 
                    value >= 0 ? positiveColor : negativeColor
                );
                dataset.borderWidth = 1;
                
                // 瀑布图数据标签颜色 - 根据每个柱子的背景色决定
                dataset.datalabels = {
                    color: values.map(value => 
                        value >= 0 ? (isColorDark(positiveColor) ? '#ffffff' : '#333333') : 
                                    (isColorDark(negativeColor) ? '#ffffff' : '#333333')
                    )
                };
            }
        } else if (actualChartType === 'funnel') {
            // 漏斗图特殊处理 - 使用渐变颜色
            const data = dataset.data;
            if (data.length) {
                dataset.backgroundColor = data.map((_, i) => {
                    const ratio = 1 - (i / data.length); // 1 到 0
                    return hexToRgba(color, 0.5 + ratio * 0.5); // 透明度从1到0.5
                });
                dataset.borderColor = color;
                dataset.borderWidth = 1;
                
                // 漏斗图数据标签颜色 - 根据每个部分的背景色决定
                dataset.datalabels = {
                    color: dataset.backgroundColor.map(bgColor => isColorDark(bgColor) ? '#ffffff' : '#333333')
                };
            }
        } else {
            // 默认样式（用于柱状图等）
            dataset.backgroundColor = hexToRgba(color, 0.7);
            dataset.borderColor = color;
            dataset.borderWidth = 1;
            dataset.hoverBackgroundColor = color;
            
            // 默认数据标签颜色 - 根据背景色决定
            dataset.datalabels = {
                color: isColorDark(dataset.backgroundColor) ? '#ffffff' : '#333333'
            };
        }
    });
}

// 将十六进制颜色转换为rgba格式
function hexToRgba(hex, alpha) {
    // 移除井号
    hex = hex.replace('#', '');
    
    // 解析RGB值
    const r = parseInt(hex.length === 3 ? hex.substring(0, 1).repeat(2) : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex.substring(1, 2).repeat(2) : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex.substring(2, 3).repeat(2) : hex.substring(4, 6), 16);
    
    // 返回rgba字符串
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 渲染热力图（自定义实现）
function renderHeatmap(ctx, data, options) {
    // 清除Canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 设置尺寸和边距
    const margin = {
        top: 50,
        right: 30,
        bottom: 50,
        left: 60
    };
    
    const width = ctx.canvas.width - margin.left - margin.right;
    const height = ctx.canvas.height - margin.top - margin.bottom;
    
    // 获取数据
    const rows = data.labels;
    const columns = data.datasets.map(dataset => dataset.label);
    
    // 创建值矩阵
    const matrix = [];
    rows.forEach((_, rowIndex) => {
        const row = [];
        data.datasets.forEach(dataset => {
            row.push(dataset.data[rowIndex]);
        });
        matrix.push(row);
    });
    
    // 找出最大值和最小值
    const allValues = matrix.flat();
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // 绘制标题
    if (options.plugins && options.plugins.title && options.plugins.title.display) {
        ctx.textAlign = 'center';
        ctx.font = '18px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText(options.plugins.title.text, ctx.canvas.width / 2, 25);
    }
    
    // 绘制单元格和标签
    const cellWidth = width / columns.length;
    const cellHeight = height / rows.length;
    
    // 行标签（Y轴）
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    
    rows.forEach((label, i) => {
        const y = margin.top + i * cellHeight + cellHeight / 2;
        ctx.fillText(label, margin.left - 10, y);
    });
    
    // 列标签（X轴）
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    columns.forEach((label, i) => {
        const x = margin.left + i * cellWidth + cellWidth / 2;
        ctx.fillText(label, x, margin.top + height + 10);
    });
    
    // 绘制热力图单元格
    matrix.forEach((row, i) => {
        row.forEach((value, j) => {
            // 归一化值 (0-1)
            const normalizedValue = (value - min) / (max - min || 1);
            
            // 计算颜色（红-黄-绿渐变）
            const color = getHeatmapColor(normalizedValue);
            
            // 绘制单元格
            const x = margin.left + j * cellWidth;
            const y = margin.top + i * cellHeight;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellWidth, cellHeight);
            
            // 添加值标签，根据背景色的亮度自动选择标签颜色
            const brightness = getColorBrightness(color);
            ctx.fillStyle = brightness < 0.7 ? 'white' : 'black'; // 亮度阈值为0.7
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(value, x + cellWidth / 2, y + cellHeight / 2);
        });
    });
    
    // 绘制坐标轴
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // X轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + height);
    ctx.lineTo(margin.left + width, margin.top + height);
    ctx.stroke();
    
    // Y轴
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + height);
    ctx.stroke();
}

// 获取颜色亮度
function getColorBrightness(color) {
    // 处理rgb格式
    if (color.startsWith('rgb(')) {
        const parts = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (parts) {
            const r = parseInt(parts[1]);
            const g = parseInt(parts[2]);
            const b = parseInt(parts[3]);
            // 计算亮度 (根据人眼对RGB的敏感度加权)
            return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        }
    }
    
    // 默认返回0.5
    return 0.5;
}

// 获取热力图颜色
function getHeatmapColor(value) {
    // 红-黄-绿渐变
    const r = value < 0.5 ? 255 : Math.round(255 * (1 - 2 * (value - 0.5)));
    const g = value < 0.5 ? Math.round(255 * (2 * value)) : 255;
    const b = 0;
    
    return `rgb(${r}, ${g}, ${b})`;
}

// 注册Chart.js插件以支持数据标签
Chart.register({
    id: 'datalabels',
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        const options = chart.options.plugins.datalabels;
        
        if (!options || !options.display) {
            return;
        }
        
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            
            meta.data.forEach((element, index) => {
                // 获取值
                let value = dataset.data[index];
                if (typeof value === 'object' && value !== null) {
                    // 散点图等复杂数据结构
                    value = value.y;
                }
                
                // 获取位置
                const { x, y } = element.getCenterPoint();
                
                // 确定文本颜色
                let fillColor;
                if (typeof options.color === 'function') {
                    fillColor = options.color({
                        datasetIndex, 
                        index, 
                        dataset,
                        dataIndex: index,
                        chart: chart
                    });
                } else {
                    fillColor = options.color || '#666';
                }
                
                ctx.fillStyle = fillColor;
                
                // 设置字体
                ctx.font = options.font.weight + ' 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 格式化值
                let text = typeof options.formatter === 'function' 
                    ? options.formatter(value, {
                        datasetIndex, 
                        index, 
                        dataset,
                        dataIndex: index,
                        chart: chart
                      }) 
                    : value;
                
                // 绘制文本
                ctx.fillText(text, x, y - 15);
            });
        });
    }
});

// 辅助函数：转换散点图数据
function transformScatterData(datasets) {
    return datasets.map(dataset => {
        if (!dataset.data || !Array.isArray(dataset.data)) {
            return {
                ...dataset,
                data: []
            };
        }
        
        return {
            ...dataset,
            data: dataset.data.map((value, index) => {
                // 确保value是一个有效的数值
                const y = parseFloat(value);
                if (isNaN(y)) {
                    return { x: index + 1, y: 0 };
                }
                return { x: index + 1, y: y };
            })
        };
    });
}

// 辅助函数：转换气泡图数据
function transformBubbleData(datasets) {
    return datasets.map(dataset => {
        if (!dataset.data || !Array.isArray(dataset.data)) {
            return {
                ...dataset,
                data: []
            };
        }
        
        return {
            ...dataset,
            data: dataset.data.map((value, index) => {
                // 确保value是一个有效的数值
                const y = parseFloat(value);
                if (isNaN(y)) {
                    return { x: index + 1, y: 0, r: 5 };
                }
                // 气泡大小与值成比例
                const r = Math.max(5, Math.min(20, y / 10));
                return { x: index + 1, y: y, r: r };
            })
        };
    });
}

/**
 * 初始化图表类型预览画廊
 */
function initChartTypeGallery() {
    // 获取所有图表类型预览项
    const chartTypeItems = document.querySelectorAll('.chart-type-item');
    
    // 获取图表类型选择下拉框
    const chartTypeSelect = document.getElementById('chart-type');
    
    // 为每个预览项添加点击事件
    chartTypeItems.forEach(item => {
        item.addEventListener('click', function() {
            // 获取图表类型值
            const chartType = this.getAttribute('data-chart-type');
            
            // 设置下拉框的值
            chartTypeSelect.value = chartType;
            
            // 触发change事件以更新图表
            const event = new Event('change');
            chartTypeSelect.dispatchEvent(event);
            
            // 更新活动状态
            chartTypeItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // 如果已经有图表实例，立即生成图表
            if (window.chartInstance) {
                // 假设generateChart是全局函数
                if (typeof window.generateChart === 'function') {
                    window.generateChart();
                }
            }
        });
    });
    
    // 初始化时设置当前选中的图表类型为活动状态
    const currentChartType = chartTypeSelect.value;
    const activeItem = document.querySelector(`.chart-type-item[data-chart-type="${currentChartType}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // 当下拉框选择变化时，同步更新活动预览项
    chartTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        chartTypeItems.forEach(item => {
            if (item.getAttribute('data-chart-type') === selectedType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
} 