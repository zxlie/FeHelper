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

// 在Gulp 4.x中，runSequence已被移除，使用gulp.series和gulp.parallel代替
// let runSequence = require('run-sequence');

// 清理输出目录
function cleanOutput() {
    return gulp.src('output-chrome', {read: false, allowEmpty: true}).pipe(clean({force: true}));
}

// 复制静态资源
function copyAssets() {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur,ico,ttf,.woff2}', '!apps/static/screenshot/**/*']).pipe(copy('output-chrome'));
}

// 处理JSON文件
function processJson() {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output-chrome/apps'));
}

// 处理HTML文件
function processHtml() {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('output-chrome/apps'));
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

    // 定义哪些文件不需要 Babel 和 Uglify 处理
    const shouldSkipProcessing = (file) => {
        const relativePath = path.relative(path.join(process.cwd(), 'apps'), file.path);
        // 跳过 chart-maker/lib、static/vendor 和 code-compress 下的文件
        return relativePath.startsWith('chart-maker/lib/') 
            || relativePath.startsWith('static/vendor/') 
            || relativePath.startsWith('code-compress/');
        // 或者更具体地跳过这三个文件:
        // return relativePath === 'chart-maker/lib/xlsx.full.min.js' 
        //     || relativePath === 'static/vendor/evalCore.min.js' 
        //     || relativePath === 'code-compress/htmlminifier.min.js';
    };

    return gulp.src('apps/**/*.js')
        .pipe(jsMerge())
        .pipe(gulpIf(file => !shouldSkipProcessing(file), babel({
            presets: ['@babel/preset-env']
        })))
        .pipe(gulpIf(file => !shouldSkipProcessing(file), uglifyjs({
            compress: {
                ecma: 2015
            }
        })))
        .pipe(gulp.dest('output-chrome/apps'));
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

    return gulp.src('apps/**/*.css').pipe(cssMerge()).pipe(uglifycss()).pipe(gulp.dest('output-chrome/apps'));
}

// 添加图片压缩任务
function compressImages() {
    return gulp.src('output-chrome/apps/**/*.{png,jpg,jpeg,gif,svg}') // 源目录应为 output
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
        .pipe(gulp.dest('output-chrome/apps')); // 覆盖回 output
}

// 清理冗余文件，并且打包成zip，发布到chrome webstore
function zipPackage(cb) {
    // 读取manifest文件
    let pathOfMF = './output-chrome/apps/manifest.json';
    let manifest = require(pathOfMF);

    manifest.name = manifest.name.replace('-Dev', '');
    fs.writeFileSync(pathOfMF, JSON.stringify(manifest));

    // ============压缩打包================================================
    shell.exec('cd output-chrome/ && rm -rf fehelper.zip && zip -r fehelper.zip apps/ > /dev/null && cd ../');
    let size = fs.statSync('output-chrome/fehelper.zip').size;
    size = pretty(size);


    console.log('\n\n================================================================================');
    console.log('    当前版本：', manifest.version, '\t文件大小:', size);
    console.log('    去Chrome商店发布吧：https://chrome.google.com/webstore/devconsole');
    console.log('================================================================================\n\n');
    
    cb();
}

// 打包ms-edge安装包
function edgePackage(cb) {
    shell.exec('rm -rf output-edge && cp -r output-chrome output-edge && rm -rf output-edge/fehelper.zip');

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
    shell.exec('rm -rf output-firefox && cp -r output-chrome output-firefox && rm -rf output-firefox/fehelper.zip');

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
    return gulp.src('apps/**/*').pipe(gulp.dest('output-chrome/apps'));
}

// 设置静默标志
function setSilentDetect(cb) {
    isSilentDetect = true;
    cb();
}

// 取消静默标志
function unsetSilentDetect(cb) {
    isSilentDetect = false;
    cb();
}

// 检测未使用的静态文件
function detectUnusedFiles(cb) {
    const allFiles = new Set();
    const referencedFiles = new Set();
    
    // 检查文件是否应该被排除
    function shouldExcludeFile(filePath) {
        // 排除 content-script 文件
        if (filePath.includes('content-script.js') || filePath.includes('content-script.css')) {
            return true;
        }
        // 排除 node_modules 目录
        if (filePath.includes('node_modules')) {
            return true;
        }
        // 排除 fh-config.js
        if (filePath.endsWith('fh-config.js')) {
            return true;
        }
        return false;
    }
    
    // 递归获取所有文件
    function getAllFiles(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules') {  // 排除 node_modules 目录
                    getAllFiles(fullPath);
                }
            } else {
                // 只关注静态资源文件，并排除特殊文件
                if (/\.(js|css|png|jpg|jpeg|gif|svg)$/i.test(file) && !shouldExcludeFile(fullPath)) {
                    const relativePath = path.relative('output-chrome/apps', fullPath);
                    allFiles.add(relativePath);
                }
            }
        });
    }
    
    // 从文件内容中查找引用
    function findReferences(content, filePath) {
        const fileDir = path.dirname(filePath);
        const patterns = [
            // Capture content inside quotes (potential paths)
            /['"`][^`'"]*?([./\w-]+\.(?:js|css|png|jpg|jpeg|gif|svg))['"`]/g, 
            // Capture content inside url()
            /url\(['"]?([./\w-]+(?:\.(?:png|jpg|jpeg|gif|svg))?)['"]?\)/gi, 
            // Capture @import paths
            /@import\s+['"]([^'"]+\.css)['"];?/gi, 
            // Capture src/href attributes, including chrome-extension
            /(?:src|href)=['"](chrome-extension:\/\/[^/]+\/)?([^'"?#]+(?:\.(?:js|css|png|jpg|jpeg|gif|svg)))['"]/gi 
        ];

        patterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                
                let extractedPath = '';
                // Special handling for src/href pattern which captures optional chrome-extension part
                if (index === 3) { 
                    extractedPath = match[2]; // The path part after potential chrome-extension prefix
                } else {
                    extractedPath = match[1];
                }

                // Skip empty or invalid matches
                if (!extractedPath || typeof extractedPath !== 'string') continue;

                // Skip special files early
                if (shouldExcludeFile(extractedPath)) {
                    continue;
                }

                let finalPathToAdd = '';

                // Check if it was originally a chrome-extension url (by checking match[1] from the specific regex)
                const isChromeExt = index === 3 && match[1]; 
                
                if (isChromeExt || extractedPath.startsWith('/')) {
                    // chrome-extension paths are relative to root, absolute paths are relative to root
                    finalPathToAdd = extractedPath.startsWith('/') ? extractedPath.slice(1) : extractedPath;
                } else {
                    // Resolve relative paths (./, ../, or direct filename)
                    const absolutePath = path.resolve(fileDir, extractedPath);
                    finalPathToAdd = path.relative('output-chrome/apps', absolutePath);
                }
                
                // Final check before adding
                if (finalPathToAdd && !shouldExcludeFile(finalPathToAdd)) {
                    // Ensure consistent path separators (use /) and add to set
                    referencedFiles.add(finalPathToAdd.replace(/\\/g, '/'));
                }
            }
        });
    }
    
    // 读取manifest.json中的引用
    function processManifest() {
        const manifestPath = 'output-chrome/apps/manifest.json';
        if (fs.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // 检查manifest中的各种可能包含资源的字段
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
            
            // 特殊处理content_scripts
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
    
    // 单元测试
    function runTests() {
        if (!isSilentDetect) console.log('\n运行单元测试...');
        
        // 测试文件排除逻辑
        assert.strictEqual(shouldExcludeFile('path/to/content-script.js'), true, 'Should exclude content-script.js');
        assert.strictEqual(shouldExcludeFile('path/to/content-script.css'), true, 'Should exclude content-script.css');
        assert.strictEqual(shouldExcludeFile('path/to/node_modules/file.js'), true, 'Should exclude node_modules files');
        assert.strictEqual(shouldExcludeFile('path/to/normal.js'), false, 'Should not exclude normal files');
        
        // 测试路径解析
        const testContent = `
            <link rel="stylesheet" href="./style.css">
            <script src="../js/script.js"></script>
            <img src="/images/test.png">
            <div style="background: url('./bg.jpg')">
            @import '../common.css';
            <img src="chrome-extension://abcdefgh/static/icon.png">
        `;
        
        const testFilePath = 'output-chrome/apps/test/index.html';
        referencedFiles.clear();  // 清理之前的测试数据
        findReferences(testContent, testFilePath);
        
        // 验证引用是否被正确解析
        const refs = Array.from(referencedFiles);
        assert(refs.includes('test/style.css'), 'Should handle relative path with ./');
        assert(refs.includes('js/script.js'), 'Should handle relative path with ../');
        assert(refs.includes('images/test.png'), 'Should handle absolute path');
        assert(refs.includes('test/bg.jpg'), 'Should handle url() in CSS');
        assert(refs.includes('common.css'), 'Should handle @import in CSS');
        assert(refs.includes('static/icon.png'), 'Should handle chrome-extension urls');
        
        // 清理测试数据
        referencedFiles.clear();
        
        if (!isSilentDetect) console.log('单元测试通过！');
    }
    
    try {
        // 运行单元测试
        runTests();
        
        // 执行实际检测
        getAllFiles('output-chrome/apps');
        processManifest();
        
        // 扫描所有文件内容中的引用
        const filesToScan = fs.readdirSync('output-chrome/apps', { recursive: true })
            .filter(file => !shouldExcludeFile(file));
            
        filesToScan.forEach(file => {
            const fullPath = path.join('output-chrome/apps', file);
            if (fs.statSync(fullPath).isFile() && /\.(html|js|css|json)$/i.test(file)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                findReferences(content, fullPath);
            }
        });
        
        // 找出未被引用的文件
        const unusedFiles = Array.from(allFiles).filter(file => !referencedFiles.has(file));
        
        if (unusedFiles.length > 0) {
            if (!isSilentDetect) console.log('\n发现以下未被引用的文件：');
            if (!isSilentDetect) console.log('=====================================');
            let totalUnusedSize = 0;
            unusedFiles.forEach(file => {
                if (!isSilentDetect) console.log(file);
                try {
                    const fullPath = path.join('output-chrome/apps', file);
                    if (fs.existsSync(fullPath)) {
                       totalUnusedSize += fs.statSync(fullPath).size; 
                       // 删除文件
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
            
            // 输出详细信息（仅在DEBUG模式下）
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
    
    cb();
}

// 注册任务
gulp.task('clean', cleanOutput);
gulp.task('copy', copyAssets);
gulp.task('json', processJson);
gulp.task('html', processHtml);
gulp.task('js', processJs);
gulp.task('css', processCss);
gulp.task('compressImages', compressImages);
gulp.task('zip', zipPackage);
gulp.task('edge', edgePackage);
gulp.task('firefox', firefoxPackage);
gulp.task('sync', syncFiles);
gulp.task('detect', detectUnusedFiles);
gulp.task('setSilent', setSilentDetect);
gulp.task('unsetSilent', unsetSilentDetect);

// 定义默认任务 - 在Gulp 4.x中，使用series和parallel代替runSequence
gulp.task('default', 
    gulp.series(
        cleanOutput, 
        gulp.parallel(copyAssets, processCss, processJs, processHtml, processJson), 
        // compressImages,  // 已关闭图片压缩功能
        setSilentDetect,
        detectUnusedFiles,
        unsetSilentDetect,
        zipPackage
    )
);
