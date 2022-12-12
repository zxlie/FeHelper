window.FileTpl = {
    // 配置文件
    'fh-config.js': `{
    "#toolName#" : {
        "name": "#toolFullName#",
        "tips": "我是 #toolName# 的描述信息！你可以在这里修改！",
        "icon": "#toolIcon#",
        "contentScript": #contentScript#,
        "noPage": #noPage#,
        "updateUrl":"#updateUrl#"
    }
}`,

    // 主入口文件
    'index.html': `<!DOCTYPE html>
<html>
<head>
	<title>#toolName#</title>
	<link rel="stylesheet" type="text/css" href="index.css">
</head>
<body>
	#toolName#
	<script type="text/javascript" src="index.js"></script>
</body>
</html>`,

    // 内容脚本
    'content-script.js': `/**
 * 注意这里的方法名称，不要改！不要改！不要改！
 */
window.#toolNameLower#ContentScript = function () {
    console.log('你好，我是来自FeHelper的工具：#toolName#！');
};`,

    // noPage为true时需要追加的内容脚本
    'noPage.js': `/**
 * 如果在 fh-config.js 中指定了 noPage参数为true，则这里必须定义noPage的接口方法，如：
 * 注意这里的方法名称，不要改！不要改！不要改！
 */
window.#toolNameLower#NoPage = function (tabInfo) {
    alert('你好，我是来自FeHelper的工具：#toolName#！你可以打开控制台看Demo的输出！');
    console.log('你好，我是来自FeHelper的工具：#toolName#', tabInfo);
};`,

    // index.js & index.css
    "index.js": `/* code here... */\n`,
    "index.css": `/* code here... */\n`,

    // 系统图标
    'given-icons': `❤❥웃유☮☏☢☠✔☑♚▲♪✈✞÷↑↓◆◇⊙■□△▽¿─♥❣♂♀☿Ⓐ✉☣☤✘☒♛▼♫⌘☪≈←→◈◎☉★☆⊿※¡━♡ღツ☼☁❅✎©®™Σ✪✯☭➳卐√↖↗●◐Θ℃℉°✿ϟ☃☂✄¢€£∞✫★½✡×↙↘○◑⊕☽☾✚〓↔↕☽☾の①②③④⑤⑥⑦⑧⑨⑩ⅠⅡ
                    ⅢⅣⅤⅥⅦⅧⅨⅩ♨♛❖☪✙┉☹☺☻ﭢ™℠℗©®♥❤❥❣❦❧♡۵웃유ღ♂♀☿☼☀☁☂☄☾☽❄☃☈⊙☉℃℉❅✺ϟ☇♤♧♡♢♠♣♥♦☜☞☚☛☟✽✾✿❁❃❋❀⚘☑✓✔√☐☒✗✘ㄨ✕✖✖⋆✢✣✤✥❋✦✧✩✰✪✫✬✭✮✯❂✡★✱✲✳✴✵✶✷✸✹✺✻✼❄❅❆❇❈❉
                    ❊†☨✞✝☥☦☓☩☯☧☬☸✡♁✙♆☩☨☦✞✛✜✝✙✠✚†‡◉○◌◍◎●◐◑◒◓◔◕◖◗❂☢⊗⊙◘◙◍⅟½⅓⅕⅙⅛⅔⅖⅚⅜¾⅗⅝⅞⅘⊰⊱⋛⋚∫∬∭∮∯∰∱∲∳%℅‰‱㊣㊎㊍㊌㊋㊏㊐㊊㊚㊛㊤㊥㊦㊧㊨㊒㊞㊑㊒㊓㊔㊕㊖㊗㊘㊜㊝㊟
                    ㊠㊡㊢㊩㊪㊫㊬㊭㊮㊯㊰㊙㉿囍♔♕♖♗♘♙♚♛♜♝♞♟ℂℍℕℙℚℝℤℬℰℯℱℊℋℎℐℒℓℳℴ℘ℛℭ℮ℌℑℜℨ♪♫♩♬♭♮♯°øⒶ☮☪✡☭✯卐✐✎✏✑✒✉✁✂✃✄✆✉☎☏➟➡➢➣➤➥➦➧➨➚➘➙➛➜➝➞➸➲➳⏎➴➵➶➷➸➹➺➻➼➽
                    ←↑→↓↔↕↖↗↘↙↚↛↜↝↞↟↠↡↢↣↤↥↦↧↨➫➬➩➪➭➮➯➱↩↪↫↬↭↮↶↷↸↹↺↻↼⇄⇅⇆⇇⇈⇉⇊⇋⇌⇍⇎⇏⇐⇑⇒⇓⇔⇕⇖⇗⇘⇙⇚⇛⇜⇝⇞⇟⇦⇧⇨⇩⇪♤♧♡♢♠♣♥♦☀☁☂❄☃♨웃유❖☽☾☪✿♂♀✪✯☭➳卍卐√×■◆●○◐◑✙☺☻❀⚘♔♕♖♗♘♙♚♛♜
                    ♝♞♟♧♡♂♀♠♣♥❤☜☞☎☏⊙◎☺☻☼▧▨♨◐◑↔↕▪▒◊◦▣▤▥▦▩◘◈◇♬♪♩♭♪の★☆♦◊◘◙◦☼♠♣▣▤▥▦▩◘◙◈♫♬♪￡Ю〓§♤♥▶¤✲❈✿✲❈➹☀☂☁【】┱┲❣✚✪✣✤✥✦❉❥❦❧❃❂❁❀✄☪☣☢☠☭ღ▶▷◀◁☀☁☂☃☄★☆☇☈⊙☊☋☌☍➀
                    ➁➂➃➄➅➆➇➈➉➊➋➌➍➎➏➐➑➒➓㊀㊁㊂㊃㊄㊅㊆㊇㊈㊉ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ⒜
                    ⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵`
};
