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

gulp.task('clean', () => {
    return gulp.src('output', {read: false}).pipe(clean({force: true}));
});

gulp.task('copy', () => {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur}', '!apps/static/screenshot/**/*']).pipe(copy('output'));
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

            let tpl = 'let #VARNAME# = (function(module){ #CODES# ; return module.exports; })({exports:{}});\r\n';

            let merge = (fp, fc) => {
                let js = {};

                let rfc = fc.replace(/Tarp\.require\(\s*(['"])(.*)\1\s*\)/gm, function (frag, $1, mod, $2, code) {
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
            file.contents = new Buffer(contents);
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
            file.contents = new Buffer(contents);
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

    // background、content-script中的文件，可以作为例外
    let excludes = manifest.background.scripts.concat(manifest.content_scripts.map(cs => {
        return cs.js.join(',');
    }).join(',').split(','));

    // ============冗余文件清理================================================
    shell.cd('output/apps');
    let fileList = shell.find('./').filter(file => {
        let included = 'yes';
        if (file.match(/\.css$/) && !/index\.css$/.test(file)) {
            included = shell.grep('-l', file, './**/*.{css,html,js}').stdout;
        } else if (file.match(/\.js$/) && !/index\.js$/.test(file)) {
            included = shell.grep('-l', file.replace(/\.js$/, ''), './**/*.{html,js}').stdout;
        }

        // 如果没有搜索到，再尝试下在js、css文件的当前目录下搜寻
        if (!included.trim().length && /\.(js|css)$/.test(file)) {
            let arr = file.split(/\//);
            let filename = arr.splice(-1);
            let dirname = arr.join('/');

            included = shell.grep('-l', filename, (dirname || '.') + '/*.{html,js,css}').stdout;
        }

        return !included.trim().length;
    });
    fileList = fileList.filter(f => excludes.indexOf(f) === -1);
    fileList.forEach(f => {
        shell.rm('-rf', f);
        console.log(new Date().toLocaleString(), '> 清理掉冗余文件：', f);
    });
    shell.cd('../../');

    // web_accessible_resources 中也不需要加载这些冗余的文件了
    manifest.web_accessible_resources = manifest.web_accessible_resources.filter(f => fileList.indexOf(f) === -1);
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

// 开发过程中用，watch while file changed
gulp.task('watch', () => {
    gulp.watch('apps/**/*.*', (event) => {
        let wp = watchPath(event, './', './output');
        gulp.src(wp.srcPath).pipe(copy('output')).pipe(gcallback(() => {
            console.log(new Date().toLocaleString(), '> 文件发生变化，已编译：', wp.srcPath);
        }));
    });
});