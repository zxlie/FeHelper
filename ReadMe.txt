1、扩展安装地址：
    https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad?hl=zh-cn&utm_source=chrome-ntp

2、扩展目前功能：
    a）、网页兼容性检测
    b）、编码规范检测
    c）、网页栅格规范检测
    d）、JSON格式化
    e）、二维码生成
    f）、字符串编解码工具（Unicode、UTF8、Base64、MD5）

3、关于开发
    下载代码，chrome浏览器中本机开发即可

4、关于发布：
    方式一）、依赖编译平台FCP（zxlie用）
        此方式可以进行js、css代码合并、压缩，html压缩，减小extension的体积。
        运行build.sh脚本，会生成output，进入output目录，会有如下两个文件：
        fe-helper.zip ：上传到chorme web store，发布。
        fe-helper ：可在开发中进行测试

    方式二）、直接压缩为fe-helper.zip包
        此方式不走FCP，直接压缩，压缩后可将zip包发到zxlie处（mailto:xianliezhao@foxmail.com），由zxlie发布到webstore。
        要想把它当成自己作品来发布，可以自己单独申请账号，在webstore缴纳$5，自行上传。

5、主页：
    HomePage：http://www.baidufe.com/item/889639af23968ee688b9.html#comment 
    author：zxlie（zhaoxianlie）
    email：xianliezhao@foxmail.com
