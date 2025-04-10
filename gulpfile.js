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

// 在Gulp 4.x中，runSequence已被移除，使用gulp.series和gulp.parallel代替
// let runSequence = require('run-sequence');

// 清理输出目录
function cleanOutput() {
    return gulp.src('output', {read: false, allowEmpty: true}).pipe(clean({force: true}));
}

// 复制静态资源
function copyAssets() {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur,ico}', '!apps/static/screenshot/**/*']).pipe(copy('output'));
}

// 处理JSON文件
function processJson() {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output/apps'));
}

// 处理HTML文件
function processHtml() {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('output/apps'));
}

// 合并 & 压缩 js
function processJs() {
    let jsMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let merge = (fp, fc) => {

                // 合并 __importScript
                return fc.replace(/__importScript\(\s*(['"])([^'"]*)\1\s*\)/gm, function (frag, $1, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.js$/.test(mod) ? '' : '.js'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return merge(mp, mc + ';');
                });
            };

            contents = merge(file.path, contents);
            file.contents = Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.js').pipe(jsMerge()).pipe(uglifyjs()).pipe(gulp.dest('output/apps'));
}

// 合并 & 压缩 css
function processCss() {
    let cssMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');

            let merge = (fp, fc) => {
                return fc.replace(/\@import\s+(url\()?\s*(['"])(.*)\2\s*(\))?\s*;?/gm, function (frag, $1, $2, mod) {
                    let mp = path.resolve(fp, '../' + mod + (/\.css$/.test(mod) ? '' : '.css'));
                    let mc = fs.readFileSync(mp).toString('utf-8');
                    return merge(mp, mc);
                });
            };

            contents = merge(file.path, contents);
            file.contents = Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.css').pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest('output/apps'));
}

// 清理冗余文件，并且打包成zip，发布到chrome webstore
function zipPackage(cb) {
    // 读取manifest文件
    let pathOfMF = './output/apps/manifest.json';
    let manifest = require(pathOfMF);

    manifest.name = manifest.name.replace('-Dev', '');
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));

    // ============压缩打包================================================
    shell.exec('cd output/ && rm -rf fehelper.zip && zip -r fehelper.zip apps/ > /dev/null && cd ../');
    let size = fs.statSync('output/fehelper.zip').size;
    size = pretty(size);


    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    console.log('    去Chrome商店发布吧：https://chrome.google.com/webstore/devconsole');
    console.log('================================================================================\n\n');
    
    cb();
}

// 打包ms-edge安装包
function edgePackage(cb) {
    shell.exec('rm -rf output-edge && cp -r output output-edge && rm -rf output-edge/fehelper.zip');

    // 更新edge所需的配置文件
    let pathOfMF = './output-edge/apps/manifest.json';
    let manifest = require(pathOfMF);
    manifest.description = 'FE助手：JSON工具、代码美化、代码压缩、二维码工具、网页定制工具、便签笔记，等等';
    delete manifest.update_url;
    manifest.version = manifest.version.split('.').map(v => parseInt(v)).join('.');
    delete manifest.update_url;
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));

    shell.exec('cd output-edge/apps && zip -r ../fehelper.zip ./ > /dev/null && cd ../../');
    let size = fs.statSync('output-edge/fehelper.zip').size;
    size = pretty(size);

    console.log('\n\nfehelper.zip 已打包完成！');

    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    console.log('    去Edge商店发布吧：https://partner.microsoft.com/zh-cn/dashboard/microsoftedge/overview');
    console.log('================================================================================\n\n');
    
    cb();
}

// 打包Firefox安装包
function firefoxPackage(cb) {
    shell.exec('rm -rf output-firefox && cp -r output output-firefox && rm -rf output-firefox/fehelper.zip');

    // 清理掉firefox里不支持的tools
    let rmTools = ['page-capture', 'color-picker', 'ajax-debugger', 'wpo', 'code-standards', 'ruler', 'remove-bg'];
    shell.cd('output-firefox/apps');
    shell.find('./').forEach(f => {
        if (rmTools.includes(f)) {
            shell.rm('-rf', f);
            console.log('已删除不支持的工具：', f);
        }
    });
    shell.cd('../../');

    // 更新firefox所需的配置文件
    let pathOfMF = './output-firefox/apps/manifest.json';
    let manifest = require(pathOfMF);
    manifest.description = 'FE助手：JSON工具、代码美化、代码压缩、二维码工具、网页定制工具、便签笔记，等等';
    delete manifest.update_url;
    manifest.browser_specific_settings = {
        "gecko": {
            "id": "fehelper@baidufe.com",
            "strict_min_version": "99.0"
        }
    };
    manifest.background = {
        "scripts": [
            "background/background.js"
        ]
    };
    manifest.version = manifest.version.split('.').map(v => parseInt(v)).join('.');
    manifest.content_scripts.splice(1,2);
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));

    shell.exec('cd output-firefox/apps && zip -r ../fehelper.xpi ./ > /dev/null && cd ../../');
    let size = fs.statSync('output-firefox/fehelper.xpi').size;
    size = pretty(size);

    console.log('\n\nfehelper.xpi 已打包完成！');

    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    console.log('    去Chrome商店发布吧：https://addons.mozilla.org/zh-CN/developers/addon/web%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B-fehelper/versions');
    console.log('================================================================================\n\n');
    
    cb();
}

function syncFiles() {
    return gulp.src('apps/**/*').pipe(gulp.dest('output/apps'));
}


gulp.task("watch", () => {
    gulp.watch("apps/**/*.js", ["sync"]);
    gulp.watch("apps/**/*.css", ["sync"]);
    gulp.watch("apps/**/*.html", ["sync"]);
    gulp.watch("apps/**/*.json", ["sync"]);
    gulp.watch("apps/**/*.{gif,png,jpg,jpeg,cur,ico}", ["sync"]);
});
// 注册任务
gulp.task('clean', cleanOutput);
gulp.task('copy', copyAssets);
gulp.task('json', processJson);
gulp.task('html', processHtml);
gulp.task('js', processJs);
gulp.task('css', processCss);
gulp.task('zip', zipPackage);
gulp.task('edge', edgePackage);
gulp.task('firefox', firefoxPackage);
gulp.task('sync', syncFiles);

// 定义默认任务 - 在Gulp 4.x中，使用series和parallel代替runSequence
gulp.task('default', 
    gulp.series(
        cleanOutput, 
        gulp.parallel(copyAssets, processCss, processJs, processHtml, processJson), 
        zipPackage
    )
);

gulp.task("watch", () => {
    gulp.watch("apps/**/*.js", ["sync"]);
    gulp.watch("apps/**/*.css", ["sync"]);
    gulp.watch("apps/**/*.html", ["sync"]);
    gulp.watch("apps/**/*.json", ["sync"]);
    gulp.watch("apps/**/*.{gif,png,jpg,jpeg,cur,ico}", ["sync"]);
});
