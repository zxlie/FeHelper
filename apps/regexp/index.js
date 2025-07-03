// 正则表达式数据库
const regexDatabase = {
    // 验证类
    'email': {
        title: '邮箱验证',
        category: '验证类',
        description: '验证电子邮箱地址的合法性，支持@前的各种字符组合，@后必须是域名格式',
        patterns: {
            javascript: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
            python: 'r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"',
            php: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
            java: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        }
    },
    'phone': {
        title: '手机号验证',
        category: '验证类',
        description: '验证中国大陆手机号码，支持最新号段',
        patterns: {
            javascript: '/^1[3-9]\\d{9}$/',
            python: 'r"^1[3-9]\\d{9}$"',
            php: '/^1[3-9]\\d{9}$/',
            java: '^1[3-9]\\d{9}$'
        }
    },
    'tel': {
        title: '固定电话验证',
        category: '验证类',
        description: '验证固定电话号码，支持区号+号码的格式',
        patterns: {
            javascript: '/^(0\\d{2,3}-?)?\\d{7,8}$/',
            python: 'r"^(0\\d{2,3}-?)?\\d{7,8}$"',
            php: '/^(0\\d{2,3}-?)?\\d{7,8}$/',
            java: '^(0\\d{2,3}-?)?\\d{7,8}$'
        }
    },
    'password': {
        title: '密码强度验证',
        category: '验证类',
        description: '密码必须包含大小写字母、数字和特殊字符，长度8-16位',
        patterns: {
            javascript: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
            python: 'r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$"',
            php: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
            java: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'
        }
    },
    'qq': {
        title: 'QQ号验证',
        category: '验证类',
        description: '验证QQ号，必须是5-11位数字，首位不能为0',
        patterns: {
            javascript: '/^[1-9][0-9]{4,10}$/',
            python: 'r"^[1-9][0-9]{4,10}$"',
            php: '/^[1-9][0-9]{4,10}$/',
            java: '^[1-9][0-9]{4,10}$'
        }
    },
    'postal': {
        title: '邮政编码验证',
        category: '验证类',
        description: '验证中国邮政编码，6位数字',
        patterns: {
            javascript: '/^\\d{6}$/',
            python: 'r"^\\d{6}$"',
            php: '/^\\d{6}$/',
            java: '^\\d{6}$'
        }
    },
    'account': {
        title: '账号验证',
        category: '验证类',
        description: '验证账号，字母开头，允许5-16位，字母数字下划线组合',
        patterns: {
            javascript: '/^[a-zA-Z]\\w{4,15}$/',
            python: 'r"^[a-zA-Z]\\w{4,15}$"',
            php: '/^[a-zA-Z]\\w{4,15}$/',
            java: '^[a-zA-Z]\\w{4,15}$'
        }
    },
    'url': {
        title: 'URL验证',
        category: '验证类',
        description: '验证URL地址的合法性，支持http、https协议，可选端口、路径、参数、锚点，支持localhost和IP地址',
        patterns: {
            javascript: '/^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$/i',
            python: 'r"(https?:\/\/)?((([\w-]+\.)+[\w-]+|localhost|\d{1,3}(?:\.\d{1,3}){3}))(\:\d{1,5})?(\/[^s?#]*)?(\?[^s#]*)?(#[^s]*)?$"',
            php: '/^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$/i',
            java: '^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$'
        }
    },
    'idcard': {
        title: '身份证验证',
        category: '验证类',
        description: '验证中国大陆居民身份证号码，支持18位',
        patterns: {
            javascript: '/^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9X]$/',
            python: 'r"^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9X]$"',
            php: '/^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9X]$/',
            java: '^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9X]$'
        }
    },
    'ipv4': {
        title: 'IPv4地址验证',
        category: '验证类',
        description: '验证IPv4地址格式',
        patterns: {
            javascript: '/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
            python: 'r"^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"',
            php: '/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
            java: '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
        }
    },
    'date': {
        title: '日期验证',
        category: '验证类',
        description: '验证日期格式（YYYY-MM-DD）',
        patterns: {
            javascript: '/^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/',
            python: 'r"^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$"',
            php: '/^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$/',
            java: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$'
        }
    },

    // 提取类
    'html-tag': {
        title: 'HTML标签提取',
        category: '提取类',
        description: '提取HTML标签及其内容',
        patterns: {
            javascript: '/<([a-z][a-z0-9]*)[^>]*>.*?<\\/\\1>/gi',
            python: 'r"<([a-z][a-z0-9]*)[^>]*>.*?</\\1>"',
            php: '/<([a-z][a-z0-9]*)[^>]*>.*?<\\/\\1>/i',
            java: '<([a-z][a-z0-9]*)[^>]*>.*?</\\1>'
        }
    },
    'img-url': {
        title: '图片URL提取',
        category: '提取类',
        description: '提取HTML中的图片URL',
        patterns: {
            javascript: '/<img[^>]+src="([^">]+)"/gi',
            python: 'r"<img[^>]+src=\\"([^\\">]+)\\""',
            php: '/<img[^>]+src="([^">]+)"/i',
            java: '<img[^>]+src="([^">]+)"'
        }
    },
    'chinese': {
        title: '中文字符提取',
        category: '提取类',
        description: '提取中文字符',
        patterns: {
            javascript: '/[\\u4e00-\\u9fa5]/g',
            python: 'r"[\\u4e00-\\u9fa5]"',
            php: '/[\\x{4e00}-\\x{9fa5}]/u',
            java: '[\\u4e00-\\u9fa5]'
        }
    },
    'numbers': {
        title: '数字提取',
        category: '提取类',
        description: '提取字符串中的数字',
        patterns: {
            javascript: '/\\d+(\\.\\d+)?/g',
            python: 'r"\\d+(\\.\\d+)?"',
            php: '/\\d+(\\.\\d+)?/',
            java: '\\d+(\\.\\d+)?'
        }
    },
    'email-extract': {
        title: '邮箱地址提取',
        category: '提取类',
        description: '提取文本中的邮箱地址',
        patterns: {
            javascript: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g',
            python: 'r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"',
            php: '/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/',
            java: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
        }
    },
    'color-hex': {
        title: '颜色值提取',
        category: '提取类',
        description: '提取16进制颜色值，支持3位和6位格式',
        patterns: {
            javascript: '/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g',
            python: 'r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})"',
            php: '/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/i',
            java: '#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})'
        }
    },
    'ip-extract': {
        title: 'IP地址提取',
        category: '提取类',
        description: '提取IPv4地址',
        patterns: {
            javascript: '/\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/g',
            python: 'r"\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b"',
            php: '/\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/',
            java: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b'
        }
    },

    // 替换类
    'trim': {
        title: '去除首尾空格',
        category: '替换类',
        description: '去除字符串首尾的空白字符',
        patterns: {
            javascript: '/^\\s+|\\s+$/g',
            python: 'r"^\\s+|\\s+$"',
            php: '/^\\s+|\\s+$/',
            java: '^\\s+|\\s+$'
        }
    },
    'remove-html': {
        title: '去除HTML标签',
        category: '替换类',
        description: '去除文本中的HTML标签',
        patterns: {
            javascript: '/<[^>]*>/g',
            python: 'r"<[^>]*>"',
            php: '/<[^>]*>/',
            java: '<[^>]*>'
        }
    },
    'camelcase': {
        title: '驼峰命名转换',
        category: '替换类',
        description: '将下划线命名转换为驼峰命名',
        patterns: {
            javascript: '/_([a-z])/g',
            python: 'r"_([a-z])"',
            php: '/_([a-z])/',
            java: '_([a-z])'
        }
    },
    'remove-script': {
        title: '去除Script标签',
        category: '替换类',
        description: '去除HTML中的script标签及其内容',
        patterns: {
            javascript: '/<script[^>]*>[\\s\\S]*?<\\/script>/gi',
            python: 'r"<script[^>]*>[\\s\\S]*?</script>"',
            php: '/<script[^>]*>[\\s\\S]*?<\\/script>/i',
            java: '<script[^>]*>[\s\S]*?</script>'
        }
    },
    'remove-space': {
        title: '去除多余空格',
        category: '替换类',
        description: '将多个连续空格替换为单个空格',
        patterns: {
            javascript: '/\\s+/g',
            python: 'r"\\s+"',
            php: '/\\s+/',
            java: '\\s+'
        }
    },
    'remove-comment': {
        title: '去除注释',
        category: '替换类',
        description: '去除JavaScript单行和多行注释',
        patterns: {
            javascript: '/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$/gm',
            python: 'r"#.*$"',
            php: '/\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$/m',
            java: '\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$'
        }
    },
    // 补全缺失项（占位符）
    'number': {
        title: '数字验证',
        category: '验证类',
        description: '验证是否为数字',
        patterns: {
            javascript: '/^\\d+$/',
            python: 'r"^\\d+$"',
            php: '/^\\d+$/',
            java: '^\\d+$'
        }
    },
    'number-n-digits': {
        title: 'n位数字验证',
        category: '验证类',
        description: '验证是否为n位数字',
        patterns: {
            javascript: '/^\\d{n}$/',
            python: 'r"^\\d{n}$"',
            php: '/^\\d{n}$/',
            java: '^\\d{n}$'
        }
    },
    'number-min-n-digits': {
        title: '至少n位数字验证',
        category: '验证类',
        description: '验证是否为至少n位数字',
        patterns: {
            javascript: '/^\\d{n,}$/',
            python: 'r"^\\d{n,}$"',
            php: '/^\\d{n,}$/',
            java: '^\\d{n,}$'
        }
    },
    'number-range-digits': {
        title: '数字位数范围验证',
        category: '验证类',
        description: '验证数字位数范围',
        patterns: {
            javascript: '/^\\d{m,n}$/',
            python: 'r"^\\d{m,n}$"',
            php: '/^\\d{m,n}$/',
            java: '^\\d{m,n}$'
        }
    },
    'decimal': {
        title: '小数验证',
        category: '验证类',
        description: '验证小数',
        patterns: {
            javascript: '/^\\d+\\.\\d+$/',
            python: 'r"^\\d+\\.\\d+$"',
            php: '/^\\d+\\.\\d+$/',
            java: '^\\d+\\.\\d+$'
        }
    },
    'integer': {
        title: '整数验证',
        category: '验证类',
        description: '验证整数',
        patterns: {
            javascript: '/^-?\\d+$/',
            python: 'r"^-?\\d+$"',
            php: '/^-?\\d+$/',
            java: '^-?\\d+$'
        }
    },
    'chinese-name': {
        title: '中文姓名验证',
        category: '验证类',
        description: '验证中文姓名',
        patterns: {
            javascript: '/^[\\u4e00-\\u9fa5]{2,}$/',
            python: 'r"^[\\u4e00-\\u9fa5]{2,}$"',
            php: '/^[\\x{4e00}-\\x{9fa5}]{2,}$/u',
            java: '^[\\u4e00-\\u9fa5]{2,}$'
        }
    },
    'english-name': {
        title: '英文姓名验证',
        category: '验证类',
        description: '验证英文姓名',
        patterns: {
            javascript: '/^[A-Za-z\\s]+$/',
            python: 'r"^[A-Za-z\\s]+$"',
            php: '/^[A-Za-z\\s]+$/',
            java: '^[A-Za-z\\s]+$'
        }
    },
    'username': {
        title: '用户名验证',
        category: '验证类',
        description: '验证用户名',
        patterns: {
            javascript: '/^[a-zA-Z0-9_]{4,16}$/',
            python: 'r"^[a-zA-Z0-9_]{4,16}$"',
            php: '/^[a-zA-Z0-9_]{4,16}$/',
            java: '^[a-zA-Z0-9_]{4,16}$'
        }
    },
    'password-strong': {
        title: '强密码验证',
        category: '验证类',
        description: '强密码（8-16位，含大小写字母、数字、特殊字符）',
        patterns: {
            javascript: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
            python: 'r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$"',
            php: '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$/',
            java: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'
        }
    },
    'mac-address': {
        title: 'MAC地址验证',
        category: '验证类',
        description: '验证MAC地址',
        patterns: {
            javascript: '/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/',
            python: 'r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"',
            php: '/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/',
            java: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
        }
    },
    'hex-color': {
        title: '16进制颜色验证',
        category: '验证类',
        description: '验证16进制颜色',
        patterns: {
            javascript: '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/',
            python: 'r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"',
            php: '/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/',
            java: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$'
        }
    },
    'version-number': {
        title: '版本号验证',
        category: '验证类',
        description: '验证版本号格式',
        patterns: {
            javascript: '/^\\d+\\.\\d+\\.\\d+$/',
            python: 'r"^\\d+\\.\\d+\\.\\d+$"',
            php: '/^\\d+\\.\\d+\\.\\d+$/',
            java: '^\\d+\\.\\d+\\.\\d+$'
        }
    },
    'link-extract': {
        title: '链接提取',
        category: '提取类',
        description: '提取文本中的链接',
        patterns: {
            javascript: '/https?:\\/\\/[^\\s]+/g',
            python: 'r"https?:\\/\\/[^\\s]+"',
            php: '/https?:\\/\\/[^\\s]+/g',
            java: 'https?:\\/\\/[^\\s]+'
        }
    },
    // 格式化类
    'money': {
        title: '金额格式化',
        category: '格式化类',
        description: '匹配金额（保留两位小数）',
        patterns: {
            javascript: '/^\\d+(?:\\.\\d{1,2})?$/',
            python: 'r"^\\d+(?:\\.\\d{1,2})?$"',
            php: '/^\\d+(?:\\.\\d{1,2})?$/',
            java: '^\\d+(?:\\.\\d{1,2})?$'
        }
    },
    'phone-format': {
        title: '手机号格式化',
        category: '格式化类',
        description: '匹配中国大陆手机号格式',
        patterns: {
            javascript: '/^1[3-9]\\d{9}$/',
            python: 'r"^1[3-9]\\d{9}$"',
            php: '/^1[3-9]\\d{9}$/',
            java: '^1[3-9]\\d{9}$'
        }
    },
    'date-format': {
        title: '日期格式化',
        category: '格式化类',
        description: '匹配日期格式（YYYY-MM-DD）',
        patterns: {
            javascript: '/^\\d{4}-\\d{2}-\\d{2}$/',
            python: 'r"^\\d{4}-\\d{2}-\\d{2}$"',
            php: '/^\\d{4}-\\d{2}-\\d{2}$/',
            java: '^\\d{4}-\\d{2}-\\d{2}$'
        }
    },
    'card-format': {
        title: '银行卡格式化',
        category: '格式化类',
        description: '匹配银行卡号（16或19位数字）',
        patterns: {
            javascript: '/^\\d{16}|\\d{19}$/',
            python: 'r"^\\d{16}|\\d{19}$"',
            php: '/^\\d{16}|\\d{19}$/',
            java: '^\\d{16}|\\d{19}$'
        }
    },
    'idcard-format': {
        title: '身份证格式化',
        category: '格式化类',
        description: '匹配中国大陆18位身份证号',
        patterns: {
            javascript: '/^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$/',
            python: 'r"^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$"',
            php: '/^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$/',
            java: '^[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$'
        }
    },
    // 特殊字符类
    'emoji': {
        title: 'Emoji表情',
        category: '特殊字符类',
        description: '匹配Emoji表情字符',
        patterns: {
            javascript: '/[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+/g',
            python: 'r"[\\U0001F600-\\U0001F64F]"',
            php: '/[\\x{1F600}-\\x{1F64F}]/u',
            java: '[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]'
        }
    },
    'special-char': {
        title: '特殊字符',
        category: '特殊字符类',
        description: '匹配特殊字符',
        patterns: {
            javascript: '/[!@#$%^&*(),.?\":{}|<>]/g',
            python: 'r"[!@#$%^&*(),.?\":{}|<>]"',
            php: '/[!@#$%^&*(),.?\":{}|<>]/',
            java: '[!@#$%^&*(),.?\":{}|<>]'
        }
    },
    'unicode': {
        title: 'Unicode字符',
        category: '特殊字符类',
        description: '匹配Unicode字符',
        patterns: {
            javascript: '/\\u[0-9a-fA-F]{4}/g',
            python: 'r"\\u[0-9a-fA-F]{4}"',
            php: '/\\u[0-9a-fA-F]{4}/',
            java: '\\u[0-9a-fA-F]{4}'
        }
    },
    'invisible-char': {
        title: '不可见字符',
        category: '特殊字符类',
        description: '匹配不可见字符（如空格、制表符等）',
        patterns: {
            javascript: '/[\\s\\u200B-\\u200D\\uFEFF]/g',
            python: 'r"[\\s\\u200B-\\u200D\\uFEFF]"',
            php: '/[\\s\\x{200B}-\\x{200D}\\x{FEFF}]/u',
            java: '[\\s\\u200B-\\u200D\\uFEFF]'
        }
    },
    // 编程相关
    'variable': {
        title: '变量命名',
        category: '编程相关',
        description: '匹配常见变量命名（字母、下划线、数字，不能以数字开头）',
        patterns: {
            javascript: '/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            python: 'r"^[a-zA-Z_][a-zA-Z0-9_]*$"',
            php: '/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            java: '^[a-zA-Z_][a-zA-Z0-9_]*$'
        }
    },
    'function': {
        title: '函数声明',
        category: '编程相关',
        description: '匹配JavaScript函数声明',
        patterns: {
            javascript: '/function\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(/',
            python: 'r"def\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\("',
            php: '/function\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\(/',
            java: 'function\\s+[a-zA-Z_][a-zA-Z0-9_]*\\s*\\('
        }
    },
    'json': {
        title: 'JSON格式',
        category: '编程相关',
        description: '匹配简单JSON格式',
        patterns: {
            javascript: '/^\\{.*\\}$/s',
            python: 'r"^\\{.*\\}$"',
            php: '/^\\{.*\\}$/s',
            java: '^\\{.*\\}$'
        }
    },
    'xml': {
        title: 'XML标签',
        category: '编程相关',
        description: '匹配XML标签',
        patterns: {
            javascript: '/<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>/',
            python: 'r"<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>"',
            php: '/<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>/',
            java: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)<\\/\\1>'
        }
    },
    'css': {
        title: 'CSS选择器',
        category: '编程相关',
        description: '匹配简单CSS选择器',
        patterns: {
            javascript: '/^[a-zA-Z][a-zA-Z0-9-_]*$/',
            python: 'r"^[a-zA-Z][a-zA-Z0-9-_]*$"',
            php: '/^[a-zA-Z][a-zA-Z0-9-_]*$/',
            java: '^[a-zA-Z][a-zA-Z0-9-_]*$'
        }
    }
};

// 1. 补充下拉框正则项到regexDatabase
const extraRegexPresets = [
    // 常用字符
    {
        key: 'chinese-char',
        title: '匹配中文字符',
        category: '常用字符',
        description: '匹配所有中文字符',
        patterns: {
            javascript: '/[\u4e00-\u9fa5]/gm',
            python: 'r"[\u4e00-\u9fa5]"',
            php: '/[\\x{4e00}-\\x{9fa5}]/u',
            java: '[\u4e00-\u9fa5]'
        }
    },
    {
        key: 'double-byte-char',
        title: '匹配双字节字符',
        category: '常用字符',
        description: '匹配所有双字节字符',
        patterns: {
            javascript: '/[^\x00-\xff]/igm',
            python: 'r"[^\x00-\xff]"',
            php: '/[^\x00-\xff]/i',
            java: '[^\x00-\xff]'
        }
    },
    {
        key: 'trim-line',
        title: '匹配行尾行首空白',
        category: '常用字符',
        description: '匹配每行首尾的空白字符',
        patterns: {
            javascript: '/(^\\s*)|(\\s*$)/',
            python: 'r"(^\\s*)|(\\s*$)"',
            php: '/(^\\s*)|(\\s*$)/',
            java: '(^\\s*)|(\\s*$)'
        }
    },
    {
        key: 'only-number',
        title: '只能输入数字',
        category: '常用字符',
        description: '只能输入数字',
        patterns: {
            javascript: '/^\\d+$/',
            python: 'r"^\\d+$"',
            php: '/^\\d+$/',
            java: '^\\d+$'
        }
    },
    {
        key: 'number-n',
        title: '只能输入n个数字',
        category: '常用字符',
        description: '只能输入n个数字',
        patterns: {
            javascript: '/^\\d{n}$/',
            python: 'r"^\\d{n}$"',
            php: '/^\\d{n}$/',
            java: '^\\d{n}$'
        }
    },
    {
        key: 'number-min-n',
        title: '至少输入n个以上的数字',
        category: '常用字符',
        description: '至少输入n个以上的数字',
        patterns: {
            javascript: '/^\\d{n,}$/',
            python: 'r"^\\d{n,}$"',
            php: '/^\\d{n,}$/',
            java: '^\\d{n,}$'
        }
    },
    {
        key: 'number-m-n',
        title: '只能输入m到n个数字',
        category: '常用字符',
        description: '只能输入m到n个数字',
        patterns: {
            javascript: '/^\\d{m,n}$/',
            python: 'r"^\\d{m,n}$"',
            php: '/^\\d{m,n}$/',
            java: '^\\d{m,n}$'
        }
    },
    {
        key: 'only-alpha',
        title: '只能由英文字母组成',
        category: '常用字符',
        description: '只能由英文字母组成',
        patterns: {
            javascript: '/^[a-z]+$/i',
            python: 'r"^[a-zA-Z]+$"',
            php: '/^[a-zA-Z]+$/',
            java: '^[a-zA-Z]+$'
        }
    },
    {
        key: 'only-uppercase',
        title: '只能由大写英文字母组成',
        category: '常用字符',
        description: '只能由大写英文字母组成',
        patterns: {
            javascript: '/^[A-Z]+$/',
            python: 'r"^[A-Z]+$"',
            php: '/^[A-Z]+$/',
            java: '^[A-Z]+$'
        }
    },
    {
        key: 'alpha-number',
        title: '只能由英文和数字组成',
        category: '常用字符',
        description: '只能由英文和数字组成',
        patterns: {
            javascript: '/^[a-z0-9]+$/i',
            python: 'r"^[a-zA-Z0-9]+$"',
            php: '/^[a-zA-Z0-9]+$/',
            java: '^[a-zA-Z0-9]+$'
        }
    },
    {
        key: 'alpha-number-underscore',
        title: '只能由英文、数字、下划线组成',
        category: '常用字符',
        description: '只能由英文、数字、下划线组成',
        patterns: {
            javascript: '/^\\w+$/',
            python: 'r"^\\w+$"',
            php: '/^\\w+$/',
            java: '^\\w+$'
        }
    },
    // 常用表单
    {
        key: 'email-simple',
        title: '匹配Email地址',
        category: '常用表单',
        description: '匹配Email地址',
        patterns: {
            javascript: '/\w+([-+.\w+])*@\w+([-.]\w+)*\.\w+([-.]\w+)*/',
            python: 'r"\w+[\-+.\w+]*@\w+[\-.\w+]*\.\w+[\-.\w+]*"',
            php: '/\w+([-+.\w+])*@\w+([-.]\w+)*\.\w+([-.]\w+)*/',
            java: '\w+([-+.\w+])*@\w+([-.]\w+)*\.\w+([-.]\w+)*'
        }
    },
    {
        key: 'url-simple',
        title: '匹配URL地址',
        category: '常用表单',
        description: '匹配URL地址',
        patterns: {
            javascript: '/^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(?::\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i',
            python: 'r"^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(?::\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$"',
            php: '/^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(?::\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$/i',
            java: '^https?:\/\/(([a-zA-Z0-9_-])+(\.)?)*(?::\d+)?(\/((\.)?(\?)?=?&?[a-zA-Z0-9_-](\?)?)*)*$'
        }
    },
    {
        key: 'mobile-cn',
        title: '匹配手机号码',
        category: '常用表单',
        description: '匹配中国大陆手机号码',
        patterns: {
            javascript: '/^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/',
            python: 'r"^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$"',
            php: '/^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$/',
            java: '^(0|86|17951)?(13[0-9]|15[012356789]|166|17[3678]|18[0-9]|14[57])[0-9]{8}$'
        }
    },
    {
        key: 'idcard-mix',
        title: '匹配身份证号',
        category: '常用表单',
        description: '匹配中国大陆身份证号',
        patterns: {
            javascript: '/^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/',
            python: 'r"(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)"',
            php: '/^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/',
            java: '(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)'
        }
    },
    {
        key: 'postal-code',
        title: '匹配邮编号',
        category: '常用表单',
        description: '匹配中国邮政编码',
        patterns: {
            javascript: '/^[1-9]\d{5}(?!\d)$/',
            python: 'r"^[1-9]\d{5}(?!\d)$"',
            php: '/^[1-9]\d{5}(?!\d)$/',
            java: '^[1-9]\d{5}(?!\d)$'
        }
    },
    {
        key: 'date-ymd',
        title: '匹配日期(yyyy-MM-dd)',
        category: '常用表单',
        description: '匹配日期格式(yyyy-MM-dd)',
        patterns: {
            javascript: '/^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$/',
            python: 'r"^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$"',
            php: '/^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$/',
            java: '^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$'
        }
    },
    {
        key: 'car-plate-blue',
        title: '匹配车牌号(蓝牌)',
        category: '常用表单',
        description: '匹配中国大陆蓝牌车牌号',
        patterns: {
            javascript: '/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/',
            python: 'r"^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$"',
            php: '/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/',
            java: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$'
        }
    },
    {
        key: 'car-plate-green',
        title: '匹配车牌号(绿牌)',
        category: '常用表单',
        description: '匹配中国大陆绿牌车牌号',
        patterns: {
            javascript: '/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{5}[A-Z0-9挂学警港澳]$/',
            python: 'r"^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{5}[A-Z0-9挂学警港澳]$"',
            php: '/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{5}[A-Z0-9挂学警港澳]$/',
            java: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z][A-Z][A-Z0-9]{5}[A-Z0-9挂学警港澳]$'
        }
    },
    // 浏览器UA
    {
        key: 'ua-ie',
        title: '从UA判断是否为IE浏览器',
        category: '浏览器UA',
        description: '匹配IE浏览器的userAgent',
        patterns: {
            javascript: '/msie (\\d+\\.\\d+)/i',
            python: 'r"msie (\\d+\\.\\d+)"',
            php: '/msie (\\d+\\.\\d+)/i',
            java: 'msie (\\d+\\.\\d+)' 
        }
    },
    {
        key: 'ua-webkit',
        title: '从UA判断是否为webkit内核',
        category: '浏览器UA',
        description: '匹配webkit内核的userAgent',
        patterns: {
            javascript: '/webkit/i',
            python: 'r"webkit"',
            php: '/webkit/i',
            java: 'webkit'
        }
    },
    {
        key: 'ua-chrome',
        title: '从UA判断是否为chrome浏览器',
        category: '浏览器UA',
        description: '匹配chrome浏览器的userAgent',
        patterns: {
            javascript: '/chrome\\/(\\d+\\.\\d+)/i',
            python: 'r"chrome/(\\d+\\.\\d+)"',
            php: '/chrome\\/(\\d+\\.\\d+)/i',
            java: 'chrome/(\\d+\\.\\d+)'
        }
    },
    {
        key: 'ua-firefox',
        title: '从UA判断是否为firefox浏览器',
        category: '浏览器UA',
        description: '匹配firefox浏览器的userAgent',
        patterns: {
            javascript: '/firefox\\/(\\d+\\.\\d+)/i',
            python: 'r"firefox/(\\d+\\.\\d+)"',
            php: '/firefox\\/(\\d+\\.\\d+)/i',
            java: 'firefox/(\\d+\\.\\d+)'
        }
    },
    {
        key: 'ua-opera',
        title: '从UA判断是否为opera浏览器',
        category: '浏览器UA',
        description: '匹配opera浏览器的userAgent',
        patterns: {
            javascript: '/opera(\\/| )(\\d+(\\.\\d+)?)(.+?(version\\/(\\d+(\\.\\d+)?)))?/i',
            python: 'r"opera(/| )(\\d+(\\.\\d+)?)(.+?(version/(\\d+(\\.\\d+)?)))?"',
            php: '/opera(\\/| )(\\d+(\\.\\d+)?)(.+?(version\\/(\\d+(\\.\\d+)?)))?/i',
            java: 'opera(/| )(\\d+(\\.\\d+)?)(.+?(version/(\\d+(\\.\\d+)?)))?'
        }
    },
    {
        key: 'ua-safari',
        title: '从UA判断是否为Safari浏览器',
        category: '浏览器UA',
        description: '匹配Safari浏览器的userAgent',
        patterns: {
            javascript: '/(\\d+\\.\\d)?(?:\\.\\d)?\\s+safari\\/?(\\d+\\.\\d+)?/i',
            python: 'r"(\\d+\\.\\d)?(?:\\.\\d)?\\s+safari/?(\\d+\\.\\d+)?"',
            php: '/(\\d+\\.\\d)?(?:\\.\\d)?\\s+safari\\/?(\\d+\\.\\d+)?/i',
            java: '(\\d+\\.\\d)?(?:\\.\\d)?\\s+safari/?(\\d+\\.\\d+)?'
        }
    },
    {
        key: 'ua-android',
        title: '从UA中判断是否为Android系统',
        category: '浏览器UA',
        description: '匹配Android系统的userAgent',
        patterns: {
            javascript: '/android/i',
            python: 'r"android"',
            php: '/android/i',
            java: 'android'
        }
    },
    {
        key: 'ua-ipad',
        title: '从UA中判断是否为iPad',
        category: '浏览器UA',
        description: '匹配iPad的userAgent',
        patterns: {
            javascript: '/ipad/i',
            python: 'r"ipad"',
            php: '/ipad/i',
            java: 'ipad'
        }
    },
    {
        key: 'ua-iphone',
        title: '从UA中判断是否为iPhone',
        category: '浏览器UA',
        description: '匹配iPhone的userAgent',
        patterns: {
            javascript: '/iphone/i',
            python: 'r"iphone"',
            php: '/iphone/i',
            java: 'iphone'
        }
    },
    {
        key: 'ua-mac',
        title: '从UA判断是否为Mac OS平台',
        category: '浏览器UA',
        description: '匹配Mac OS的userAgent',
        patterns: {
            javascript: '/macintosh/i',
            python: 'r"macintosh"',
            php: '/macintosh/i',
            java: 'macintosh'
        }
    },
    {
        key: 'ua-windows',
        title: '从UA中判断是否为Windows平台',
        category: '浏览器UA',
        description: '匹配Windows平台的userAgent',
        patterns: {
            javascript: '/windows/i',
            python: 'r"windows"',
            php: '/windows/i',
            java: 'windows'
        }
    },
    {
        key: 'ua-mobile',
        title: '从UA中判断是否为移动终端',
        category: '浏览器UA',
        description: '匹配移动终端的userAgent',
        patterns: {
            javascript: '/(nokia|iphone|android|ipad|motorola|^mot\-|softbank|foma|docomo|kddi|up\\.browser|up\\.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam\-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte\-|longcos|pantech|gionee|^sie\-|portalmmm|jig\\s browser|hiptop|^ucweb|^benq|haier|^lct|opera\\s*mobi|opera\*mini|320x320|240x320|176x220)/i',
            python: 'r"(nokia|iphone|android|ipad|motorola|^mot\-|softbank|foma|docomo|kddi|up\\.browser|up\\.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam\-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte\-|longcos|pantech|gionee|^sie\-|portalmmm|jig\\s browser|hiptop|^ucweb|^benq|haier|^lct|opera\\s*mobi|opera\*mini|320x320|240x320|176x220)"',
            php: '/(nokia|iphone|android|ipad|motorola|^mot\-|softbank|foma|docomo|kddi|up\\.browser|up\\.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam\-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte\-|longcos|pantech|gionee|^sie\-|portalmmm|jig\\s browser|hiptop|^ucweb|^benq|haier|^lct|opera\\s*mobi|opera\*mini|320x320|240x320|176x220)/i',
            java: '(nokia|iphone|android|ipad|motorola|^mot\-|softbank|foma|docomo|kddi|up\\.browser|up\\.link|htc|dopod|blazer|netfront|helio|hosin|huawei|novarra|CoolPad|webos|techfaith|palmsource|blackberry|alcatel|amoi|ktouch|nexian|samsung|^sam\-|s[cg]h|^lge|ericsson|philips|sagem|wellcom|bunjalloo|maui|symbian|smartphone|midp|wap|phone|windows ce|iemobile|^spice|^bird|^zte\-|longcos|pantech|gionee|^sie\-|portalmmm|jig\\s browser|hiptop|^ucweb|^benq|haier|^lct|opera\\s*mobi|opera\*mini|320x320|240x320|176x220)'
        }
    },
    // HTML相关
    {
        key: 'html-link',
        title: '匹配link标签',
        category: 'HTML相关',
        description: '匹配HTML中的link标签',
        patterns: {
            javascript: '/<link\\s(.*?)\\s*(([^&]>)|(\\/>)|(\\<\\/link>))/gi',
            python: 'r"<link\\s(.*?)\\s*(([^&]>)|(\\/>)|(\\<\\/link>))"',
            php: '/<link\\s(.*?)\\s*(([^&]>)|(\\/>)|(\\<\\/link>))/i',
            java: '<link\\s(.*?)\\s*(([^&]>)|(\\/>)|(\\<\\/link>))'
        }
    },
    {
        key: 'html-tag',
        title: '匹配HTML标签',
        category: 'HTML相关',
        description: '匹配HTML标签',
        patterns: {
            javascript: '/<(\\S*?) [^>]*>.*?<\\/\\1>|<.*?\/>/gm',
            python: 'r"<(\\S*?) [^>]*>.*?</\\1>|<.*?/>"',
            php: '/<(\\S*?) [^>]*>.*?<\\/\\1>|<.*?\/>/m',
            java: '<(\\S*?) [^>]*>.*?</\\1>|<.*?/>'
        }
    },
    {
        key: 'not-html-tag',
        title: '匹配非HTML标签',
        category: 'HTML相关',
        description: '匹配非HTML标签',
        patterns: {
            javascript: '/^[^<>`~!\/@#}$%:;)(_^{&*=|\'+]+$/',
            python: 'r"^[^<>`~!/@#}$%:;)(_^{&*=|\'+]+$"',
            php: '/^[^<>`~!\/@#}$%:;)(_^{&*=|\'+]+$/',
            java: '^[^<>`~!/@#}$%:;)(_^{&*=|\'+]+$'
        }
    },
    {
        key: 'html-script',
        title: '匹配script标签',
        category: 'HTML相关',
        description: '匹配script标签',
        patterns: {
            javascript: '/<script[^>]*>[\s\S]*?<\\/[^>]*script>/gi',
            python: 'r"<script[^>]*>[\s\S]*?</[^>]*script>"',
            php: '/<script[^>]*>[\s\S]*?<\\/[^>]*script>/i',
            java: '<script[^>]*>[\s\S]*?</[^>]*script>'
        }
    },
    {
        key: 'html-comment',
        title: '匹配HTML注释',
        category: 'HTML相关',
        description: '匹配HTML注释',
        patterns: {
            javascript: '/<!--[\s\S]*?--\\>/g',
            python: 'r"<!--[\s\S]*?-->"',
            php: '/<!--[\s\S]*?--\\>/',
            java: '<!--[\s\S]*?-->'
        }
    },
    {
        key: 'html-cond-comment',
        title: '匹配HTML条件注释',
        category: 'HTML相关',
        description: '匹配HTML条件注释',
        patterns: {
            javascript: '/\[\s*if\s+[^\]][\s\w]*\]/i',
            python: 'r"\[\s*if\s+[^\]][\s\w]*\]"',
            php: '/\[\s*if\s+[^\]][\s\w]*\]/i',
            java: '\[\s*if\s+[^\]][\s\w]*\]'
        }
    },
    {
        key: 'html-cond-comment-not-ie',
        title: '匹配非IE的条件注释',
        category: 'HTML相关',
        description: '匹配非IE的条件注释',
        patterns: {
            javascript: '/^\[if\s+(!IE|false)\]>.*<!\[endif\]$/i',
            python: 'r"^\[if\s+(!IE|false)\]>.*<!\[endif\]$"',
            php: '/^\[if\s+(!IE|false)\]>.*<!\[endif\]$/i',
            java: '^\[if\s+(!IE|false)\]>.*<!\[endif\]$'
        }
    },
    {
        key: 'css-expression',
        title: '匹配CSS expression',
        category: 'HTML相关',
        description: '匹配CSS expression',
        patterns: {
            javascript: '/expression[\s\r\n ]?\(/gi',
            python: 'r"expression[\s\r\n ]?\("',
            php: '/expression[\s\r\n ]?\(/i',
            java: 'expression[\s\r\n ]?\('
        }
    },
    {
        key: 'illegal-html-tag',
        title: '匹配不合法的HTML标签',
        category: 'HTML相关',
        description: '匹配不合法的HTML标签',
        patterns: {
            javascript: '/<\W+>/gi',
            python: 'r"<\W+>"',
            php: '/<\W+>/i',
            java: '<\W+>'
        }
    },
    {
        key: 'html-textarea',
        title: '匹配textarea标签',
        category: 'HTML相关',
        description: '匹配textarea标签',
        patterns: {
            javascript: '/<textarea[^>]*>[\s\S]*?<\\/[^>]*textarea>/gi',
            python: 'r"<textarea[^>]*>[\s\S]*?</[^>]*textarea>"',
            php: '/<textarea[^>]*>[\s\S]*?<\\/[^>]*textarea>/i',
            java: '<textarea[^>]*>[\s\S]*?</[^>]*textarea>'
        }
    }
];

// 合并到regexDatabase（避免重复）
extraRegexPresets.forEach(item => {
    if (!regexDatabase[item.key]) {
        regexDatabase[item.key] = item;
    }
});

/**
 * 自动生成旧版下拉框正则项到regexDatabase
 */
function populateOldVersionPreset() {
    const select = document.getElementById('regList');
    if (!select) return;
    select.innerHTML = '';

    // 添加自定义选项
    const customOption = document.createElement('option');
    customOption.value = '';
    customOption.textContent = '自定义/选择常用正则';
    select.appendChild(customOption);

    // 按分类分组
    const grouped = {};
    Object.keys(regexDatabase).forEach(key => {
        const item = regexDatabase[key];
        const cat = item.category || '其他';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ key, title: item.title, pattern: item.patterns.javascript });
    });

    Object.keys(grouped).forEach(cat => {
        const group = document.createElement('optgroup');
        group.label = cat;
        grouped[cat].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.pattern;
            option.textContent = opt.title;
            group.appendChild(option);
        });
        select.appendChild(group);
    });
}

/**
 * 自适应高度的jQuery插件 - 用于旧版功能
 */
if (typeof $ !== 'undefined') {
    $.fn.extend({
        textareaAutoHeight: function (options) {
            this._options = {
                minHeight: 0,
                maxHeight: 100000
            };

            this.init = function () {
                for (var p in options) {
                    this._options[p] = options[p];
                }
                if (this._options.minHeight === 0) {
                    this._options.minHeight = parseFloat($(this).height());
                }
                for (var p in this._options) {
                    if ($(this).attr(p) == null) {
                        $(this).attr(p, this._options[p]);
                    }
                }
                $(this).keyup(this.resetHeight).change(this.resetHeight)
                    .focus(this.resetHeight);
            };
            this.resetHeight = function () {
                var _minHeight = parseFloat($(this).attr("minHeight"));
                var _maxHeight = parseFloat($(this).attr("maxHeight"));

                $(this).height(0);
                var h = parseFloat(this.scrollHeight);
                h = h < _minHeight ? _minHeight :
                    h > _maxHeight ? _maxHeight : h;
                $(this).height(h).scrollTop(h);
                if (h >= _maxHeight) {
                    $(this).css("overflow-y", "scroll");
                }
                else {
                    $(this).css("overflow-y", "hidden");
                }
            };
            this.init();
        }
    });
}

/**
 * 旧版正则表达式工具类
 */
var RegExpTools = (function () {
    "use strict";

    var regElm, srcElm, rstElm, rstCount, srcBackgroundElm, srcWrapperElm, regListElm;
    var ID_PREFIX = 'tmp_id_';
    var TAG_MATCHED = 'b';
    var TAG_NOT_MATCHED = 'i';
    var TR_ID_PREFIX = 'tr_' + ID_PREFIX;

    var _getRegExp = function (regTxt) {
        try {
            return new Function('return ' + regTxt)();
        } catch (e) {
            return null;
        }
    };

    var _buildTable = function (rstArray) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th><th>在原字符串中的位置</th></tr>')
        $.each(rstArray, function (i, item) {
            tbl.push('<tr id="' + TR_ID_PREFIX + item.index + '" data-index="' + item.index + '">');
            tbl.push('<td class="num">' + (i + 1) + '</td>'
                + '<td class="content">' + item.text + '</td>'
                + '<td class="index">' + item.index + '</td>');
            tbl.push('</tr>');
        });
        tbl.push('</table>');
        return tbl.join('');
    };

    var _createTag = function (type, item) {
        var tags = [];
        for (var i = 0, len = item.text.length; i < len; i++) {
            tags.push('<' + type + ' data-id="' + ID_PREFIX + item.index + '">'
                + item.text.charAt(i) + '</' + type + '>');
        }
        return tags.join('');
    };

    var _blinkHighlight = function () {
        $('tr[id^=' + TR_ID_PREFIX + ']').click(function (e) {
            var index = $(this).attr('data-index');
            var tags = $(TAG_MATCHED + '[data-id=' + ID_PREFIX + index + ']');
            tags.animate({
                opacity: 0
            }, 200).delay().animate({
                opacity: 1
            }, 200).delay().animate({
                opacity: 0
            }, 200).delay().animate({
                opacity: 1
            }, 200);
        });
    };

    var _highlight = function (srcText, rstArray) {
        if (!srcText) {
            srcBackgroundElm.html('');
            return;
        }
        var hl = [];
        var preIndex = 0;
        $.each(rstArray, function (i, item) {
            if (i === 0) {
                if (item.index === 0) {
                    hl.push(_createTag(TAG_MATCHED, item));
                } else {
                    hl.push(_createTag(TAG_NOT_MATCHED, {
                        index: 0,
                        text: srcText.substring(0, item.index)
                    }));
                    hl.push(_createTag(TAG_MATCHED, item));
                }
            } else {
                preIndex = rstArray[i - 1].index + rstArray[i - 1].text.length;
                hl.push(_createTag(TAG_NOT_MATCHED, {
                    index: preIndex,
                    text: srcText.substring(preIndex, item.index)
                }));
                hl.push(_createTag(TAG_MATCHED, item));
            }
        });
        srcBackgroundElm.html(hl.join(''));
        _blinkHighlight();
    };

    var _emptyTable = function (message) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th></tr>');
        tbl.push('<tr><td colspan="2">' + message + '</td></tr>');
        tbl.push('</table>');
        return tbl.join('');
    };

    var _dealRegMatch = function (e) {
        if (!srcWrapperElm || !srcElm) return;
        
        srcWrapperElm.height(srcElm.height() + 24);

        var regTxt = regElm.val().trim();
        var srcTxt = srcElm.val().trim();
        if (!regTxt || !srcTxt) {
            rstElm.html(_emptyTable('不能匹配'));
            rstCount.html('0个');
            _highlight();
        } else {
            var reg = _getRegExp(regTxt);
            if (!reg || !reg instanceof RegExp) {
                rstElm.html(_emptyTable('正则表达式错误！'));
                rstCount.html('0个');
                _highlight();
                return;
            }
            var rst = [];
            // 用字符串的replace方法来找到匹配目标在元字符串中的准确位置
            srcTxt.replace(reg, function () {
                var matchedTxt = arguments[0];
                var txtIndex = arguments[arguments.length - 2];
                rst.push({
                    text: matchedTxt,
                    index: txtIndex
                });
            });
            if (!rst || !rst.length) {
                rstElm.html(_emptyTable('不能匹配'));
                rstCount.html('0个');
                _highlight();
            } else {
                rstElm.html(_buildTable(rst));
                rstCount.html(rst.length + '个');
                _highlight(srcElm.val(), rst);
            }
        }
    };

    var _init = function () {
        regElm = $('#regText');
        srcElm = $('#srcCode');
        srcBackgroundElm = $('#srcBackground');
        srcWrapperElm = $('#srcWrapper');
        rstElm = $('#rstCode');
        rstCount = $('#rstCount');
        regListElm = $('#regList');

        if (!regElm.length) return; // 如果元素不存在，直接返回

        rstElm.html(_emptyTable('暂无输入'));

        // 输入框自适应高度
        if (regElm.textareaAutoHeight) {
            regElm.textareaAutoHeight({ minHeight: 40 });
            srcElm.textareaAutoHeight({ minHeight: 60 });
            srcBackgroundElm.textareaAutoHeight({ minHeight: 60 });
        }

        // 监听两个输入框的按键、paste、change事件
        $('#regText,#srcCode').keyup(_dealRegMatch).change(_dealRegMatch)
            .bind('paste', _dealRegMatch);

        regListElm.change(function (e) {
            var reg = $(this).val();
            var regTipElm = $('#regTip');
            regElm.val(reg);
            if (!reg) {
                if (regTipElm.length) regTipElm.hide();
            } else {
                if (regTipElm.length) regTipElm.show();
            }
            _dealRegMatch(); // 触发匹配
        });
    };

    return {
        init: _init
    };
})();

// 主要的应用程序逻辑
document.addEventListener('DOMContentLoaded', function() {
    initTabSwitching();
    initNewVersionFeatures();
    initOldVersionFeatures();
    initCommonFeatures();
});

/**
 * 初始化Tab切换功能
 */
function initTabSwitching() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 移除所有active类
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 添加active类到当前选中的
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

/**
 * 初始化新版功能
 */
function initNewVersionFeatures() {
    populateVisualRegexPreset();
    initVisualDebugger();
    initRegexSearch();
    initRegexItems();
    initModal();
}

/**
 * 初始化旧版功能
 */
function initOldVersionFeatures() {
    // 确保jQuery已加载后再初始化旧版功能
    if (typeof $ !== 'undefined') {
        // 自动生成下拉框内容
        populateOldVersionPreset();
        RegExpTools.init();
    }
}

/**
 * 初始化通用功能
 */
function initCommonFeatures() {
    // 打赏和其他工具链接
    const donateLink = document.getElementById('donateLink');
    const otherToolsBtn = document.getElementById('btnOtherTools');

    if (donateLink) {
        donateLink.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'open-donate-modal',
                params: { toolName: 'regexp' }
            });
        });
    }

    if (otherToolsBtn) {
        otherToolsBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            chrome.runtime.openOptionsPage();
        });
    }
}

/**
 * 填充可视化调试器的预设正则表达式
 */
function populateVisualRegexPreset() {
    const select = document.getElementById('visualRegexPreset');
    if (!select) return;

    // 先清空
    select.innerHTML = '';

    // 添加自定义选项
    const customOption = document.createElement('option');
    customOption.value = '';
    customOption.textContent = '自定义/选择常用正则';
    select.appendChild(customOption);

    // 按分类分组
    const grouped = {};
    Object.keys(regexDatabase).forEach(key => {
        const item = regexDatabase[key];
        const cat = item.category || '其他';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ key, title: item.title });
    });

    Object.keys(grouped).forEach(cat => {
        const group = document.createElement('optgroup');
        group.label = cat;
        grouped[cat].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.key;
            option.textContent = opt.title;
            group.appendChild(option);
        });
        select.appendChild(group);
    });

    // 事件绑定逻辑不变
    select.addEventListener('change', function() {
        const selectedKey = this.value;
        if (selectedKey && regexDatabase[selectedKey]) {
            const pattern = regexDatabase[selectedKey].patterns.javascript;
            // 去掉前后的斜杠和标志
            const cleanPattern = pattern.replace(/^\/?|\/[gimuy]*$/g, '');
            document.getElementById('visualRegex').value = cleanPattern;
        }
    });
}

/**
 * 初始化可视化调试器
 */
function initVisualDebugger() {
    const testBtn = document.getElementById('visualTestBtn');
    const regexInput = document.getElementById('visualRegex');
    const testTextArea = document.getElementById('visualTestText');
    const resultDiv = document.getElementById('visualResult');
    const errorMsg = document.getElementById('visualErrorMsg');
    const flagCheckboxes = document.querySelectorAll('.flag-btn input[type="checkbox"]');

    if (!testBtn) return;

    // 标志复选框事件
    flagCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateFlagsInputFromCheckbox);
    });

    function updateFlagsInputFromCheckbox() {
        const flags = Array.from(flagCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join('');
        document.getElementById('visualFlags').value = flags;
    }

    testBtn.addEventListener('click', doVisualTest);
    regexInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') doVisualTest();
    });
    testTextArea.addEventListener('keyup', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) doVisualTest();
    });

    // 新增：输入时自动实时匹配
    regexInput.addEventListener('input', doVisualTest);
    testTextArea.addEventListener('input', doVisualTest);

    function doVisualTest() {
        let regexStr = regexInput.value.trim();
        const testText = testTextArea.value.trim();

        errorMsg.textContent = '';

        if (!regexStr) {
            errorMsg.textContent = '请输入正则表达式';
            return;
        }
        if (!testText) {
            errorMsg.textContent = '请输入要测试的文本';
            return;
        }

        // 新增：支持 /pattern/flags 写法
        let pattern = regexStr;
        let flags = Array.from(flagCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join('');

        // 如果是 /pattern/flags 形式
        const regSlash = /^\/(.+)\/([gimsuy]*)$/;
        const match = regexStr.match(regSlash);
        if (match) {
            pattern = match[1];
            flags = match[2];
        }

        try {
            const regex = new RegExp(pattern, flags);
            const matches = [];
            let match;
            
            if (flags.includes('g')) {
                while ((match = regex.exec(testText)) !== null) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });
                    if (match.index === regex.lastIndex) break;
                }
            } else {
                match = regex.exec(testText);
                if (match) {
                    matches.push({
                        match: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });
                }
            }
            
            displayVisualResults(matches, testText, regex);
        } catch (e) {
            errorMsg.textContent = '正则表达式语法错误: ' + e.message;
            resultDiv.innerHTML = '';
        }
    }

    function displayVisualResults(matches, text, regex) {
        if (matches.length === 0) {
            resultDiv.innerHTML = '<div class="no-matches">没有找到匹配项</div>';
            return;
        }

        let html = `<div class="match-summary">找到 ${matches.length} 个匹配项</div>`;
        
        // 高亮显示文本
        let highlightedText = text;
        let offset = 0;
        
        matches.forEach((match, index) => {
            const startTag = `<mark class="match-highlight" data-match="${index}">`;
            const endTag = '</mark>';
            const insertPos = match.index + offset;
            
            highlightedText = highlightedText.slice(0, insertPos) + 
                            startTag + 
                            highlightedText.slice(insertPos, insertPos + match.match.length) + 
                            endTag + 
                            highlightedText.slice(insertPos + match.match.length);
            
            offset += startTag.length + endTag.length;
        });
        
        html += `<div class="highlighted-text"><pre>${highlightedText}</pre></div>`;
        
        // 匹配详情
        html += '<div class="match-details">';
        matches.forEach((match, index) => {
            html += `<div class="match-item">
                <strong>匹配 ${index + 1}:</strong> "${match.match}" 
                <span class="match-position">(位置: ${match.index}-${match.index + match.match.length - 1})</span>`;
            
            if (match.groups.length > 0) {
                html += '<div class="match-groups">分组: ';
                match.groups.forEach((group, groupIndex) => {
                    if (group !== undefined) {
                        html += `<span class="group">$${groupIndex + 1}: "${group}"</span> `;
                    }
                });
                html += '</div>';
            }
            html += '</div>';
        });
        html += '</div>';
        
        resultDiv.innerHTML = html;
    }
}

/**
 * 初始化正则表达式搜索功能
 */
function initRegexSearch() {
    const searchInput = document.getElementById('regexSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const regexItems = document.querySelectorAll('.regex-item');
        const categories = document.querySelectorAll('.category-section');

        if (!searchTerm) {
            // 恢复所有分类和按钮显示
            regexItems.forEach(item => {
                item.style.display = '';
            });
            categories.forEach(cat => {
                cat.style.display = '';
            });
            return;
        }

        // 原有筛选逻辑
        regexItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const category = item.closest('.category-section');
            if (text.includes(searchTerm)) {
                item.style.display = 'block';
                if (category) category.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
        // 隐藏没有可见项的分类
        categories.forEach(category => {
            const visibleItems = category.querySelectorAll('.regex-item[style*="block"], .regex-item:not([style*="none"])');
            if (visibleItems.length === 0 && searchTerm) {
                category.style.display = 'none';
            } else if (!searchTerm) {
                category.style.display = '';
            }
        });
    });
}

/**
 * 初始化正则表达式项目点击事件和新版分类按钮区域
 * 自动遍历regexDatabase，按category分组渲染所有分类和按钮
 */
function initRegexItems() {
    // 新版分类按钮区域容器
    const container = document.getElementById('regexCategoryContainer');
    if (!container) return;
    container.innerHTML = '';

    // 按分类分组
    const grouped = {};
    Object.keys(regexDatabase).forEach(key => {
        const item = regexDatabase[key];
        const cat = item.category || '其他';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ key, title: item.title });
    });

    // 渲染每个分类
    Object.keys(grouped).forEach(cat => {
        // 分类标题
        const section = document.createElement('div');
        section.className = 'category-section';
        section.innerHTML = `<div class="category-title">${cat}</div>`;
        // 分类按钮区
        const btnGroup = document.createElement('div');
        btnGroup.className = 'category-btn-group';
        grouped[cat].forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'regex-item';
            btn.setAttribute('data-regex-id', opt.key);
            btn.textContent = opt.title;
            // 点击弹出模态框
            btn.addEventListener('click', function() {
                if (regexDatabase[opt.key]) {
                    showRegexModal(regexDatabase[opt.key]);
                } else {
                    alert('该正则表达式暂未收录，敬请期待！');
                }
            });
            btnGroup.appendChild(btn);
        });
        section.appendChild(btnGroup);
        container.appendChild(section);
    });
}

/**
 * 初始化模态框
 */
function initModal() {
    const modal = document.getElementById('regexModal');
    const closeBtn = document.querySelector('.close');
    
    if (!modal) return;

    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 复制按钮事件
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const textToCopy = targetElement.textContent;
                
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        this.textContent = '已复制!';
                        setTimeout(() => {
                            this.textContent = '复制';
                        }, 2000);
                    });
                } else {
                    // 降级方案
                    const textArea = document.createElement('textarea');
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    this.textContent = '已复制!';
                    setTimeout(() => {
                        this.textContent = '复制';
                    }, 2000);
                }
            }
        });
    });
}

/**
 * 显示正则表达式模态框
 */
function showRegexModal(regexData) {
    const modal = document.getElementById('regexModal');
    const modalTitle = document.getElementById('modalTitle');
    const jsRegex = document.getElementById('jsRegex');
    const pythonRegex = document.getElementById('pythonRegex');
    const phpRegex = document.getElementById('phpRegex');
    const javaRegex = document.getElementById('javaRegex');
    const regexDescription = document.getElementById('regexDescription');

    modalTitle.textContent = regexData.title;
    jsRegex.textContent = regexData.patterns.javascript;
    pythonRegex.textContent = regexData.patterns.python;
    phpRegex.textContent = regexData.patterns.php;
    javaRegex.textContent = regexData.patterns.java;
    regexDescription.textContent = regexData.description;

    modal.style.display = 'block';
}

// 工具函数
function parsePatternAndFlags(input) {
    const match = input.match(/^\/(.+)\/([gimuy]*)$/);
    if (match) {
        return {
            pattern: match[1],
            flags: match[2]
        };
    }
    return {
        pattern: input,
        flags: ''
    };
}

function highlightMatchesV2(text, regex) {
    return text.replace(regex, '<mark>$&</mark>');
}

function loadPatchHotfix() {
    // 可以在这里添加热修复逻辑
    console.log('正则表达式工具已加载');
}

// jQuery自适应高度插件（用于旧版功能）
if (typeof $ !== 'undefined') {
    $.fn.extend({
        textareaAutoHeight: function (options) {
            this._options = {
                minHeight: 0,
                maxHeight: 100000
            };

            this.init = function () {
                for (var p in options) {
                    this._options[p] = options[p];
                }
                if (this._options.minHeight === 0) {
                    this._options.minHeight = parseFloat($(this).height());
                }
                for (var p in this._options) {
                    if ($(this).attr(p) == null) {
                        $(this).attr(p, this._options[p]);
                    }
                }
                $(this).keyup(this.resetHeight).change(this.resetHeight)
                    .focus(this.resetHeight);
            };
            this.resetHeight = function () {
                var _minHeight = parseFloat($(this).attr("minHeight"));
                var _maxHeight = parseFloat($(this).attr("maxHeight"));

                $(this).height(0);
                var h = parseFloat(this.scrollHeight);
                h = h < _minHeight ? _minHeight :
                    h > _maxHeight ? _maxHeight : h;
                $(this).height(h).scrollTop(h);
                if (h >= _maxHeight) {
                    $(this).css("overflow-y", "scroll");
                }
                else {
                    $(this).css("overflow-y", "hidden");
                }
            };
            this.init();
        }
    });
}

// 旧版正则表达式工具类
var RegExpTools = (function () {
    "use strict";

    var regElm, srcElm, rstElm, rstCount, srcBackgroundElm, srcWrapperElm, regListElm;
    var ID_PREFIX = 'tmp_id_';
    var TAG_MATCHED = 'b';
    var TAG_NOT_MATCHED = 'i';
    var TR_ID_PREFIX = 'tr_' + ID_PREFIX;

    var _getRegExp = function (regTxt) {
        try {
            return new Function('return ' + regTxt)();
        } catch (e) {
            return null;
        }
    };

    var _buildTable = function (rstArray) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th><th class="r-index">在原字符串中的位置</th></tr>')
        $.each(rstArray, function (i, item) {
            tbl.push('<tr id="' + TR_ID_PREFIX + item.index + '" data-index="' + item.index + '">');
            tbl.push('<td class="num">' + (i + 1) + '</td>'
                + '<td class="content">' + item.text + '</td>'
                + '<td class="index">' + item.index + '</td>');
            tbl.push('</tr>');
        });
        tbl.push('</table>');
        return tbl.join('');
    };

    var _createTag = function (type, item) {
        var tags = [];
        for (var i = 0, len = item.text.length; i < len; i++) {
            tags.push('<' + type + ' data-id="' + ID_PREFIX + item.index + '">'
                + item.text.charAt(i) + '</' + type + '>');
        }
        return tags.join('');
    };

    var _blinkHighlight = function () {
        $('tr[id^=' + TR_ID_PREFIX + ']').click(function (e) {
            var index = $(this).attr('data-index');
            var tags = $(TAG_MATCHED + '[data-id=' + ID_PREFIX + index + ']');
            tags.animate({
                opacity: 0
            }, 200).delay().animate({
                opacity: 1
            }, 200).delay().animate({
                opacity: 0
            }, 200).delay().animate({
                opacity: 1
            }, 200);
        });
    };

    var _highlight = function (srcText, rstArray) {
        if (!srcText) {
            srcBackgroundElm.html('');
            return;
        }
        var hl = [];
        var preIndex = 0;
        $.each(rstArray, function (i, item) {
            if (i === 0) {
                if (item.index === 0) {
                    hl.push(_createTag(TAG_MATCHED, item));
                } else {
                    hl.push(_createTag(TAG_NOT_MATCHED, {
                        index: 0,
                        text: srcText.substring(0, item.index)
                    }));
                    hl.push(_createTag(TAG_MATCHED, item));
                }
            } else {
                preIndex = rstArray[i - 1].index + rstArray[i - 1].text.length;
                hl.push(_createTag(TAG_NOT_MATCHED, {
                    index: preIndex,
                    text: srcText.substring(preIndex, item.index)
                }));
                hl.push(_createTag(TAG_MATCHED, item));
            }
        });
        srcBackgroundElm.html(hl.join(''));
        _blinkHighlight();
    };

    var _emptyTable = function (message) {
        var tbl = ["<table class='table table-bordered table-striped table-condensed table-hover'>"];
        tbl.push('<tr class="active"><th class="num">序号</th><th>匹配结果</th></tr>');
        tbl.push('<tr><td colspan="2">' + message + '</td></tr>');
        tbl.push('</table>');
        return tbl.join('');
    };

    var _dealRegMatch = function (e) {
        if (!srcWrapperElm || !srcElm) return;
        
        srcWrapperElm.height(srcElm.height() + 24);

        var regTxt = regElm.val().trim();
        var srcTxt = srcElm.val().trim();
        if (!regTxt || !srcTxt) {
            rstElm.html(_emptyTable('不能匹配'));
            rstCount.html('0个');
            _highlight();
        } else {
            var reg = _getRegExp(regTxt);
            if (!reg || !reg instanceof RegExp) {
                rstElm.html(_emptyTable('正则表达式错误！'));
                rstCount.html('0个');
                _highlight();
                return;
            }
            var rst = [];
            // 用字符串的replace方法来找到匹配目标在元字符串中的准确位置
            srcTxt.replace(reg, function () {
                var matchedTxt = arguments[0];
                var txtIndex = arguments[arguments.length - 2];
                rst.push({
                    text: matchedTxt,
                    index: txtIndex
                });
            });
            if (!rst || !rst.length) {
                rstElm.html(_emptyTable('不能匹配'));
                rstCount.html('0个');
                _highlight();
            } else {
                rstElm.html(_buildTable(rst));
                rstCount.html(rst.length + '个');
                _highlight(srcElm.val(), rst);
            }
        }
    };

    var _init = function () {
        regElm = $('#regText');
        srcElm = $('#srcCode');
        srcBackgroundElm = $('#srcBackground');
        srcWrapperElm = $('#srcWrapper');
        rstElm = $('#rstCode');
        rstCount = $('#rstCount');
        regListElm = $('#regList');

        if (!regElm.length) return; // 如果元素不存在，直接返回

        rstElm.html(_emptyTable('暂无输入'));

        // 监听两个输入框的按键、paste、change事件
        $('#regText,#srcCode').keyup(_dealRegMatch).change(_dealRegMatch)
            .bind('paste', _dealRegMatch);

        regListElm.change(function (e) {
            var reg = $(this).val();
            var regTipElm = $('#regTip');
            regElm.val(reg);
            if (!reg) {
                if (regTipElm.length) regTipElm.hide();
            } else {
                if (regTipElm.length) regTipElm.show();
            }
            _dealRegMatch(); // 触发匹配
        });
    };

    return {
        init: _init
    };
})();
