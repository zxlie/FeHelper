/**
 * FeHelper Chrome Extension Builder By Gulp
 * @author zhaoxianlie
 */

let gulp = require('gulp');

let clean = require('gulp-clean');
let copy = require('gulp-copy');
let zip = require('gulp-zip');
let uglifyjs = require('gulp-uglify-es').default;
let uglifycss = require('gulp-uglifycss');
let htmlmin = require('gulp-htmlmin');
let jsonmin = require('gulp-jsonminify');
let fs = require('fs');
let through = require('through2');
let path = require('path');
let pretty = require('pretty-bytes');
let shell = require('shelljs');
let runSequence = require('run-sequence');
let watchPath = require('gulp-watch-path');
let gcallback = require('gulp-callback');
let crypto = require('crypto');
// 顶部导航栏
let navbar = require('./static/js/navbar.js');

// 可以特定的编译某个工具，开发过程中用，可以提高编译速度
let singleTool = '';

gulp.task('clean', () => {
    if (require('os').hostname() === 'www-baidufe-com') {
        return console.log('当心，别乱来！不允许在服务器上直接编译！');
    }

    let args = process.argv.slice(2);
    if (args.length === 2 && args[0] === '--t') {
        return gulp.src('output', {read: false});
    } else {
        return gulp.src('output', {read: false}).pipe(clean({force: true}));
    }
});

gulp.task('copy', () => {
    return gulp.src(['fehelper/**/*.{gif,png,jpg,jpeg,cur,ico}']).pipe(copy('output'));
});

gulp.task('json', () => {
    return gulp.src('fehelper/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output/fehelper'));
});

gulp.task('html', () => {

    // 头部公共的meta标签，SEO用
    let metas = `<meta name="Robots" content="INDEX,FOLLOW">
        <meta name="keywords" content="FeHelper,WEB前端助手,JSON格式化,JSON对比,信息编解码,代码美化,代码压缩,二维码生成,二维码解码,图片Base64转换,Markdown,随机密码生成器,正则表达式,时间戳转换,便签笔记,进制转换,贷款计算器">
        <meta name="description" content="WEB前端助手：FeHelper，浏览器插件，包含一些前端实用的工具，如JSON格式化,JSON对比,信息编解码,代码美化,代码压缩,二维码生成,二维码解码,图片Base64转换,Markdown,随机密码生成器,正则表达式,时间戳转换,便签笔记,进制转换,贷款计算器等">
        <link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad">
        <meta name="renderer" content="webkit">
        <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrome=1">`;

    // 百度统计代码
    let baiduTj = `<div id="pageFooter" class="hide" style="display: none">
            <script type="text/javascript">
                (function(){
                    var _bdhmProtocol = (("https:" === document.location.protocol) ? " https://" : " http://");
                    document.write(unescape("%3Cscript src='" + _bdhmProtocol +
                    "hm.baidu.com/h.js%3F17b02fba4e62901b4289eef4c2243123' type='text/javascript'%3E%3C/script%3E"));
                })();
            </script>
        </div>`.replace(/\n+|\s{2,}/gm, ' ');

    let tplInsert = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let insert = (fp, fc) => {
                return fc.replace(/<\/title>/gm, `</title>${metas}`)        // meta标签-seo
                    .replace(/id="pageContainer"[^>]*>/gm, function (frag) { // 顶部导航栏
                        return frag + navbar.htmlHeader;
                    }).replace(/<\/body>/gm, `${baiduTj}</body>`)          // 百度统计
                    .replace(`<script src="../static/js/navbar.js"></script>`, ''); // 删掉navbar.js的引用
            };

            contents = insert(file.path, contents);
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        });
    };

    return gulp.src(`fehelper${singleTool}/**/*.html`).pipe(tplInsert()).pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest(`output/fehelper${singleTool}`));
});

// 合并 & 压缩 js
gulp.task('js', () => {
    let jsMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let tpl = 'let #VARNAME# = (function(module){ #CODES# ; return module.exports; })({exports:{}});\r\n';

            let merge = (fp, fc) => {
                let js = {};

                // 合并 __importScript
                fc = fc.replace(/__importScript\(\s*(['"])([^'"]*)\1\s*\)/gm, function (frag, $1, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.js$/.test(mod) ? '' : '.js'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return merge(mp, mc + ';');
                });

                let rfc = fc.replace(/Tarp\.require\(\s*(['"])([^'"]+)\1\s*\)/gm, function (frag, $1, mod, $2, code) {
                    let mp = path.resolve(fp, '../' + mod + (/\.js$/.test(mod) ? '' : '.js'));
                    let mc = fs.readFileSync(mp).toString('utf-8');

                    frag = frag.replace(/[^\w]/g, '').replace('Tarprequire', 'TR');
                    js[frag] = merge(mp, mc);
                    return frag;
                });

                return Object.keys(js).map(k => {
                    return tpl.replace('#VARNAME#', k).replace('#CODES#', () => js[k]);
                }).join('; ') + rfc;
            };

            contents = merge(file.path, contents);
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src(`fehelper${singleTool}/**/*.js`).pipe(jsMerge()).pipe(uglifyjs()).pipe(gulp.dest(`output/fehelper${singleTool}`));
});

// 合并 & 压缩 css
gulp.task('css', () => {

    let cssMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let merge = (fp, fc) => {
                return fc.replace(/\@import\s+(url\()?\s*(['"])([^'"]*)\2\s*(\))?\s*;?/gm, function (frag, $1, $2, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.css$/.test(mod) ? '' : '.css'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return merge(mp, mc);
                });
            };

            contents = merge(file.path, contents);
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src(`fehelper${singleTool}/**/*.css`).pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest(`output/fehelper${singleTool}`));
});

// 给静态文件增加md5戳
gulp.task('md5', () => {

    let md5Replace = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let replace = (fp, fc) => {
                [
                    [
                        /<script[^>]*>\s*?<\/[^>]*script>/gim,
                        /src=['"]([^'"]+)['"]/igm,
                        'src'
                    ],
                    [
                        /<link\s+[^>]*stylesheet[^>]*>/gim,
                        /href=['"]([^'"]+)['"]/igm,
                        'href'
                    ]
                ].forEach(item => {
                    fc = fc.replace(item[0], frag => {
                        return frag.replace(item[1], function ($1, $2) {
                            if(/^http(s)?:\/\//.test($2)) {
                                return $2;
                            }

                            if ($2.indexOf('?') !== -1) {
                                let x = $2.split('?');
                                x.pop();
                                $2 = x.join('');
                            }
                            let mp = path.resolve(fp, '../' + $2);
                            let mc = fs.readFileSync(mp).toString('utf-8');
                            let md5 = crypto.createHash('md5').update(mc).digest('hex');
                            return `${item[2]}="${$2}?v=${md5.slice(-8)}"`;
                        });
                    });
                });
                return fc;
            };

            contents = replace(file.path, contents);
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src(`output/fehelper${singleTool}/**/*.html`).pipe(md5Replace()).pipe(gulp.dest(`output/fehelper${singleTool}`));
});

// 清理冗余文件，并且打包成zip
gulp.task('zip', ['md5'], () => {
    // hello-world是一个demo，代码不能被压缩
    shell.exec('cp -r hello-world output/fehelper/');
    shell.exec('cd output/ && rm -rf fehelper.zip && zip -r fehelper.zip fehelper/* > /dev/null && cd ../ && rm -rf fehelper/');

    console.log('\n\tfehelper.zip 已打包完成！可以提交代码去更新网站了！\n');
});

// 创建fehelper目录
gulp.task('fehelper', () => {
    let excludeFiles = ['fehelper', 'gulpfile.js', 'LICENSE', 'package.json', 'package-lock.json', 'README.md', 'output', 'node_modules'];
    let tools = shell.ls().filter(file => !/^\./.test(file) && !excludeFiles.includes(file));
    shell.exec('rm -rf fehelper && mkdir fehelper && cp -r ' + tools.join(' ') + ' fehelper/');
});

// builder
gulp.task('default', ['clean'], () => {
    if (require('os').hostname() === 'www-baidufe-com') {
        return console.log('当心，别乱来！不允许在服务器上直接编译！');
    }

    let args = process.argv.slice(2);
    if (args.length === 2 && args[0] === '--t') {
        singleTool = `/${args[1]}`;
    }

    runSequence(['fehelper', 'copy', 'css', 'js', 'html', 'json'], 'zip');
});


// 在服务器上进行发布
gulp.task('deploy', () => {
    shell.exec('cd output/ && rm -rf fehelper.bak && mv fehelper fehelper.bak && unzip fehelper.zip > /dev/null');
    console.log('已发布成功！');
});

gulp.task('sync', () => {
    gulp.src('fehelper/**/*').pipe(gulp.dest('output/fehelper'));
});

// 开发过程中用，watch while file changed
gulp.task('watch', () => {
    gulp.watch('fehelper/**/*.*', (event) => {
        let wp = watchPath(event, './', './output');
        gulp.src(wp.srcPath).pipe(copy('output')).pipe(gcallback(() => {
            console.log(new Date().toLocaleString(), '> 文件发生变化，已编译：', wp.srcPath);
        }));
    });
});

// 用esbuild来进行js文件压缩，超级快。。。。。
gulp.task('esbuild',() => {
    shell.cd('output');
    shell.exec(`find . -type f -name "*.js" -exec esbuild --minify {} --outfile=dist/{} \\;`);
});
