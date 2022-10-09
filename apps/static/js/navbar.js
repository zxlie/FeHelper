/**
 * FeHelper Online版顶部导航栏
 * @author zhaoxianlie
 */
let Navbar = (function () {

    let tools = [
        {'index': '首页'},
        {'json-format': 'JSON美化'},
        {'json-diff': 'JSON比对'},
        {'en-decode': '编码转换'},
        {'qr-code': '二维码/解码'},
        {'image-base64': '图片Base64'},
        {'code-beautify': '代码美化'},
        {'more': '更多FH工具&gt;&gt;'}
    ];

    // 页面Header
    let htmlHeader = `<div class="mod-pageheader">
        <div class="mod-sitedesc mod-fehelper">
            <div class="logo-box"><span class="q-logo"><img src="https://static.baidufe.com/fehelper/static/img/fe-128.png" title="WEB前端助手（FeHelper）" alt="WEB前端助手（FeHelper）"></span> 
            </div>
            <div class="mod-btitle">
                <div class="x-name"><a href="/fehelper/index/index.html">FeHelper ( 浏览器插件 )</a><button id="btnInstallExtension" style="display: none"></button></div>
                <div class="x-desc">2011年，FeHelper作为开发者专用的Chrome浏览器扩展在Google Chrome Webstore发布1.0版本，截至目前持续更新中，欢迎大家安装使用！</div>
            </div>
        </div>
        <div class="mod-topbar" id="modTopbar">
            <div class="wrapper-box clearfix">
                <div class="mainnav-box"><ul class="q-menubox">#fe-menus-here#</ul></div>
                <div class="subnav-box">
                    <ul class="q-navbox">
                        <li class="q-navitem">
                            <a href="/fehelper/feedback.html" class="x-fbk"><span>意见反馈&gt;&gt;</span></a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>`.replace(/\n+|\s{2,}/gm, ' ').replace('#fe-menus-here#', tools.map(t => {
        let k = Object.keys(t)[0];
        let theUrl = `/fehelper/${k}/index.html`;
        let selected = '';
        if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
            let curTool = location.pathname.split('/').slice(-2).shift() || 'fehelper';
            selected = k === curTool ? 'q-selected' : '';
            theUrl = `${curTool === 'fehelper' ? '../fehelper' : '..'}/${k}/index.html`;
        }
        return `<li class="q-menuitem ${selected}"><a href="${theUrl}">${t[k]}</a></li>`;
    }).join(`<li class="q-sp">|</li>`));


    if (typeof window !== 'undefined') {
        // 页面上还没有pageheader，那就添加一个
        if (!document.querySelectorAll('#pageContainer>div.mod-pageheader').length) {
            let wrapper = document.createElement('div');
            wrapper.innerHTML = htmlHeader;
            let target = document.querySelector('#pageContainer');
            target.insertBefore(wrapper.childNodes[0], target.firstChild);
        } else {
            // 如果已经有了，就更新各个Menu的选中状态
            let curTool = location.pathname.split('/').slice(-2).shift() || 'fehelper';
            let el = document.querySelector(`li.q-menuitem a[href$="${curTool}/index.html"]`);
            el.parentNode.classList.add('q-selected');
        }
    }

    return {htmlHeader, tools}
})();

// 这是给gulp用的
if (typeof module !== 'undefined') {
    module.exports = Navbar;
}