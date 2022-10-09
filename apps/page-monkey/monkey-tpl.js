window.MonkeyTpl = [
    {
        "mName": "Demo：百度首页换Logo为Google并自动搜索FeHelper",
        "mPattern": "https://www.baidu.com",
        "mScript": "// 显示一个Toast，提示消息\nvar toast = (content,time) => {\n  \treturn new Promise((resolve,reject) => {\n        let elAlertMsg = document.querySelector(\"#fehelper_alertmsg\");\n        if (!elAlertMsg) {\n            let elWrapper = document.createElement('div');\n            elWrapper.innerHTML = '<div id=\"fehelper_alertmsg\" style=\"position:fixed;top:5px;left:0;right:0;z-index:100\">' +\n                '<p style=\"background:#000;display:inline-block;color:#fff;text-align:center;' +\n                'padding:10px 10px;margin:0 auto;font-size:14px;border-radius:4px;\">' + content + '</p></div>';\n            elAlertMsg = elWrapper.childNodes[0];\n            document.body.appendChild(elAlertMsg);\n        } else {\n            elAlertMsg.querySelector('p').innerHTML = content;\n            elAlertMsg.style.display = 'block';\n        }\n\n      \twindow.setTimeout(function () {\n            elAlertMsg.style.display = 'none';\n          \tresolve && resolve();\n        }, time || 1000);\n    });\n};\n\n// 简单的sleep实现\nvar sleep = ms => new Promise((resolve,reject) => setTimeout(resolve,ms));\n\n// 下面开始这个简单的Demo...\n(() => {\n\t// 这只是个Demo，咱们就只针对百度首页来做\n\tif(new URL(location.href).pathname !== '/') return false;\n  \n  \ttoast('1. 替换logo为google')\n      .then(() => { \n          $('#s_lg_img_new').attr('src','https://ss3.bdstatic.com/yrwDcj7w0QhBkMak8IuT_XF5ehU5bvGh7c50/logopic/f6cf589144923c2d0e49e0fcea78f621_fullsize.jpg');\n      });\n  \n\tsleep(2000)\n      .then(() => toast('2. 输入 fehelper',2000))\n      .then(() => {\n          'FeHelper'.split('').forEach((char,index) => { \n          \t  setTimeout(() => {$('#kw').val($('#kw').val()+char)}, (index+1)*400) \n          });\n      });\n  \n    sleep(8000)\n      .then(() => toast('3. 点击搜索',2000))\n      .then(() => $('#form').trigger('submit') );\n})();\n\n\n\n",
        "mRefresh": "0",
        "mDisabled": false,
        "id": "mf_1579406296116"
    }
];

window.MonkeyNewGuide = `// 在这里，可以随便写你的代码，并且，你的代码中
// 1. 可以进行页面上的所有DOM操作
// 2. 可以访问页面上原本已挂载的所有Js变量，比如页面上已经有了jQuery，你可以直接使用
// 3. 可以依赖注入一个第三方js脚本，然后在你的代码中直接使用，如：依赖jQuery后直接使用
// 4. 好了，你的代码可以这样写：

(() => {
	console.log('hello...world...,I am from ',location.href);
})();

`;