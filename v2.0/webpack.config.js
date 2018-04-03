let path = require('path');
let shell = require('shelljs');

// 移动所有文件
let mvFile = () => {
    shell.rm('-rf','output');
    shell.mkdir('output');
    shell.cp('-r','apps','output/');
};
mvFile();


// 生成entry配置
let entryConfig = (() => {
    let cfg = {};
    'background,popup,options'.split(',').forEach((item) => {
        cfg[['apps', item, 'index'].join('/')] = path.resolve(__dirname, 'apps/' + item);
    });
    return cfg;
})();


module.exports = {
    entry: entryConfig,
    output: {
        path: path.resolve(__dirname, 'output'),
        filename: "[name].js"
    },

    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
        }, {
            test: /\.css$/,
            loader: 'css-loader'
        }, {
            test: /\.(png|jpg|jpeg|gif|ico)$/,
            loader: 'file-loader'
        }, {
            test: /\.html$/,
            loader: 'file-loader'
        }]
    }
};
