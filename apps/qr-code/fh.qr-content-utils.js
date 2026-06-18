function cleanFieldValue(value, options = {}) {
    const stripEndingPunctuation = options.stripEndingPunctuation !== false;
    let text = String(value || '')
        .trim()
        .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
        .trim();
    if (stripEndingPunctuation) {
        text = text.replace(/[。.]$/g, '').trim();
    }
    return text;
}

function findFirstValueDelimiter(text, start) {
    const match = /[,，;；。\n]/.exec(text.slice(start));
    return match ? start + match.index : text.length;
}

function findNextFieldBoundary(text, start, stopLabels = []) {
    let end = text.length;
    for (const label of stopLabels) {
        const pattern = new RegExp(`[\\s,，;；。:：\\n]+(?:${label})\\s*(?:=|:|：|是|为)\\s*`, 'i');
        const match = pattern.exec(text.slice(start));
        if (match) {
            end = Math.min(end, start + match.index);
        }
    }
    return end;
}

function readLabeledValue(source, labelPatterns, options = {}) {
    const text = String(source || '');
    for (const label of labelPatterns) {
        const pattern = new RegExp(`(?:^|[\\s,，;；。:：\\n])(?:${label})\\s*(?:=|:|：|是|为)\\s*`, 'i');
        const match = text.match(pattern);
        if (match) {
            const start = match.index + match[0].length;
            const end = options.untilEnd
                ? findNextFieldBoundary(text, start, options.stopLabels || [])
                : findFirstValueDelimiter(text, start);
            const value = cleanFieldValue(text.slice(start, end), options);
            if (value) return value;
        }
    }
    return '';
}

const WIFI_LABELS = {
    ssid: [
        'SSID',
        'Wi\\s*-?\\s*Fi\\s*名称',
        'wifi\\s*名称',
        '无线\\s*名称',
        '网络\\s*名称'
    ],
    password: ['密码', 'password', 'pwd', 'pass'],
    security: ['加密', '安全类型', '安全', '认证', '类型']
};

const CONTACT_LABELS = {
    name: ['姓名', '名字', '联系人', '名称', 'name', 'fn'],
    company: ['公司', '组织', '单位', 'org', 'company'],
    title: ['职位', '职务', '岗位', 'title'],
    phone: ['手机号', '手机', '电话', '号码', 'tel', 'phone'],
    email: ['邮箱', '邮件', 'email', 'mail'],
    url: ['网址', '网站', '主页', 'url', 'website'],
    address: ['地址', '办公地址', 'address', 'adr']
};

const EVENT_LABELS = {
    title: ['标题', '主题', '名称', 'summary', 'title'],
    start: ['开始时间', '开始', '起始时间', 'start', 'dtstart'],
    end: ['结束时间', '结束', '截止时间', 'end', 'dtend'],
    location: ['地点', '位置', '地址', 'location'],
    description: ['说明', '描述', '内容', 'description', 'desc']
};

const SMS_LABELS = {
    phone: ['手机号', '手机', '电话', '号码', '收件人', 'to', 'phone', 'tel', 'number'],
    body: ['短信内容', '内容', '正文', 'message', 'body', 'text']
};

const EMAIL_LABELS = {
    to: ['收件人邮箱', '收件人', '邮箱', 'email', 'mail', 'to'],
    subject: ['主题', '标题', 'subject'],
    body: ['正文', '内容', 'body', 'message', 'text']
};

const LOCATION_LABELS = {
    address: ['地址', '位置', '地点', 'address', 'location', 'q'],
    latitude: ['纬度', 'lat', 'latitude'],
    longitude: ['经度', 'lng', 'lon', 'longitude'],
    coordinates: ['经纬度', '坐标', 'coordinates', 'coord']
};

function flattenLabels(labelMap) {
    return Object.values(labelMap).flat();
}

function isNoPasswordValue(value) {
    return /^(无|无密码|不需要|无需|none|no|nopass|open|开放)$/i.test(cleanFieldValue(value));
}

function normalizeWifiEncryption(value, password) {
    const raw = cleanFieldValue(value).toLowerCase();
    if (isNoPasswordValue(raw) || isNoPasswordValue(password) || /不加密|开放网络|open network/i.test(raw)) {
        return 'nopass';
    }
    if (/wep/i.test(raw)) return 'WEP';
    if (/wpa|wpa2|wpa3|psk|personal/i.test(raw)) return 'WPA';
    return cleanFieldValue(password) ? 'WPA' : 'nopass';
}

function escapeWifiValue(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/:/g, '\\:')
        .replace(/"/g, '\\"');
}

function formatWifiQrContent(fields) {
    const ssid = escapeWifiValue(fields.ssid);
    const security = fields.security || 'WPA';
    if (security === 'nopass') {
        return `WIFI:S:${ssid};T:nopass;;`;
    }
    return `WIFI:S:${ssid};T:${security};P:${escapeWifiValue(fields.password)};;`;
}

function buildWifiQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(wi\s*-?\s*fi|wifi|无线|ssid)/i.test(text)) {
        return null;
    }

    const ssid = readLabeledValue(text, WIFI_LABELS.ssid);
    const passwordValue = readLabeledValue(text, WIFI_LABELS.password);
    const securityValue = readLabeledValue(text, WIFI_LABELS.security);
    const security = normalizeWifiEncryption(securityValue, passwordValue);
    const password = isNoPasswordValue(passwordValue) ? '' : passwordValue;
    const missing = [];

    if (!ssid) {
        missing.push('Wi-Fi 名称（SSID）');
    }
    if (security !== 'nopass' && !password) {
        missing.push('Wi-Fi 密码');
    }

    if (missing.length) {
        return {
            type: 'wifi',
            missing
        };
    }

    return {
        type: 'wifi',
        content: formatWifiQrContent({ssid, password, security}),
        summary: security === 'nopass'
            ? `已生成 Wi-Fi 二维码内容：SSID=${ssid}，无密码。`
            : `已生成 Wi-Fi 二维码内容：SSID=${ssid}，加密=${security}。`
    };
}

function escapeVCardText(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function formatVCardContent(fields) {
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${escapeVCardText(fields.name)};;;;`,
        `FN:${escapeVCardText(fields.name)}`
    ];
    if (fields.company) lines.push(`ORG:${escapeVCardText(fields.company)}`);
    if (fields.title) lines.push(`TITLE:${escapeVCardText(fields.title)}`);
    if (fields.phone) lines.push(`TEL;TYPE=CELL:${fields.phone}`);
    if (fields.email) lines.push(`EMAIL;TYPE=INTERNET:${fields.email}`);
    if (fields.url) lines.push(`URL:${fields.url}`);
    if (fields.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(fields.address)};;;;`);
    lines.push('END:VCARD');
    return lines.join('\n');
}

function buildContactQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(名片|联系人|vcard|vcf|姓名)/i.test(text)) {
        return null;
    }
    const stopLabels = flattenLabels(CONTACT_LABELS);
    const fields = {
        name: readLabeledValue(text, CONTACT_LABELS.name),
        company: readLabeledValue(text, CONTACT_LABELS.company, {untilEnd: true, stopLabels}),
        title: readLabeledValue(text, CONTACT_LABELS.title, {untilEnd: true, stopLabels}),
        phone: normalizePhoneNumber(readLabeledValue(text, CONTACT_LABELS.phone)),
        email: readLabeledValue(text, CONTACT_LABELS.email),
        url: readLabeledValue(text, CONTACT_LABELS.url, {untilEnd: true, stopLabels}),
        address: readLabeledValue(text, CONTACT_LABELS.address, {untilEnd: true, stopLabels})
    };
    const missing = [];
    if (!fields.name) missing.push('姓名');
    if (missing.length) return {type: 'contact', missing};
    return {
        type: 'contact',
        content: formatVCardContent(fields),
        summary: `已生成名片二维码内容：${fields.name}。`
    };
}

function normalizePhoneNumber(value) {
    return cleanFieldValue(value, {stripEndingPunctuation: false})
        .replace(/[()\s.-]/g, '');
}

function formatSmsQrContent(fields) {
    const phone = normalizePhoneNumber(fields.phone);
    const body = encodeURIComponent(fields.body);
    return fields.body ? `sms:${phone}?body=${body}` : `sms:${phone}`;
}

function buildSmsQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(短信|sms|smsto)/i.test(text)) {
        return null;
    }
    const stopLabels = flattenLabels(SMS_LABELS);
    const phone = readLabeledValue(text, SMS_LABELS.phone);
    const body = readLabeledValue(text, SMS_LABELS.body, {untilEnd: true, stopLabels});
    const missing = [];
    if (!phone) missing.push('手机号');
    if (!body) missing.push('短信内容');
    if (missing.length) return {type: 'sms', missing};
    return {
        type: 'sms',
        content: formatSmsQrContent({phone, body}),
        summary: `已生成短信二维码内容：手机号=${normalizePhoneNumber(phone)}。`
    };
}

function encodeMailAddressList(value) {
    return String(value || '')
        .replace(/\s+/g, '')
        .split(',')
        .map(item => encodeURIComponent(item).replace(/%40/g, '@').replace(/%2B/g, '+'))
        .join(',');
}

function formatEmailQrContent(fields) {
    const params = [];
    if (fields.subject) params.push(`subject=${encodeURIComponent(fields.subject)}`);
    if (fields.body) params.push(`body=${encodeURIComponent(fields.body)}`);
    const suffix = params.length ? `?${params.join('&')}` : '';
    return `mailto:${encodeMailAddressList(fields.to)}${suffix}`;
}

function buildEmailQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(邮件|email|mailto)/i.test(text)) {
        return null;
    }
    const stopLabels = flattenLabels(EMAIL_LABELS);
    const fields = {
        to: readLabeledValue(text, EMAIL_LABELS.to),
        subject: readLabeledValue(text, EMAIL_LABELS.subject, {untilEnd: true, stopLabels}),
        body: readLabeledValue(text, EMAIL_LABELS.body, {untilEnd: true, stopLabels})
    };
    const missing = [];
    if (!fields.to) missing.push('收件人邮箱');
    if (missing.length) return {type: 'email', missing};
    return {
        type: 'email',
        content: formatEmailQrContent(fields),
        summary: `已生成邮件二维码内容：收件人=${fields.to}。`
    };
}

function escapeICalText(value) {
    return String(value || '')
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,');
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function parseEventDateTime(value) {
    const text = cleanFieldValue(value);
    let match = text.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?$/);
    if (match) {
        return match[4]
            ? {value: `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}${match[6] || '00'}`, type: 'date-time'}
            : {value: `${match[1]}${match[2]}${match[3]}`, type: 'date'};
    }
    match = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?(?:\s+(\d{1,2})(?::|点)(\d{1,2})?(?::(\d{1,2}))?)?$/);
    if (!match) return null;
    const date = `${match[1]}${pad2(match[2])}${pad2(match[3])}`;
    if (!match[4]) return {value: date, type: 'date'};
    return {
        value: `${date}T${pad2(match[4])}${pad2(match[5] || '0')}${pad2(match[6] || '0')}`,
        type: 'date-time'
    };
}

function formatDateStamp(date = new Date()) {
    return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`;
}

function formatEventQrContent(fields, now = new Date()) {
    const start = parseEventDateTime(fields.start);
    const end = fields.end ? parseEventDateTime(fields.end) : null;
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FeHelper//QR Code//CN',
        'BEGIN:VEVENT',
        `UID:${encodeURIComponent(fields.title)}-${start.value}@fehelper.local`,
        `DTSTAMP:${formatDateStamp(now)}`,
        start.type === 'date'
            ? `DTSTART;VALUE=DATE:${start.value}`
            : `DTSTART:${start.value}`
    ];
    if (end) {
        lines.push(end.type === 'date'
            ? `DTEND;VALUE=DATE:${end.value}`
            : `DTEND:${end.value}`);
    }
    lines.push(`SUMMARY:${escapeICalText(fields.title)}`);
    if (fields.location) lines.push(`LOCATION:${escapeICalText(fields.location)}`);
    if (fields.description) lines.push(`DESCRIPTION:${escapeICalText(fields.description)}`);
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
}

function buildEventQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(日程|日历|事件|会议|活动|VEVENT|calendar|event)/i.test(text)) {
        return null;
    }
    const stopLabels = flattenLabels(EVENT_LABELS);
    const fields = {
        title: readLabeledValue(text, EVENT_LABELS.title, {untilEnd: true, stopLabels}),
        start: readLabeledValue(text, EVENT_LABELS.start, {untilEnd: true, stopLabels}),
        end: readLabeledValue(text, EVENT_LABELS.end, {untilEnd: true, stopLabels}),
        location: readLabeledValue(text, EVENT_LABELS.location, {untilEnd: true, stopLabels}),
        description: readLabeledValue(text, EVENT_LABELS.description, {untilEnd: true, stopLabels})
    };
    const missing = [];
    if (!fields.title) missing.push('标题');
    if (!fields.start) missing.push('开始时间');
    if (fields.start && !parseEventDateTime(fields.start)) missing.push('可识别的开始时间');
    if (fields.end && !parseEventDateTime(fields.end)) missing.push('可识别的结束时间');
    if (missing.length) return {type: 'event', missing};
    return {
        type: 'event',
        content: formatEventQrContent(fields),
        summary: `已生成日程二维码内容：${fields.title}。`
    };
}

function parseCoordinatePair(text) {
    const pairLabel = LOCATION_LABELS.coordinates.join('|');
    let match = String(text || '').match(new RegExp(`(?:${pairLabel})\\s*(?:=|:|：|是|为)\\s*(-?\\d+(?:\\.\\d+)?)\\s*[,，]\\s*(-?\\d+(?:\\.\\d+)?)`, 'i'));
    if (match) return {lat: match[1], lng: match[2]};
    const lat = readLabeledValue(text, LOCATION_LABELS.latitude);
    const lng = readLabeledValue(text, LOCATION_LABELS.longitude);
    return lat && lng ? {lat, lng} : null;
}

function isValidCoordinate(lat, lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return Number.isFinite(latNum) && Number.isFinite(lngNum) &&
        latNum >= -90 && latNum <= 90 &&
        lngNum >= -180 && lngNum <= 180;
}

function formatLocationQrContent(fields) {
    if (fields.lat && fields.lng) {
        return `geo:${fields.lat},${fields.lng}`;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(fields.address)}`;
}

function buildLocationQrContentFromDescription(description) {
    const text = String(description || '');
    if (!/(位置|经纬度|坐标|地图|地址|geo|location)/i.test(text)) {
        return null;
    }
    const coordinates = parseCoordinatePair(text);
    if (coordinates) {
        if (!isValidCoordinate(coordinates.lat, coordinates.lng)) {
            return {type: 'location', missing: ['有效经纬度']};
        }
        return {
            type: 'location',
            content: formatLocationQrContent(coordinates),
            summary: `已生成位置二维码内容：${coordinates.lat},${coordinates.lng}。`
        };
    }
    const address = readLabeledValue(text, LOCATION_LABELS.address, {
        untilEnd: true,
        stopLabels: flattenLabels(LOCATION_LABELS)
    });
    if (!address) return {type: 'location', missing: ['地址或经纬度']};
    return {
        type: 'location',
        content: formatLocationQrContent({address}),
        summary: `已生成位置二维码内容：${address}。`
    };
}

function buildQrContentFromDescription(description) {
    return buildWifiQrContentFromDescription(description) ||
        buildContactQrContentFromDescription(description) ||
        buildEventQrContentFromDescription(description) ||
        buildSmsQrContentFromDescription(description) ||
        buildEmailQrContentFromDescription(description) ||
        buildLocationQrContentFromDescription(description);
}

export {
    buildContactQrContentFromDescription,
    buildEmailQrContentFromDescription,
    buildEventQrContentFromDescription,
    buildLocationQrContentFromDescription,
    buildQrContentFromDescription,
    buildSmsQrContentFromDescription,
    buildWifiQrContentFromDescription,
    escapeWifiValue,
    formatEmailQrContent,
    formatEventQrContent,
    formatLocationQrContent,
    formatSmsQrContent,
    formatVCardContent,
    formatWifiQrContent
};
