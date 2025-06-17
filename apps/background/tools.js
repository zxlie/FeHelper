let toolMap = {
    'json-format': {
        name: 'JSON美化工具',
        tips: '页面自动检测并格式化、手动格式化、乱码解码、排序、BigInt、编辑、下载、皮肤定制等',
        contentScriptJs: true,
        contentScriptCss: true,
        systemInstalled: true,
        menuConfig: [{
            icon: '⒥',
            text: 'JSON格式化',
            contexts: ['page', 'selection', 'editable']
        }]
    },
    'json-diff': {
        name: 'JSON比对工具',
        tips: '支持两个JSON内容的自动键值比较，并高亮显示差异点，同时也能判断JSON是否合法',
        menuConfig: [{
            icon: '☷',
            text: 'JSON比对器'
        }]
    },
    'qr-code': {
        name: '二维码/解码',
        tips: '支持自定义颜色和icon的二维码生成器，并且支持多种模式的二维码解码，包括截图后粘贴解码',
        contentScriptJs: true,
        menuConfig: [{
            icon: '▣',
            text: '二维码生成器',
            contexts: ['page', 'selection', 'editable', 'link', 'image']
        }, {
            icon: '◈',
            text: '二维码解码器',
            contexts: ['image']
        }]
    },
    'image-base64': {
        name: '图片转Base64',
        tips: '支持多种模式的图片转Base64格式，比如链接粘贴/截图粘贴等，也支持Base64数据逆转图片',
        menuConfig: [{
            icon: '▤',
            text: '图片与base64',
            contexts: ['image']
        }]
    },
    'en-decode': {
        name: '信息编码转换',
        tips: '支持多格式的信息编解码，如Unicode、UTF-8、UTF-16、URL、Base64、MD5、Hex、Gzip等',
        menuConfig: [{
            icon: '♨',
            text: '字符串编解码',
            contexts: ['page', 'selection', 'editable']
        }]
    },
    'code-beautify': {
        name: '代码美化工具',
        tips: '支持多语言的代码美化，包括 Javascript、CSS、HTML、XML、SQL，且会陆续支持更多格式',
        contentScriptJs: true,
        contentScriptCss: true,
        menuConfig: [{
            icon: '✡',
            text: '代码美化工具',
            contexts: ['page', 'selection', 'editable']
        }]
    },
    'code-compress': {
        name: '代码压缩工具',
        tips: 'Web开发用，提供简单的代码压缩功能，支持HTML、Javascript、CSS代码压缩',
        menuConfig: [{
            icon: '♯',
            text: '代码压缩工具'
        }]
    },
    'aiagent': {
        name: 'AI(智能助手)',
        tips: '由AI强力支撑的超智能对话工具，可以让它帮你写代码、改代码、做方案设计、查资料、做分析等',
        menuConfig: [{
            icon: '֍',
            text: 'AI(智能助手)'
        }]
    },
    'timestamp': {
        name: '时间(戳)转换',
        tips: '本地化时间与时间戳之间的相互转换，支持秒/毫秒、支持世界时区切换、各时区时钟展示等',
        menuConfig: [{
            icon: '♖',
            text: '时间(戳)转换'
        }]
    },
    'password': {
        name: '随机密码生成',
        tips: '将各种字符进行随机组合生成密码，可以由数字、大小写字母、特殊符号组成，支持指定长度',
        menuConfig: [{
            icon: '♆',
            text: '随机密码生成'
        }]
    },
    'sticky-notes': {
        name: '我的便签笔记',
        tips: '方便快捷的浏览器便签笔记工具，支持创建目录对笔记进行分类管理，笔记支持一键导出/导入',
        menuConfig: [{
            icon: '✐',
            text: '我的便签笔记'
        }]
    },
    'html2markdown': {
        name: 'Markdown转换',
        tips: 'Markdown编写/预览工具，支持HTML片段直接转Markdown，支持将内容以PDF格式进行下载',
        menuConfig: [{
            icon: 'ⓜ',
            text: 'markown工具'
        }]
    },
    'postman': {
        name: '简易Postman',
        tips: '开发过程中的接口调试工具，支持GET/POST/HEAD请求方式，且支持JSON内容自动格式化',
        menuConfig: [{
            icon: '☯',
            text: '简易Postman'
        }]
    },
    'websocket': {
        name: 'Websocket工具',
        tips: '支持对Websocket接口的抓包测试，包括ws服务的连接测试、消息发送测试、结果分析等',
        menuConfig: [{
            icon: 'ⓦ',
            text: 'Websocket工具'
        }]
    },
    'regexp': {
        name: '正则公式速查',
        tips: '支持 JavaScript / Python / PHP / Java 等语言的正则速查，包含验证类、提取类、替换类、格式化类、特殊字符类、编程相关等常用正则表达式',
        menuConfig: [{
            icon: '✙',
            text: '正则公式速查'
        }]
    },
    'trans-radix': {
        name: '进制转换工具',
        tips: '支持2进制到36进制数据之间的任意转换，比如：10进制转2进制，8进制转16进制，等等',
        menuConfig: [{
            icon: '❖',
            text: '进制转换工具'
        }]
    },
    'trans-color': {
        name: '颜色转换工具',
        tips: '支持HEX颜色到RGB格式的互转，比如HEX颜色「#43ad7f」转RGB后为「rgb(67, 173, 127)」',
        menuConfig: [{
            icon: '▶',
            text: '颜色转换工具'
        }]
    },
    'crontab': {
        name: 'Crontab工具',
        tips: '一个简易的Crontab生成工具，支持随机生成Demo，编辑过程中，分时日月周会高亮提示',
        menuConfig: [{
            icon: '½',
            text: 'Crontab工具'
        }]
    },
    'loan-rate': {
        name: '贷(还)款利率',
        tips: '贷款或还款利率的计算器，按月呈现还款计划；并支持按还款额反推贷款实际利率',
        menuConfig: [{
            icon: '$',
            text: '贷(还)款利率'
        }]
    },
    'devtools': {
        name: 'FH开发者工具',
        tips: '以开发平台的思想，FeHelper支持用户进行本地开发，将自己的插件功能集成进FH工具市场',
        menuConfig: [{
            icon: '㉿',
            text: 'FH开发者工具'
        }]
    },
    'page-monkey': {
        name: '网页油猴工具',
        tips: '自行配置页面匹配规则、编写Hack脚本，实现网页Hack，如页面自动刷新、自动抢票等',
        contentScriptJs: true,
        menuConfig: [{
            icon: '♀',
            text: '网页油猴工具'
        }]
    },
    'screenshot': {
        name: '网页截屏工具',
        tips: '可对任意网页进行截屏，支持可视区域截屏、全网页滚动截屏，最终结果可预览后再保存',
        contentScriptJs: true,
        noPage: true,
        menuConfig: [{
            icon: '✂',
            text: '网页截屏工具'
        }]
    },
    'color-picker': {
        name: '页面取色工具',
        tips: '可直接在网页上针对任意元素进行色值采集，将光标移动到需要取色的位置，单击确定即可',
        contentScriptJs: true,
        noPage: true,
        menuConfig: [{
            icon: '✑',
            text: '页面取色工具'
        }]
    },
    'naotu': {
        name: '便捷思维导图',
        tips: '轻量便捷，随想随用，支持自动保存、本地数据存储、批量数据导入导出、图片格式下载等',
        menuConfig: [{
            icon: 'Ψ',
            text: '便捷思维导图'
        }]
    },
    'grid-ruler': {
        name: '网页栅格标尺',
        tips: 'Web开发用，横竖两把尺子，以10px为单位，用以检测&校准当前网页的栅格对齐率',
        contentScriptJs: true,
        contentScriptCss: true,
        noPage: true,
        menuConfig: [{
            icon: 'Ⅲ',
            text: '网页栅格标尺'
        }]
    },
    'page-timing': {
        name: '网站性能优化',
        tips: '全面分析网页性能指标，包括核心Web指标(LCP/FID/CLS)、资源加载性能、内存使用、长任务监控等，并提供针对性的优化建议',
        contentScriptJs: true,
        noPage: true,
        menuConfig: [{
            icon: 'Σ',
            text: '网站性能优化'
        }]
    },
    'excel2json': {
        name: 'Excel转JSON',
        tips: '将Excel或CVS中的数据，直接转换成为结构化数据，如JSON、XML、MySQL、PHP等（By @hpng）',
        menuConfig: [{
            icon: 'Ⓗ',
            text: 'Excel转JSON'
        }]
    },
    'chart-maker': {
        name: '图表制作工具',
        tips: '快速制作各类数据可视化图表，支持柱状图、折线图、饼图等多种图表类型，可导出为图片格式',
        menuConfig: [{
            icon: '📊',
            text: '图表制作工具'
        }]
    },
    'svg-converter': {
        name: 'SVG转为图片',
        tips: '支持SVG文件转换为PNG、JPG、WEBP等格式，可自定义输出尺寸，支持文件拖放和URL导入',
        menuConfig: [{
            icon: '⇲',
            text: 'SVG转图片工具'
        }]
    },
    'poster-maker': {
        name: '海报快速生成',
        tips: '快速创建营销推广海报，支持朋友圈、小红书等多种模板，可自定义文字、图片和配色',
        menuConfig: [{
            icon: '🖼️',
            text: '海报快速生成'
        }]
    },
    'datetime-calc': {
        name: '时间戳计算器',
        tips: '支持多种时间格式解析、批量转换、时区转换、数据库格式生成等高级时间处理功能',
        menuConfig: [{
            icon: '⏱️',
            text: '时间戳计算器',
            contexts: ['page', 'selection', 'editable']
        }]
    }
};

// 判断是否为Firefox浏览器，如果是则移除特定工具
if (navigator.userAgent.indexOf('Firefox') !== -1) {
    delete toolMap['color-picker'];
    delete toolMap['postman'];
    delete toolMap['devtools'];
    delete toolMap['websocket'];
    delete toolMap['page-timing'];
    delete toolMap['grid-ruler'];
    delete toolMap['naotu'];
    delete toolMap['screenshot'];
    delete toolMap['page-monkey'];
    delete toolMap['excel2json'];
}

export default toolMap;