/**
 * FeHelper Webpack Config
 * @author zhaoxianlie
 */

let path = require('path');
let shell = require('shelljs');
let glob = require('glob');
let uglifyCss = require('uglifycss');
let htmlMinifier = require('html-minifier');
let fs = require('fs');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let rootPath = path.resolve('.');

// html 文件压缩
let htmlCompress = function () {
    glob.sync('output/apps/**/*.html').map(cf => {
        try {
            let rawHtml = fs.readFileSync(cf).toString();
            let compressedHtml = htmlMinifier.minify(rawHtml, {
                collapseWhitespace: true
            });
            fs.writeFileSync(cf, compressedHtml);
        } catch (e) {
            console.log(cf, '压缩失败')
        }
    });
};

// css 文件压缩
let cssCompress = function () {
    let reg = /\@import\s+url\(\s*('|")([^\)]+)\1\s*\)/gm;

    glob.sync('output/apps/**/*.css').map(cf => {
        let rawCss = fs.readFileSync(cf);

        rawCss = rawCss.toString().replace(reg, ($0, $1, importedFile) => {
            let iPath = path.resolve(cf, '../' + importedFile);
            return fs.readFileSync(iPath).toString() + ';';
        });
        let uglifiedCss = uglifyCss.processString(rawCss, {maxLineLen: 500, expandVars: true});
        fs.writeFileSync(cf, uglifiedCss);
    });
};


// zip the fehelper
let zipForChromeWebStore = function () {
    shell.cd(`${rootPath}/output`);
    shell.exec('zip -r fehelper.zip apps/ > /dev/null');
};

// 所有的功能模块
let mods = (() => {
    shell.mkdir('-p', 'output');
    shell.rm('-rf', 'output/*');
    shell.mkdir('-p', 'output/apps');
    return shell.ls('apps');
})();

// 动态生成entry
let buildEntry = (globPath) => {

    let entries = {}, dirname, basename;

    glob.sync(globPath).map(jf => {
        dirname = path.dirname(jf);
        basename = path.basename(jf, '.js');
        entries[path.join(dirname, basename)] = './' + jf;
    });

    return entries;
};

// 文件拷贝的配置
let copyConfig = (() => {
    return mods.map(mod => {
        let from = {glob: './apps/' + ((mod === 'manifest.json') ? mod : (mod + '/**/*'))};
        return {from: from, to: './'}
    });
})();

module.exports = {
    entry: buildEntry('apps/**/*.js'),
    output: {
        path: path.resolve(__dirname, 'output'),
        filename: "[name].js",
        chunkFilename: '[id].js'
    },

    optimization: {
        minimize: false
    },

    plugins: [
        new CopyWebpackPlugin(copyConfig, {ignore: ['*.js']}),
        function () {
            this.plugin('done', stats => {
                cssCompress();
                htmlCompress();
                zipForChromeWebStore();
            })
        }
    ]
};
