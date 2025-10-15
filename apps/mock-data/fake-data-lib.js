/**
 * 假数据生成器核心库
 * 提供各种类型的假数据生成功能
 */

class FakeDataGenerator {
    constructor() {
        this.init();
    }

    init() {
        // 中文姓氏
        this.surnames = [
            '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
            '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
            '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧'
        ];

        // 中文名字
        this.givenNames = [
            '伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军',
            '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞',
            '平', '刚', '桂英', '永', '健', '鑫', '帅', '莉', '凯', '浩',
            '宇', '琳', '雅', '欣', '晨', '阳', '雪', '晴', '萌', '悦'
        ];

        // 公司名称后缀
        this.companySuffixes = [
            '有限公司', '股份有限公司', '科技有限公司', '贸易有限公司',
            '实业有限公司', '投资有限公司', '集团有限公司', '控股有限公司',
            '发展有限公司', '建设有限公司', '咨询有限公司', '服务有限公司'
        ];

        // 公司名称前缀
        this.companyPrefixes = [
            '阿里巴巴', '腾讯', '百度', '京东', '美团', '字节跳动', '滴滴',
            '小米', '华为', '网易', '新浪', '搜狐', '爱奇艺', '快手',
            '拼多多', '携程', '途牛', '去哪儿', '58同城', '赶集网',
            '优酷', '土豆', '乐视', '暴风', '金山', '猎豹', '360',
            '蚂蚁金服', '陆金所', '恒生电子', '同花顺', '东方财富'
        ];

        // 部门名称
        this.departments = [
            '技术部', '产品部', '运营部', '市场部', '销售部', '人事部',
            '财务部', '行政部', '法务部', '客服部', '设计部', '测试部',
            '运维部', '数据部', '商务部', '品牌部', '公关部', '投资部'
        ];

        // 职位名称
        this.positions = [
            '前端工程师', '后端工程师', '全栈工程师', '移动端工程师', 'DevOps工程师',
            '产品经理', '项目经理', '技术经理', '运营专员', '市场专员',
            'UI设计师', 'UX设计师', '测试工程师', '数据分析师', '算法工程师',
            '架构师', 'CTO', 'CEO', 'COO', 'CFO', '总监', '主管', '专员'
        ];

        // 省份
        this.provinces = [
            '北京市', '上海市', '天津市', '重庆市', '河北省', '山西省',
            '辽宁省', '吉林省', '黑龙江省', '江苏省', '浙江省', '安徽省',
            '福建省', '江西省', '山东省', '河南省', '湖北省', '湖南省',
            '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
            '甘肃省', '青海省', '台湾省', '内蒙古自治区', '广西壮族自治区',
            '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区'
        ];

        // 城市
        this.cities = [
            '北京', '上海', '广州', '深圳', '杭州', '南京', '武汉', '成都',
            '西安', '郑州', '青岛', '大连', '宁波', '厦门', '福州', '长沙',
            '济南', '重庆', '天津', '苏州', '无锡', '石家庄', '太原', '沈阳',
            '长春', '哈尔滨', '合肥', '南昌', '昆明', '贵阳', '兰州', '银川'
        ];

        // User Agent 列表
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ];

        // MIME 类型
        this.mimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'text/html', 'text/css', 'text/javascript', 'text/plain', 'text/csv',
            'application/json', 'application/xml', 'application/pdf', 'application/zip',
            'video/mp4', 'video/webm', 'audio/mp3', 'audio/wav', 'audio/ogg'
        ];

        // 文件扩展名
        this.fileExtensions = [
            'jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx',
            'ppt', 'pptx', 'txt', 'csv', 'json', 'xml', 'zip', 'rar',
            'mp4', 'avi', 'mov', 'mp3', 'wav', 'html', 'css', 'js'
        ];

        // 域名后缀
        this.domainSuffixes = [
            'com', 'cn', 'net', 'org', 'edu', 'gov', 'mil', 'int',
            'com.cn', 'net.cn', 'org.cn', 'edu.cn', 'gov.cn'
        ];

        // 邮箱域名
        this.emailDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', '163.com',
            '126.com', 'qq.com', 'sina.com', 'sohu.com', 'foxmail.com',
            'aliyun.com', 'yeah.net', 'vip.sina.com', 'vip.163.com'
        ];
    }

    // 生成随机整数
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 生成随机浮点数
    randomFloat(min, max, precision = 2) {
        const num = Math.random() * (max - min) + min;
        return parseFloat(num.toFixed(precision));
    }

    // 从数组中随机选择一个元素
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 生成随机字符串
    randomString(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    // 生成中文姓名
    generateName() {
        const surname = this.randomChoice(this.surnames);
        const givenNameLength = Math.random() > 0.7 ? 2 : 1; // 70%概率生成双字名
        let givenName = '';
        for (let i = 0; i < givenNameLength; i++) {
            givenName += this.randomChoice(this.givenNames);
        }
        return surname + givenName;
    }

    // 生成邮箱
    generateEmail() {
        const username = this.randomString(this.randomInt(6, 12));
        const domain = this.randomChoice(this.emailDomains);
        return `${username}@${domain}`;
    }

    // 生成手机号
    generatePhone() {
        const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
                         '150', '151', '152', '153', '155', '156', '157', '158', '159',
                         '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
        const prefix = this.randomChoice(prefixes);
        const suffix = this.randomString(8, '0123456789');
        return prefix + suffix;
    }

    // 生成身份证号
    generateIdCard() {
        // 地区码（简化）
        const areaCodes = ['110000', '120000', '130000', '140000', '150000', '210000', '220000', '230000'];
        const areaCode = this.randomChoice(areaCodes);
        
        // 生日（1970-2000年）
        const year = this.randomInt(1970, 2000);
        const month = this.randomInt(1, 12).toString().padStart(2, '0');
        const day = this.randomInt(1, 28).toString().padStart(2, '0');
        const birthday = `${year}${month}${day}`;
        
        // 顺序码
        const sequence = this.randomInt(100, 999).toString();
        
        // 校验码（简化为随机）
        const checkCode = this.randomChoice(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'X']);
        
        return areaCode.substring(0, 6) + birthday + sequence + checkCode;
    }

    // 生成性别
    generateGender() {
        return Math.random() > 0.5 ? '男' : '女';
    }

    // 生成年龄
    generateAge() {
        return this.randomInt(18, 65);
    }

    // 生成生日
    generateBirthday() {
        const year = this.randomInt(1960, 2005);
        const month = this.randomInt(1, 12);
        const day = this.randomInt(1, 28);
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    // 生成地址
    generateAddress() {
        const province = this.randomChoice(this.provinces);
        const city = this.randomChoice(this.cities);
        const district = this.randomChoice(['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '石景山区']);
        const street = this.randomString(2, '一二三四五六七八九十') + '街道';
        const number = this.randomInt(1, 999) + '号';
        return `${province}${city}${district}${street}${number}`;
    }

    // 生成公司名称
    generateCompany() {
        const prefix = this.randomChoice(this.companyPrefixes);
        const suffix = this.randomChoice(this.companySuffixes);
        return prefix + suffix;
    }

    // 生成部门
    generateDepartment() {
        return this.randomChoice(this.departments);
    }

    // 生成职位
    generatePosition() {
        return this.randomChoice(this.positions);
    }

    // 生成薪资
    generateSalary() {
        return this.randomInt(5000, 50000);
    }

    // 生成银行卡号
    generateBankCard() {
        const prefixes = ['6225', '6222', '6228', '6229', '6227', '6223', '6226'];
        const prefix = this.randomChoice(prefixes);
        const suffix = this.randomString(12, '0123456789');
        return prefix + suffix;
    }

    // 生成信用卡号
    generateCreditCard() {
        const prefixes = ['4', '5', '6'];
        const prefix = this.randomChoice(prefixes);
        const suffix = this.randomString(15, '0123456789');
        return prefix + suffix;
    }

    // 生成价格
    generatePrice() {
        return this.randomFloat(0.01, 9999.99);
    }

    // 生成货币
    generateCurrency() {
        const currencies = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'HKD', 'SGD'];
        return this.randomChoice(currencies);
    }

    // 生成UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 生成IP地址
    generateIP() {
        return `${this.randomInt(1, 255)}.${this.randomInt(0, 255)}.${this.randomInt(0, 255)}.${this.randomInt(1, 255)}`;
    }

    // 生成MAC地址
    generateMAC() {
        const chars = '0123456789ABCDEF';
        let mac = '';
        for (let i = 0; i < 6; i++) {
            if (i > 0) mac += ':';
            mac += this.randomString(2, chars);
        }
        return mac;
    }

    // 生成User Agent
    generateUserAgent() {
        return this.randomChoice(this.userAgents);
    }

    // 生成URL
    generateURL() {
        const protocols = ['http', 'https'];
        const domains = ['example.com', 'test.com', 'demo.com', 'sample.org', 'mock.net'];
        const paths = ['/', '/home', '/about', '/contact', '/products', '/services', '/blog'];
        
        const protocol = this.randomChoice(protocols);
        const domain = this.randomChoice(domains);
        const path = this.randomChoice(paths);
        
        return `${protocol}://${domain}${path}`;
    }

    // 生成域名
    generateDomain() {
        const name = this.randomString(this.randomInt(5, 15));
        const suffix = this.randomChoice(this.domainSuffixes);
        return `${name}.${suffix}`;
    }

    // 生成密码
    generatePassword() {
        const length = this.randomInt(8, 16);
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        return this.randomString(length, chars);
    }

    // 生成Token
    generateToken() {
        return this.randomString(32, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
    }

    // 生成颜色值
    generateColor() {
        return '#' + this.randomString(6, '0123456789ABCDEF');
    }

    // 生成时间戳
    generateTimestamp() {
        const now = Date.now();
        const offset = this.randomInt(-365 * 24 * 60 * 60 * 1000, 365 * 24 * 60 * 60 * 1000);
        return now + offset;
    }

    // 生成文件名
    generateFilename() {
        const name = this.randomString(this.randomInt(5, 15));
        const ext = this.randomChoice(this.fileExtensions);
        return `${name}.${ext}`;
    }

    // 生成MIME类型
    generateMimeType() {
        return this.randomChoice(this.mimeTypes);
    }

    // 生成布尔值
    generateBoolean() {
        return Math.random() > 0.5;
    }

    // 生成日期
    generateDate() {
        const start = new Date(2020, 0, 1);
        const end = new Date();
        const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(timestamp).toISOString().split('T')[0];
    }

    // 根据字段类型生成数据
    generateByType(type) {
        const generators = {
            name: () => this.generateName(),
            email: () => this.generateEmail(),
            phone: () => this.generatePhone(),
            idCard: () => this.generateIdCard(),
            gender: () => this.generateGender(),
            age: () => this.generateAge(),
            birthday: () => this.generateBirthday(),
            address: () => this.generateAddress(),
            company: () => this.generateCompany(),
            department: () => this.generateDepartment(),
            position: () => this.generatePosition(),
            salary: () => this.generateSalary(),
            bankCard: () => this.generateBankCard(),
            creditCard: () => this.generateCreditCard(),
            price: () => this.generatePrice(),
            currency: () => this.generateCurrency(),
            uuid: () => this.generateUUID(),
            ip: () => this.generateIP(),
            mac: () => this.generateMAC(),
            userAgent: () => this.generateUserAgent(),
            url: () => this.generateURL(),
            domain: () => this.generateDomain(),
            password: () => this.generatePassword(),
            token: () => this.generateToken(),
            color: () => this.generateColor(),
            timestamp: () => this.generateTimestamp(),
            filename: () => this.generateFilename(),
            mimeType: () => this.generateMimeType(),
            boolean: () => this.generateBoolean(),
            date: () => this.generateDate()
        };

        return generators[type] ? generators[type]() : null;
    }
}

// 导出为全局变量
window.FakeDataGenerator = FakeDataGenerator; 