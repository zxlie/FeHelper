/**
 * FeHelper Build Script
 * @author zhaoxianlie
 */

let path = require('path');
let shell = require('shelljs');
let glob = require('glob');
let jsMinifier = require('babel-minify');
let cssMinifier = require('uglifycss');
let htmlMinifier = require('html-minifier');
let fs = require('fs');
let rootPath = path.resolve('.');

// copy files
let copyFiles = function () {
    console.time('> 文件拷贝');
    shell.cd(rootPath);
    shell.mkdir('-p', 'output');
    shell.rm('-rf', 'output/*');
    shell.cp('-r', 'apps', 'output');
    console.timeEnd('> 文件拷贝');
};

// js 文件压缩
let jsCompress = function () {
    console.time('> Javascript文件压缩');
    glob.sync('output/apps/**/*.js').map(cf => {
        let rawJs = fs.readFileSync(cf, 'utf8').toString();
        let compressedJs = jsMinifier(rawJs);
        if (compressedJs.code) {
            fs.writeFileSync(cf, compressedJs.code);
        } else {
            console.log('---------------------', cf, '----------------------');
            console.log(compressedJs.error.message, '\n')
        }
    });
    console.timeEnd('> Javascript文件压缩');
};

// css 文件压缩
let cssCompress = function () {
    console.time('> CSS文件压缩');
    let reg = /\@import\s+url\(\s*('|")([^\)]+)\1\s*\)\s*;?/gm;

    glob.sync('output/apps/**/*.css').map(cf => {
        let rawCss = fs.readFileSync(cf, 'utf8');

        rawCss = rawCss.toString().replace(reg, ($0, $1, importedFile) => {
            let iPath = path.resolve(cf, '../' + importedFile);
            return fs.readFileSync(iPath, 'utf8').toString();
        });
        let compressedCss = cssMinifier.processString(rawCss, {maxLineLen: 500, expandVars: true});
        fs.writeFileSync(cf, compressedCss);
    });
    console.timeEnd('> CSS文件压缩');
};

// html 文件压缩
let htmlCompress = function () {
    console.time('> HTML文件压缩');
    glob.sync('output/apps/**/*.html').map(cf => {
        try {
            let rawHtml = fs.readFileSync(cf, 'utf8').toString();
            let compressedHtml = htmlMinifier.minify(rawHtml, {
                collapseWhitespace: true
            });
            fs.writeFileSync(cf, compressedHtml);
        } catch (e) {
        }
    });
    console.timeEnd('> HTML文件压缩');
};

// zip the fehelper
let zipForChromeWebStore = function () {
    console.time('> FeHelper打包');
    shell.cd(`${rootPath}/output`);
    shell.exec('zip -r fehelper.zip apps/ > /dev/null');
    console.timeEnd('> FeHelper打包');
    console.log('\n\n================================================================================');
    console.log('    去Chrome商店发布吧：https://chrome.google.com/webstore/developer/dashboard');
    console.log('================================================================================\n\n');
};

/************************build start*****************************/
copyFiles();
cssCompress();
htmlCompress();
jsCompress();
zipForChromeWebStore();

