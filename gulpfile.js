/**
 * FeHelper Chrome Extension Builder By Gulp
 * @author zhaoxianlie
 */

const gulp = require('gulp');
const clean = require('gulp-clean');
const copy = require('gulp-copy');
const zip = require('gulp-zip');
const uglifyjs = require('gulp-uglify-es').default;
const uglifycss = require('gulp-uglifycss');
const htmlmin = require('gulp-htmlmin');
const jsonmin = require('gulp-jsonminify');
const fs = require('fs');
const through = require('through2');
const path = require('path');
const pretty = require('pretty-bytes');
const shell = require('shelljs');
const babel = require('gulp-babel');
const assert = require('assert');
const gulpIf = require('gulp-if');
const imagemin = require('gulp-imagemin');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminSvgo = require('imagemin-svgo');

let isSilentDetect = false; // <-- 添加全局标志位

const FIREFOX_REMOVE_TOOLS = [
    'color-picker', 'postman', 'devtools', 'websocket', 'page-timing',
    'grid-ruler', 'naotu', 'screenshot', 'page-monkey', 'excel2json'
];

// 清理输出目录
function cleanOutput(outputDir = 'output-chrome') {
    return gulp.src(outputDir, {read: false, allowEmpty: true}).pipe(clean({force: true}));
}

// 复制静态资源
function copyAssets(outputDir = 'output-chrome/apps') {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur,ico,ttf,woff2,svg,md,txt,json}']).pipe(gulp.dest(outputDir));
}

// 处理JSON文件
function processJson(outputDir = 'output-chrome/apps') {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest(outputDir));
}


// 处理HTML文件
function processHtml(outputDir = 'output-chrome/apps') {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest(outputDir));
}

// 合并 & 压缩 js
function processJs(outputDir = 'output-chrome/apps') {
    let jsMerge = () => {
        return through.obj(function (file, enc, cb) {
            let contents = file.contents.toString('utf-8');
            let merge = (fp, fc) => {
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
    const shouldSkipProcessing = (file) => {
        const relativePath = path.relative(path.join(process.cwd(), 'apps'), file.path);
        return relativePath === 'chart-maker/lib/xlsx.full.min.js' 
            || relativePath === 'static/vendor/evalCore.min.js' 
            || relativePath === 'code-compress/htmlminifier.min.js';
    };
    return gulp.src('apps/**/*.js')
        .pipe(jsMerge())
        .pipe(gulpIf(file => !shouldSkipProcessing(file), babel({
            presets: [
                ['@babel/preset-env', { modules: false }]
            ]
        })))
        .pipe(gulpIf(file => !shouldSkipProcessing(file), uglifyjs({
            compress: {
                ecma: 2015
            }
        })))
        .pipe(gulp.dest(outputDir));
}

// 合并 & 压缩 css
function processCss(outputDir = 'output-chrome/apps') {
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
    return gulp.src('apps/**/*.css').pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest(outputDir));
}

// 添加图片压缩任务
function compressImages(outputDir = 'output-chrome/apps') {
    return gulp.src(path.join(outputDir, '**/*.{png,jpg,jpeg,gif,svg}'))
        .pipe(imagemin([
            imageminGifsicle({interlaced: true}),
            imageminMozjpeg({quality: 75, progressive: true}),
            imageminSvgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest(outputDir));
}

// 清理冗余文件，并且打包成zip，发布到chrome webstore
function zipPackage(outputRoot = 'output-chrome', cb) {
    let pathOfMF = path.join(outputRoot, 'apps/manifest.json');
    let manifest = require(path.resolve(pathOfMF));
    manifest.name = manifest.name.replace('-Dev', '');
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));
    let pkgName = 'fehelper.zip';
    if (outputRoot === 'output-firefox') {
        pkgName = 'fehelper.xpi';
    }
    shell.exec(`cd ${outputRoot}/apps && rm -rf ../${pkgName} && zip -r ../${pkgName} ./* > /dev/null && cd ../../`);
    let size = fs.statSync(`${outputRoot}/${pkgName}`).size;
    size = pretty(size);
    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    if (outputRoot === 'output-chrome') {
        console.log('    去Chrome商店发布吧：https://chrome.google.com/webstore/devconsole');
    } else if (outputRoot === 'output-edge') {
        console.log('    去Edge商店发布吧：https://partner.microsoft.com/zh-cn/dashboard/microsoftedge/overview');
    } else if (outputRoot === 'output-firefox') {
        console.log('    去Firefox商店发布吧：https://addons.mozilla.org/zh-CN/developers/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/edit');
    }
    console.log('================================================================================\n\n');
    if (cb) cb();
}

// 设置静默标志
function setSilentDetect(cb) {
    isSilentDetect = true;
    cb();
}
function unsetSilentDetect(cb) {
    isSilentDetect = false;
    cb();
}

// 检测未使用的静态文件（参数化outputDir）
function detectUnusedFiles(outputDir = 'output-chrome/apps', cb) {
    const allFiles = new Set();
    const referencedFiles = new Set();
    function shouldExcludeFile(filePath) {
        if (filePath.includes('content-script.js') || filePath.includes('content-script.css')) return true;
        if (filePath.includes('node_modules')) return true;
        if (filePath.endsWith('fh-config.js')) return true;
        return false;
    }
    function getAllFiles(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules') {
                    getAllFiles(fullPath);
                }
            } else {
                if (/\.(js|css|png|jpg|jpeg|gif|svg)$/i.test(file) && !shouldExcludeFile(fullPath)) {
                    const relativePath = path.relative(outputDir, fullPath);
                    allFiles.add(relativePath);
                }
            }
        });
    }
    function findReferences(content, filePath) {
        const fileDir = path.dirname(filePath);
        const patterns = [
            /['"`][^`'\"]*?([./\w-]+\.(?:js|css|png|jpg|jpeg|gif|svg))['"`]/g,
            /url\(['"]?([./\w-]+(?:\.(?:png|jpg|jpeg|gif|svg))?)['"]?\)/gi,
            /@import\s+['"]([^'\"]+\.css)['"];?/gi,
            /(?:src|href)=['"](chrome-extension:\/\/[^/]+\/)?([^'"?#]+(?:\.(?:js|css|png|jpg|jpeg|gif|svg)))['"]/gi
        ];
        patterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                let extractedPath = '';
                if (index === 3) {
                    extractedPath = match[2];
                } else {
                    extractedPath = match[1];
                }
                if (!extractedPath || typeof extractedPath !== 'string') continue;
                if (shouldExcludeFile(extractedPath)) continue;
                let finalPathToAdd = '';
                const isChromeExt = index === 3 && match[1];
                if (isChromeExt || extractedPath.startsWith('/')) {
                    finalPathToAdd = extractedPath.startsWith('/') ? extractedPath.slice(1) : extractedPath;
                } else {
                    const absolutePath = path.resolve(fileDir, extractedPath);
                    finalPathToAdd = path.relative(outputDir, absolutePath);
                }
                if (finalPathToAdd && !shouldExcludeFile(finalPathToAdd)) {
                    referencedFiles.add(finalPathToAdd.replace(/\\/g, '/'));
                }
            }
        });
    }
    function processManifest() {
        const manifestPath = path.join(outputDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            const checkManifestField = (obj) => {
                if (typeof obj === 'string' && /\.(js|css|png|jpg|jpeg|gif|svg)$/i.test(obj)) {
                    const normalizedPath = obj.startsWith('/') ? obj.slice(1) : obj;
                    if (!shouldExcludeFile(normalizedPath)) {
                        referencedFiles.add(normalizedPath);
                    }
                } else if (Array.isArray(obj)) {
                    obj.forEach(item => checkManifestField(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.values(obj).forEach(value => checkManifestField(value));
                }
            };
            if (manifest.content_scripts) {
                manifest.content_scripts.forEach(script => {
                    if (script.js) {
                        script.js.forEach(js => {
                            const normalizedPath = js.startsWith('/') ? js.slice(1) : js;
                            referencedFiles.add(normalizedPath);
                        });
                    }
                    if (script.css) {
                        script.css.forEach(css => {
                            const normalizedPath = css.startsWith('/') ? css.slice(1) : css;
                            referencedFiles.add(normalizedPath);
                        });
                    }
                });
            }
            checkManifestField(manifest);
        }
    }
    function runTests() {
        if (!isSilentDetect) console.log('\n运行单元测试...');
        assert.strictEqual(shouldExcludeFile('path/to/content-script.js'), true, 'Should exclude content-script.js');
        assert.strictEqual(shouldExcludeFile('path/to/content-script.css'), true, 'Should exclude content-script.css');
        assert.strictEqual(shouldExcludeFile('path/to/node_modules/file.js'), true, 'Should exclude node_modules files');
        assert.strictEqual(shouldExcludeFile('path/to/normal.js'), false, 'Should not exclude normal files');
        const testContent = `
            <link rel="stylesheet" href="./style.css">
            <script src="../js/script.js"></script>
            <img src="/images/test.png">
            <div style="background: url('./bg.jpg')">
            @import '../common.css';
            <img src="chrome-extension://abcdefgh/static/icon.png">
        `;
        const testFilePath = path.join(outputDir, 'test/index.html');
        referencedFiles.clear();
        findReferences(testContent, testFilePath);
        const refs = Array.from(referencedFiles);
        assert(refs.includes('test/style.css'), 'Should handle relative path with ./');
        assert(refs.includes('js/script.js'), 'Should handle relative path with ../');
        assert(refs.includes('images/test.png'), 'Should handle absolute path');
        assert(refs.includes('test/bg.jpg'), 'Should handle url() in CSS');
        assert(refs.includes('common.css'), 'Should handle @import in CSS');
        assert(refs.includes('static/icon.png'), 'Should handle chrome-extension urls');
        referencedFiles.clear();
        if (!isSilentDetect) console.log('单元测试通过！');
    }
    try {
        runTests();
        getAllFiles(outputDir);
        processManifest();
        const filesToScan = fs.readdirSync(outputDir, { recursive: true })
            .filter(file => !shouldExcludeFile(file));
        filesToScan.forEach(file => {
            const fullPath = path.join(outputDir, file);
            if (fs.statSync(fullPath).isFile() && /\.(html|js|css|json)$/i.test(file)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                findReferences(content, fullPath);
            }
        });
        const unusedFiles = Array.from(allFiles).filter(file => !referencedFiles.has(file));
        if (unusedFiles.length > 0) {
            if (!isSilentDetect) console.log('\n发现以下未被引用的文件：');
            if (!isSilentDetect) console.log('=====================================');
            let totalUnusedSize = 0;
            unusedFiles.forEach(file => {
                if (!isSilentDetect) console.log(file);
                try {
                    const fullPath = path.join(outputDir, file);
                    if (fs.existsSync(fullPath)) {
                       totalUnusedSize += fs.statSync(fullPath).size; 
                       fs.unlinkSync(fullPath);
                       if (!isSilentDetect) console.log(`  -> 已删除: ${file}`);
                    } else {
                        if (!isSilentDetect) console.warn(`  -> 文件不存在，无法删除或统计大小: ${file}`);
                    }
                } catch (err) {
                    if (!isSilentDetect) console.warn(`无法删除或获取文件大小: ${file}`, err);
                }
            });
            if (!isSilentDetect) console.log('=====================================');
            if (!isSilentDetect) console.log(`共清理 ${unusedFiles.length} 个未使用的文件，释放空间: ${pretty(totalUnusedSize)}`);
            if (process.env.DEBUG && !isSilentDetect) {
                console.log('\n调试信息：');
                console.log('----------------------------------------');
                console.log('所有文件：');
                Array.from(allFiles).forEach(file => console.log(`- ${file}`));
                console.log('----------------------------------------');
                console.log('被引用的文件：');
                Array.from(referencedFiles).forEach(file => console.log(`- ${file}`));
            }
        } else {
            if (!isSilentDetect) console.log('\n没有发现未使用的文件！');
        }
    } catch (error) {
        if (!isSilentDetect) console.error('检测过程中发生错误：', error);
    }
    cb && cb();
}

// Firefox前置处理
function firefoxPreprocess(cb) {
    const srcDir = 'apps';
    const destDir = 'output-firefox/apps';
    shell.exec(`mv ${destDir}/firefox.json ${destDir}/manifest.json`);
    shell.exec(`rm -rf ${destDir}/chrome.json`);
    shell.exec(`rm -rf ${destDir}/edge.json`);

    FIREFOX_REMOVE_TOOLS.forEach(tool => {
        const toolDir = path.join(destDir, tool);
        if (fs.existsSync(toolDir)) {
            shell.exec(`rm -rf ${toolDir}`);
        }
    });
    cb();
}


// chrome前置处理
function chromePreprocess(cb) {
    const destDir = 'output-chrome/apps';
    shell.exec(`mv ${destDir}/chrome.json ${destDir}/manifest.json`);
    shell.exec(`rm -rf ${destDir}/firefox.json`);
    shell.exec(`rm -rf ${destDir}/edge.json`);

    cb();
}

// edge前置处理
function edgePreprocess(cb) {
    const destDir = 'output-edge/apps';
    shell.exec(`mv ${destDir}/edge.json ${destDir}/manifest.json`);
    shell.exec(`rm -rf ${destDir}/chrome.json`);
    shell.exec(`rm -rf ${destDir}/firefox.json`);

    cb();
}

// 注册任务
// Chrome默认打包
function cleanChrome() { return cleanOutput('output-chrome'); }
function copyChrome() { return copyAssets('output-chrome/apps'); }
function cssChrome() { return processCss('output-chrome/apps'); }
function jsChrome() { return processJs('output-chrome/apps'); }
function htmlChrome() { return processHtml('output-chrome/apps'); }
function jsonChrome() { return processJson('output-chrome/apps'); }
function detectChrome(cb) { detectUnusedFiles('output-chrome/apps', cb); }
function zipChrome(cb) { zipPackage('output-chrome', cb); }

gulp.task('default', 
    gulp.series(
        cleanChrome,
        copyChrome,
        gulp.parallel(cssChrome, jsChrome, htmlChrome, jsonChrome),
        chromePreprocess,
        setSilentDetect,
        detectChrome,
        unsetSilentDetect,
        zipChrome
    )
);

// ------------------------------------------------------------

// edge打包
function cleanEdge() { return cleanOutput('output-edge'); }
function copyEdge() { return copyAssets('output-edge/apps'); }
function cssEdge() { return processCss('output-edge/apps'); }
function jsEdge() { return processJs('output-edge/apps'); }
function htmlEdge() { return processHtml('output-edge/apps'); }
function jsonEdge() { return processJson('output-edge/apps'); }
function detectEdge(cb) { detectUnusedFiles('output-edge/apps', cb); }
function zipEdge(cb) { zipPackage('output-edge', cb); }

gulp.task('edge', 
    gulp.series(
        cleanEdge,
        copyEdge,
        gulp.parallel(cssEdge, jsEdge, htmlEdge, jsonEdge),
        edgePreprocess,
        setSilentDetect,
        detectEdge,
        unsetSilentDetect,
        zipEdge
    )
);

// Firefox打包主任务
function cleanFirefox() { return cleanOutput('output-firefox'); }
function copyFirefox() { return copyAssets('output-firefox/apps'); }
function cssFirefox() { return processCss('output-firefox/apps'); }
function jsFirefox() { return processJs('output-firefox/apps'); }
function htmlFirefox() { return processHtml('output-firefox/apps'); }
function jsonFirefox() { return processJson('output-firefox/apps'); }
function detectFirefox(cb) { detectUnusedFiles('output-firefox/apps', cb); }
function zipFirefox(cb) { zipPackage('output-firefox', cb); }

gulp.task('firefox',
    gulp.series(
        cleanFirefox,
        copyFirefox,
        gulp.parallel(cssFirefox, jsFirefox, htmlFirefox, jsonFirefox),
        firefoxPreprocess,
        setSilentDetect,
        detectFirefox,
        unsetSilentDetect,
        zipFirefox
    )
);


