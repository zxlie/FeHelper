// 页面已经被嵌套在chrome extension的iframe中，所以可以去除掉页面上的一些元素
if (window.self !== window.top && location.host === 'www.remove.bg') {
    try {
        // 隐藏不必要的元素，让页面变得干净
        let styleEl = document.createElement('style');
        styleEl.innerHTML = `
            nav,
            div.grecaptcha-badge,
            div.colorlib-featured,
            div.colorlib-services,
            footer { display:none; }
        `;
        document.body.appendChild(styleEl);

        // 页面文字汉化，友好一些
        let containerEl = document.querySelector('#home .container');
        // 主标题
        containerEl.querySelector('h2').innerHTML = '人物背景抠图，轻松搞定！';
        // 副标题
        Array.from(containerEl.querySelectorAll('p'))[0].innerHTML = '上传带有人物的图片，这个工具会自动帮你把人物从背景中抠出来！';

        // 按钮区域
        let pEl2 = Array.from(containerEl.querySelectorAll('p'))[1];
        Array.from(pEl2.querySelectorAll('a'))[0].innerHTML = '上传照片';
        Array.from(pEl2.querySelectorAll('a'))[1].innerHTML = '填写一个图片URL';

    } catch (e) {
        console.log('Maybe，源站改版了：', e);
    }
}