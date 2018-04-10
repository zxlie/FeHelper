let path = require('path');
let shell = require('shelljs');
let glob = require('glob');
let CopyWebpackPlugin = require('copy-webpack-plugin');
let UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// 所有的功能模块
let mods = (() => {
    shell.mkdir('-p', 'output');
    shell.rm('-rf', 'output/*');
    shell.mkdir('-p', 'output/apps');
    return shell.ls('apps');
})();

// 动态生成entry
let entries = (globPath) => {
    let files = glob.sync(globPath);
    let entries = {}, entry, dirname, basename;

    for (let i = 0; i < files.length; i++) {
        entry = files[i];
        dirname = path.dirname(entry);
        basename = path.basename(entry, '.js');
        entries[path.join(dirname, basename)] = './' + entry;
    }
    return entries;
};

// 文件拷贝的配置
let copyConfig = (() => {
    return mods.map(mod => {
        let from = {glob: 'apps/' + (mod === 'manifest.json') ? mod : (mod + '/**/*')};
        let to = {to: 'output/apps'};
        return {from: from, to: to}
    });
})();

module.exports = {
    entry: entries('apps/**/*.js'),
    output: {
        path: path.resolve(__dirname, 'output'),
        filename: "[name].js",
        chunkFilename: '[id].js'
    },

    module: {
        // rules: [{
        //     test: /\.js$/,
        //     loader: 'babel-loader',
        // }, {
        //     test: /\.css$/,
        //     loader: 'css-loader'
        // }, {
        //     test: /\.(png|jpg|jpeg|gif|ico)$/,
        //     loader: 'file-loader'
        // }, {
        //     test: /\.html$/,
        //     loader: 'file-loader'
        // }]
    },
    plugins: [
        new CopyWebpackPlugin(copyConfig, {ignore: ['*.js']}),
        new UglifyJsPlugin(),
        function () {
            this.plugin('done', stats => {
                console.log(stats)
            });
        }
    ]
};
