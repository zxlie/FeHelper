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

gulp.task('clean', () => {
    return gulp.src('output', {read: false}).pipe(clean({force: true}));
});

gulp.task('copy', () => {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur,ico}', '!apps/static/screenshot/**/*']).pipe(copy('output'));
});

gulp.task('json', () => {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output/apps'));
});

gulp.task('html', () => {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('output/apps'));
});

// 合并 & 压缩 js
gulp.task('js', () => {
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
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.js').pipe(jsMerge()).pipe(uglifyjs()).pipe(gulp.dest('output/apps'));
});

// 合并 & 压缩 css
gulp.task('css', () => {

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
            file.contents = new Buffer.from(contents);
            this.push(file);
            return cb();
        })
    };

    return gulp.src('apps/**/*.css').pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest('output/apps'));
});

// 清理冗余文件，并且打包成zip，发布到chrome webstore
gulp.task('zip', () => {

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

});

// 打包Firefox安装包
gulp.task('firefox', () => {
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
    manifest.applications = {
        "gecko": {
            "id": "fehelper@baidufe.com",
            "strict_min_version": "57.0"
        }
    };
    manifest.version = manifest.version.replace(/\./, '') + 'stable';
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
});

// builder
gulp.task('default', ['clean'], () => {
    runSequence(['copy', 'css', 'js', 'html', 'json'], 'zip');
});

gulp.task('sync', () => {
    gulp.src('apps/**/*').pipe(gulp.dest('output/apps'));
});
