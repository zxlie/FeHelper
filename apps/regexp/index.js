// 正则表达式数据库
const regexDatabase = {
    // 验证类
    'email': {
        title: '邮箱验证',
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
        description: '验证URL地址的合法性，支持http、https协议，可选端口、路径、参数、锚点，支持localhost和IP地址',
        patterns: {
            javascript: '/^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$/i',
            python: 'r"^(https?:\/\/)?((([\w-]+\.)+[\w-]+|localhost|\d{1,3}(?:\.\d{1,3}){3}))(\:\d{1,5})?(\/[^s?#]*)?(\?[^s#]*)?(#[^s]*)?$"',
            php: '/^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$/i',
            java: '^(https?:\\/\\/)?((([\\w-]+\\.)+[\\w-]+|localhost|\\d{1,3}(?:\\.\\d{1,3}){3}))(\\:\\d{1,5})?(\\/[^\\s?#]*)?(\\?[^\\s#]*)?(#[^\\s]*)?$'
        }
    },
    'idcard': {
        title: '身份证验证',
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
        description: '去除文本中的HTML标签',
        patterns: {
            javascript: '/<[^>]+>/g',
            python: 'r"<[^>]+>"',
            php: '/<[^>]+>/',
            java: '<[^>]+>'
        }
    },
    'remove-script': {
        title: '去除Script标签',
        description: '去除HTML中的script标签及其内容',
        patterns: {
            javascript: '/<script[^>]*>[\\s\\S]*?<\\/script>/gi',
            python: 'r"<script[^>]*>[\\s\\S]*?</script>"',
            php: '/<script[^>]*>[\\s\\S]*?<\\/script>/i',
            java: '<script[^>]*>[\\s\\S]*?</script>'
        }
    },
    'remove-space': {
        title: '去除多余空格',
        description: '去除字符串中的多余空格，保留单个空格',
        patterns: {
            javascript: '/\\s+/g',
            python: 'r"\\s+"',
            php: '/\\s+/',
            java: '\\s+'
        }
    },
    'remove-comment': {
        title: '去除注释',
        description: '去除代码中的单行和多行注释',
        patterns: {
            javascript: '/(\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/)/gm',
            python: 'r"(#.*$)|(\'\'\'[\\s\\S]*?\'\'\')|(\\"\\"\\"[\\s\\S]*?\\"\\"\\"))"',
            php: '/(\\/\\/.*$)|(\\/\\*[\\s\\S]*?\\*\\/)/m',
            java: '(/\\*([^*]|[\\r\\n]|(\\*+([^*/]|[\\r\\n])))*\\*+/)|(//.*)'
        }
    },

    // 格式化类
    'money': {
        title: '金额格式化',
        description: '将数字转换为金额格式（每三位加逗号）',
        patterns: {
            javascript: '/(\\d)(?=(\\d{3})+(?!\\d))/g',
            python: 'r"(\\d)(?=(\\d{3})+(?!\\d))"',
            php: '/(\\d)(?=(\\d{3})+(?!\\d))/',
            java: '(\\d)(?=(\\d{3})+(?!\\d))'
        }
    },
    'phone-format': {
        title: '手机号格式化',
        description: '将手机号格式化为 xxx-xxxx-xxxx',
        patterns: {
            javascript: '/(\\d{3})(\\d{4})(\\d{4})/',
            python: 'r"(\\d{3})(\\d{4})(\\d{4})"',
            php: '/(\\d{3})(\\d{4})(\\d{4})/',
            java: '(\\d{3})(\\d{4})(\\d{4})'
        }
    },
    'date-format': {
        title: '日期格式化',
        description: '将日期字符串格式化为指定格式',
        patterns: {
            javascript: '/(\\d{4})-(\\d{2})-(\\d{2})/',
            python: 'r"(\\d{4})-(\\d{2})-(\\d{2})"',
            php: '/(\\d{4})-(\\d{2})-(\\d{2})/',
            java: '(\\d{4})-(\\d{2})-(\\d{2})'
        }
    },
    'card-format': {
        title: '银行卡格式化',
        description: '将银行卡号每4位添加一个空格',
        patterns: {
            javascript: '/(\\d{4})(?=\\d)/g',
            python: 'r"(\\d{4})(?=\\d)"',
            php: '/(\\d{4})(?=\\d)/',
            java: '(\\d{4})(?=\\d)'
        }
    },
    'idcard-format': {
        title: '身份证格式化',
        description: '将身份证号码按6-8-4格式分组',
        patterns: {
            javascript: '/(^\\d{6})(\\d{8})(\\d{4})/g',
            python: 'r"(^\\d{6})(\\d{8})(\\d{4})"',
            php: '/(^\\d{6})(\\d{8})(\\d{4})/',
            java: '(^\\d{6})(\\d{8})(\\d{4})'
        }
    },

    // 特殊字符类
    'emoji': {
        title: 'Emoji表情',
        description: '匹配Unicode emoji表情符号',
        patterns: {
            javascript: '/[\\u{1F300}-\\u{1F9FF}]/gu',
            python: 'r"[\\U0001F300-\\U0001F9FF]"',
            php: '/[\\x{1F300}-\\x{1F9FF}]/u',
            java: '[\\uD83C\\uDF00-\\uD83D\\uDDFF]'
        }
    },
    'special-char': {
        title: '特殊字符',
        description: '匹配常见特殊字符',
        patterns: {
            javascript: '/[`~!@#$%^&*()_\\-+=<>?:"{}|,.\\/;\'\\[\\]·~！@#￥%……&*（）——\\-+={}|《》？：""【】、；\'，。、]/g',
            python: 'r"[`~!@#$%^&*()_\\-+=<>?:\\"{}|,.\\/;\\\'\\[\\]·~！@#￥%……&*（）——\\-+={}|《》？：""【】、；\\\'，。、]"',
            php: '/[`~!@#$%^&*()_\\-+=<>?:"{}|,.\\/;\'\\[\\]·~！@#￥%……&*（）——\\-+={}|《》？：""【】、；\'，。、]/',
            java: '[`~!@#$%^&*()_\\-+=<>?:"{}|,.\\/;\'\\[\\]·~！@#￥%……&*（）——\\-+={}|《》？：""【】、；\'，。、]'
        }
    },
    'invisible-char': {
        title: '不可见字符',
        description: '匹配不可见字符（空格、制表符、换行符等）',
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
        description: '验证合法的变量名（字母、数字、下划线，字母开头）',
        patterns: {
            javascript: '/^[a-zA-Z_$][a-zA-Z0-9_$]*$/',
            python: 'r"^[a-zA-Z_][a-zA-Z0-9_]*$"',
            php: '/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            java: '^[a-zA-Z_$][a-zA-Z0-9_$]*$'
        }
    },
    'function': {
        title: '函数声明',
        description: '匹配函数声明语句',
        patterns: {
            javascript: '/function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\([^)]*\\)\\s*{/',
            python: 'r"def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^)]*\\)\\s*:"',
            php: '/function\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\([^)]*\\)\\s*{/',
            java: '(public|private|protected|static|\\s) +[\\w\\<\\>\\[\\]]+\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\([^)]*\\)\\s*\\{'
        }
    },
    'json': {
        title: 'JSON格式',
        description: '验证JSON字符串格式',
        patterns: {
            javascript: '/^\\s*({[\\s\\S]*}|\\[[\\s\\S]*\\])\\s*$/',
            python: 'r"^\\s*({[\\s\\S]*}|\\[[\\s\\S]*\\])\\s*$"',
            php: '/^\\s*({[\\s\\S]*}|\\[[\\s\\S]*\\])\\s*$/',
            java: '^\\s*({[\\s\\S]*}|\\[[\\s\\S]*\\])\\s*$'
        }
    },
    'xml': {
        title: 'XML标签',
        description: '匹配XML标签',
        patterns: {
            javascript: '/<\\/?([a-z][\\w-]*)(?:\\s+[^>]*)?>/gi',
            python: 'r"<\\/?([a-z][\\w-]*)(?:\\s+[^>]*)?>)"',
            php: '/<\\/?([a-z][\\w-]*)(?:\\s+[^>]*)?>/i',
            java: '<\\/?([a-z][\\w-]*)(?:\\s+[^>]*)?>'
        }
    },
    'css': {
        title: 'CSS选择器',
        description: '匹配CSS选择器',
        patterns: {
            javascript: '/[.#]?[a-zA-Z_-][\\w-]*(?:\\[[^\\]]+\\])?(?:\\.[a-zA-Z_-][\\w-]*)*/',
            python: 'r"[.#]?[a-zA-Z_-][\\w-]*(?:\\[[^\\]]+\\])?(?:\\.[a-zA-Z_-][\\w-]*)*"',
            php: '/[.#]?[a-zA-Z_-][\\w-]*(?:\\[[^\\]]+\\])?(?:\\.[a-zA-Z_-][\\w-]*)*/',
            java: '[.#]?[a-zA-Z_-][\\w-]*(?:\\[[^\\]]+\\])?(?:\\.[a-zA-Z_-][\\w-]*)*'
        }
    },

    // 数字验证类
    'number': {
        title: '数字验证',
        description: '验证是否为纯数字',
        patterns: {
            javascript: '/^\d+$/',
            python: 'r"^\d+$"',
            php: '/^\d+$/',
            java: '^\\d+$'
        }
    },
    'number-n-digits': {
        title: 'n位数字验证',
        description: '验证是否为n位数字（示例为4位）',
        patterns: {
            javascript: '/^\d{4}$/',
            python: 'r"^\d{4}$"',
            php: '/^\d{4}$/',
            java: '^\\d{4}$'
        }
    },
    'number-min-n-digits': {
        title: '至少n位数字验证',
        description: '验证是否至少包含n位数字（示例为6位）',
        patterns: {
            javascript: '/^\d{6,}$/',
            python: 'r"^\d{6,}$"',
            php: '/^\d{6,}$/',
            java: '^\\d{6,}$'
        }
    },
    'number-range-digits': {
        title: '数字位数范围验证',
        description: '验证数字位数是否在指定范围内（示例为6-18位）',
        patterns: {
            javascript: '/^\d{6,18}$/',
            python: 'r"^\d{6,18}$"',
            php: '/^\d{6,18}$/',
            java: '^\\d{6,18}$'
        }
    },
    'decimal': {
        title: '小数验证',
        description: '验证是否为小数',
        patterns: {
            javascript: '/^\d+\.\d+$/',
            python: 'r"^\d+\.\d+$"',
            php: '/^\d+\.\d+$/',
            java: '^\\d+\\.\\d+$'
        }
    },
    'integer': {
        title: '整数验证',
        description: '验证是否为整数（包括正负整数）',
        patterns: {
            javascript: '/^-?\\d+$/',
            python: 'r"^-?\\d+$"',
            php: '/^-?\\d+$/',
            java: '^-?\\d+$'
        }
    },

    // 文本格式类
    'chinese-name': {
        title: '中文姓名验证',
        description: '验证中文姓名（2-6个汉字）',
        patterns: {
            javascript: '/^[\\u4e00-\\u9fa5]{2,6}$/',
            python: 'r"^[\\u4e00-\\u9fa5]{2,6}$"',
            php: '/^[\\x{4e00}-\\x{9fa5}]{2,6}$/u',
            java: '^[\\u4e00-\\u9fa5]{2,6}$'
        }
    },
    'english-name': {
        title: '英文姓名验证',
        description: '验证英文姓名（支持空格和点号）',
        patterns: {
            javascript: '/^[a-zA-Z][a-zA-Z\\s\\.]{0,58}[a-zA-Z]$/',
            python: 'r"^[a-zA-Z][a-zA-Z\\s\\.]{0,58}[a-zA-Z]$"',
            php: '/^[a-zA-Z][a-zA-Z\\s\\.]{0,58}[a-zA-Z]$/',
            java: '^[a-zA-Z][a-zA-Z\\s\\.]{0,58}[a-zA-Z]$'
        }
    },
    'username': {
        title: '用户名验证',
        description: '验证用户名（字母开头，允许5-16字节，允许字母数字下划线）',
        patterns: {
            javascript: '/^[a-zA-Z][a-zA-Z0-9_]{4,15}$/',
            python: 'r"^[a-zA-Z][a-zA-Z0-9_]{4,15}$"',
            php: '/^[a-zA-Z][a-zA-Z0-9_]{4,15}$/',
            java: '^[a-zA-Z][a-zA-Z0-9_]{4,15}$'
        }
    },
    'password-strong': {
        title: '强密码验证',
        description: '验证密码强度（必须包含大小写字母和数字，可以包含特殊字符，长度8-16）',
        patterns: {
            javascript: '/^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*]{8,16}$/',
            python: 'r"^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*]{8,16}$"',
            php: '/^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*]{8,16}$/',
            java: '^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*]{8,16}$'
        }
    },

    // 特殊格式类
    'mac-address': {
        title: 'MAC地址验证',
        description: '验证MAC地址格式',
        patterns: {
            javascript: '/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/',
            python: 'r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"',
            php: '/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/',
            java: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
        }
    },
    'hex-color': {
        title: '16进制颜色验证',
        description: '验证16进制颜色代码',
        patterns: {
            javascript: '/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/',
            python: 'r"^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"',
            php: '/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/',
            java: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$'
        }
    },
    'version-number': {
        title: '版本号验证',
        description: '验证版本号格式（x.y.z）',
        patterns: {
            javascript: '/^\\d+\\.\\d+\\.\\d+$/',
            python: 'r"^\\d+\\.\\d+\\.\\d+$"',
            php: '/^\\d+\\.\\d+\\.\\d+$/',
            java: '^\\d+\\.\\d+\\.\\d+$'
        }
    }
};

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('regexModal');
    const closeBtn = document.querySelector('.close');
    const regexItems = document.querySelectorAll('.regex-item');
    const copyButtons = document.querySelectorAll('.copy-btn');

    // 点击正则表达式项显示模态框
    regexItems.forEach(item => {
        item.addEventListener('click', () => {
            const regexId = item.getAttribute('data-regex-id');
            const regexData = regexDatabase[regexId];
            
            if (regexData) {
                document.getElementById('modalTitle').textContent = regexData.title;
                document.getElementById('jsRegex').textContent = regexData.patterns.javascript;
                document.getElementById('pythonRegex').textContent = regexData.patterns.python;
                document.getElementById('phpRegex').textContent = regexData.patterns.php;
                document.getElementById('javaRegex').textContent = regexData.patterns.java;
                document.getElementById('regexDescription').textContent = regexData.description;
                
                modal.style.display = 'block';
            }
        });
    });

    // 关闭模态框
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });


    // 点击模态框外部关闭
    document.getElementById('donate-link').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'open-donate-modal',
            params: { toolName: 'regexp' }
        });
        return false;
    });

    document.getElementById('other-tools').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        chrome.runtime.openOptionsPage();
        return false;
    });

    // 复制按钮功能
    copyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const codeElement = document.getElementById(targetId);
            const text = codeElement.textContent;

            navigator.clipboard.writeText(text).then(() => {
                const originalText = button.textContent;
                button.textContent = '已复制！';
                button.style.backgroundColor = '#27ae60';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.backgroundColor = '#3498db';
                }, 2000);
            }).catch(err => {
                console.error('复制失败:', err);
                button.textContent = '复制失败';
                button.style.backgroundColor = '#e74c3c';
                
                setTimeout(() => {
                    button.textContent = '复制';
                    button.style.backgroundColor = '#3498db';
                }, 2000);
            });
        });
    });
});

// 搜索功能实现
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('regexSearch');
    const regexItems = document.querySelectorAll('.regex-item');

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        regexItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            const match = text.includes(searchTerm);
            
            item.classList.toggle('hidden', !match);
            item.classList.toggle('highlight', match && searchTerm !== '');
            
            // 处理分类标题的显示/隐藏
            const category = item.closest('.category');
            const visibleItems = category.querySelectorAll('.regex-item:not(.hidden)');
            category.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
    });

    // 添加清空搜索框的快捷键（ESC）
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            // 触发 input 事件以更新显示
            searchInput.dispatchEvent(new Event('input'));
        }
    });
});

// 正则可视化调试区域逻辑（升级版）
function parsePatternAndFlags(input) {
    // 自动识别 /pattern/flags 或 pattern
    const match = input.match(/^\s*\/(.*)\/(\w*)\s*$/);
    if (match) {
        return { pattern: match[1], flags: match[2] };
    }
    return { pattern: input, flags: '' };
}

function highlightMatchesV2(text, regex) {
    if (!text) return '';
    let lastIndex = 0;
    let result = '';
    let match;
    let hasMatch = false;
    regex.lastIndex = 0;
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
        hasMatch = true;
        count++;
        // 防止死循环
        if (match[0] === '') {
            result += text.slice(lastIndex);
            break;
        }
        result += text.slice(lastIndex, match.index);
        // 高亮主匹配内容
        let main = '<span class="visual-match">' + match[0] + '</span>';
        // 如果有分组，显示分组高亮
        if (match.length > 1) {
            let groupHtml = '';
            for (let i = 1; i < match.length; i++) {
                if (typeof match[i] === 'string') {
                    groupHtml += `<span class="visual-group">$${i}: ${match[i]}</span> `;
                }
            }
            main += '<span class="visual-group-list">' + groupHtml.trim() + '</span>';
        }
        result += main;
        lastIndex = match.index + match[0].length;
        if (!regex.global) break;
    }
    result += text.slice(lastIndex);
    return { html: hasMatch ? result : text, count };
}

document.addEventListener('DOMContentLoaded', function() {
    // 可视化调试相关
    const visualRegexPreset = document.getElementById('visualRegexPreset');
    const visualRegexInput = document.getElementById('visualRegex');
    const visualFlagsInput = document.getElementById('visualFlags');
    const visualTestText = document.getElementById('visualTestText');
    const visualTestBtn = document.getElementById('visualTestBtn');
    const visualResult = document.getElementById('visualResult');
    const visualErrorMsg = document.getElementById('visualErrorMsg');

    // 动态填充下拉框
    if (visualRegexPreset) {
        for (const key in regexDatabase) {
            if (regexDatabase[key].patterns && regexDatabase[key].patterns.javascript) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = regexDatabase[key].title;
                option.setAttribute('data-regex', regexDatabase[key].patterns.javascript);
                visualRegexPreset.appendChild(option);
            }
        }
        // 标志按钮组与隐藏input联动
        const flagCheckboxes = document.querySelectorAll('.visual-flags-group input[type="checkbox"]');
        function updateFlagsInputFromCheckbox() {
            let flags = '';
            flagCheckboxes.forEach(cb => { if (cb.checked) flags += cb.value; });
            visualFlagsInput.value = flags;
            doVisualTest();
        }
        flagCheckboxes.forEach(cb => {
            cb.addEventListener('change', updateFlagsInputFromCheckbox);
        });
        // input变化时同步按钮状态（如选择内置正则时）
        function updateCheckboxFromFlagsInput() {
            const flags = visualFlagsInput.value;
            flagCheckboxes.forEach(cb => { cb.checked = flags.includes(cb.value); });
        }
        // 修改下拉选择逻辑，选择后同步按钮状态
        visualRegexPreset.addEventListener('change', function() {
            const selectedKey = this.value;
            if (!selectedKey) return;
            const patternRaw = regexDatabase[selectedKey].patterns.javascript;
            const match = patternRaw.match(/^\/(.*)\/(\w*)$/);
            if (match) {
                visualRegexInput.value = match[1];
                visualFlagsInput.value = match[2];
            } else {
                visualRegexInput.value = patternRaw;
                visualFlagsInput.value = '';
            }
            updateCheckboxFromFlagsInput();
            if (typeof doVisualTest === 'function') doVisualTest();
        });
    }

    function doVisualTest() {
        let pattern = visualRegexInput.value.trim();
        let flags = visualFlagsInput.value.trim();
        // 自动识别 /pattern/flags
        if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
            const parsed = parsePatternAndFlags(pattern);
            pattern = parsed.pattern;
            if (!flags) flags = parsed.flags;
        }
        const testText = visualTestText.value;
        visualErrorMsg.textContent = '';
        visualErrorMsg.style.visibility = 'hidden';
        visualResult.innerHTML = '';
        if (!pattern) {
            visualErrorMsg.textContent = '请输入正则表达式';
            visualErrorMsg.style.visibility = 'visible';
            return;
        }
        // 新增：如果测试文本为空，直接返回，不做匹配
        if (!testText) {
            visualResult.innerHTML = '';
            visualErrorMsg.textContent = '';
            visualErrorMsg.style.visibility = 'hidden';
            return;
        }
        let regex;
        try {
            regex = new RegExp(pattern, flags);
        } catch (e) {
            visualErrorMsg.textContent = '正则表达式有误：' + e.message;
            visualErrorMsg.style.visibility = 'visible';
            return;
        }
        // 匹配并高亮
        const { html, count } = highlightMatchesV2(testText, regex);
        visualResult.innerHTML = html;
        // 匹配次数提示
        if (pattern && testText) {
            const tip = document.createElement('div');
            tip.style.margin = '8px 0 0 0';
            tip.style.color = '#2563eb';
            tip.style.fontSize = '0.98rem';
            tip.textContent = `共匹配 ${count} 处`;
            visualResult.appendChild(tip);
        }
    }

    visualTestBtn.addEventListener('click', doVisualTest);
    // 支持回车快捷测试
    [visualRegexInput, visualFlagsInput, visualTestText].forEach(el => {
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && (el !== visualTestText || e.ctrlKey || e.metaKey)) {
                doVisualTest();
                e.preventDefault();
            }
        });
    });

    // textarea内容变化时自动调试
    visualTestText.addEventListener('input', doVisualTest);

    // 页面加载时同步一次
    updateCheckboxFromFlagsInput();
});
