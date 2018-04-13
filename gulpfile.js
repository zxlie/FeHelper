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
let pretty = require('pretty-bytes');
let shell = require('shelljs');
let runSequence = require('run-sequence');
let watchPath = require('gulp-watch-path');
let gcallback = require('gulp-callback');

gulp.task('clean', () => {
    return gulp.src('output', {read: false}).pipe(clean({force: true}));
});

gulp.task('copy', () => {
    return gulp.src(['apps/**/*.{gif,png,jpg,jpeg,cur}','!apps/static/screenshot/**/*']).pipe(copy('output'));
});

gulp.task('json', () => {
    return gulp.src('apps/**/*.json').pipe(jsonmin()).pipe(gulp.dest('output/apps'));
});

gulp.task('css', () => {
    return gulp.src('apps/**/*.css').pipe(uglifycss()).pipe(gulp.dest('output/apps'));
});

gulp.task('html', () => {
    return gulp.src('apps/**/*.html').pipe(htmlmin({collapseWhitespace: true})).pipe(gulp.dest('output/apps'));
});

gulp.task('js', () => {
    return gulp.src('apps/**/*.js').pipe(uglifyjs()).pipe(gulp.dest('output/apps'));
});

gulp.task('zip', () => {
    // 压缩打包
    shell.exec('cd output/ && zip -r fehelper.zip apps/ > /dev/null && cd ../');
    let size = fs.statSync('output/fehelper.zip').size;
    size = pretty(size);

    console.log('\n\n================================================================================');
    console.log('    当前版本：', require('./output/apps/manifest.json').version, '\t文件大小:', size);
    console.log('    去Chrome商店发布吧：https://chrome.google.com/webstore/devconsole');
    console.log('================================================================================\n\n');
});

// builder
gulp.task('default', ['clean'], () => {
    runSequence(['copy', 'css', 'js', 'html', 'json'], 'zip');
});

// 开发过程中用，watch while file changed
gulp.task('watch', () => {
    gulp.watch('apps/**/*.*', (event) => {
        let wp = watchPath(event, './', './output');
        gulp.src(wp.srcPath).pipe(copy('output')).pipe(gcallback(() => {
            console.log('> 文件发生变化，已编译：', wp.srcPath);
        }));
    });
});