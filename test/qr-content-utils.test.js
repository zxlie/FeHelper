import { describe, expect, it } from 'vitest';
import {
    buildQrContentFromDescription,
    buildSmsQrContentFromDescription,
    escapeWifiValue
} from '../apps/qr-code/fh.qr-content-utils.js';

describe('QR content utilities', () => {
    it('builds Wi-Fi QR content from labeled Chinese input', () => {
        const result = buildQrContentFromDescription('生成 Wi-Fi 二维码：SSID=1，密码=111，加密=WPA。');

        expect(result).toEqual(expect.objectContaining({
            type: 'wifi',
            content: 'WIFI:S:1;T:WPA;P:111;;'
        }));
        expect(result.summary).toContain('SSID=1');
        expect(result.missing).toBeUndefined();
    });

    it('does not claim SSID is missing when SSID is provided', () => {
        const result = buildQrContentFromDescription('Wi-Fi 名称=office，password=12345678，安全类型=WPA2');

        expect(result.content).toBe('WIFI:S:office;T:WPA;P:12345678;;');
        expect(result.missing).toBeUndefined();
    });

    it('asks for SSID only when a Wi-Fi request really lacks it', () => {
        const result = buildQrContentFromDescription('生成 Wi-Fi 二维码：密码=111，加密=WPA。');

        expect(result.content).toBeUndefined();
        expect(result.missing).toContain('Wi-Fi 名称（SSID）');
    });

    it('supports open Wi-Fi networks and escapes special characters', () => {
        const open = buildQrContentFromDescription('生成 Wi-Fi 二维码：SSID=guest:1，密码=无，加密=无密码。');

        expect(open.content).toBe('WIFI:S:guest\\:1;T:nopass;;');
        expect(escapeWifiValue('a;b,c:d\\e')).toBe('a\\;b\\,c\\:d\\\\e');
    });

    it('ignores ordinary text that is not a supported structured QR request', () => {
        expect(buildQrContentFromDescription('https://fehelper.com')).toBeNull();
    });

    it('builds SMS URI with encoded body instead of phone-only content', () => {
        const result = buildSmsQrContentFromDescription('生成短信二维码：手机号=13800138000，内容=你好，明天见。');

        expect(result).toEqual(expect.objectContaining({
            type: 'sms',
            content: 'sms:13800138000?body=%E4%BD%A0%E5%A5%BD%EF%BC%8C%E6%98%8E%E5%A4%A9%E8%A7%81'
        }));
        expect(result.content).not.toBe('sms:13800138000');
        expect(result.content).not.toContain('SMSTO');
    });

    it('builds vCard 3.0 content for contact QR tags', () => {
        const result = buildQrContentFromDescription('生成联系人二维码：姓名=张三，公司=FeHelper，手机=13800138000，邮箱=a@example.com，网址=https://fehelper.com。');

        expect(result.type).toBe('contact');
        expect(result.content).toContain('BEGIN:VCARD');
        expect(result.content).toContain('VERSION:3.0');
        expect(result.content).toContain('FN:张三');
        expect(result.content).toContain('TEL;TYPE=CELL:13800138000');
        expect(result.content).toContain('EMAIL;TYPE=INTERNET:a@example.com');
        expect(result.content).toContain('URL:https://fehelper.com');
        expect(result.content).toContain('END:VCARD');
    });

    it('builds iCalendar VEVENT content for event QR tags', () => {
        const result = buildQrContentFromDescription('生成日程二维码：标题=项目会，地点=会议室A，开始时间=2026-06-18 10:30，结束时间=2026-06-18 11:00。');

        expect(result.type).toBe('event');
        expect(result.content).toContain('BEGIN:VCALENDAR');
        expect(result.content).toContain('VERSION:2.0');
        expect(result.content).toContain('BEGIN:VEVENT');
        expect(result.content).toContain('DTSTART:20260618T103000');
        expect(result.content).toContain('DTEND:20260618T110000');
        expect(result.content).toContain('SUMMARY:项目会');
        expect(result.content).toContain('LOCATION:会议室A');
        expect(result.content).toContain('END:VCALENDAR');
    });

    it('builds mailto URI with subject and body for email QR tags', () => {
        const result = buildQrContentFromDescription('生成邮件二维码：收件人=a+tag@example.com，主题=测试邮件，正文=你好 FeHelper。');

        expect(result.type).toBe('email');
        expect(result.content).toBe('mailto:a+tag@example.com?subject=%E6%B5%8B%E8%AF%95%E9%82%AE%E4%BB%B6&body=%E4%BD%A0%E5%A5%BD%20FeHelper');
    });

    it('builds geo URI for coordinates and map search URL for address', () => {
        const geo = buildQrContentFromDescription('生成位置二维码：经纬度=31.2304,121.4737。');
        const address = buildQrContentFromDescription('生成位置二维码：地址=上海市黄浦区人民广场。');

        expect(geo.type).toBe('location');
        expect(geo.content).toBe('geo:31.2304,121.4737');
        expect(address.type).toBe('location');
        expect(address.content).toBe('https://maps.google.com/?q=%E4%B8%8A%E6%B5%B7%E5%B8%82%E9%BB%84%E6%B5%A6%E5%8C%BA%E4%BA%BA%E6%B0%91%E5%B9%BF%E5%9C%BA');
    });
});
