/**
 * 这个文件是用来远程更新FeHelper option page的
 * 可以在上下文直接使用 this 关键字访问option page中的 vue data
 *
 * @example
 *      alert(this.defaultKey);
 */

let getAbsNum = num => parseInt(num.split(/\./).map(n => n.padStart(4, '0')).join(''), 10);

// 针对v2020.03.1210版本 content-script在vue-router切换过程中会重复inject的问题进行热修复
// 此处，针对 json-format 工具进行强制更新
try {
    if (this.manifest && this.manifest.version) {
        let forceUpgradeTools = ['json-format'];
        if (getAbsNum(this.manifest.version) === getAbsNum('2020.03.1210')) {
            forceUpgradeTools.forEach(tool => Awesome.checkUpgrade(tool).then(upgrade => {
                if (upgrade) {
                    Awesome.install(tool);
                    this.fhTools[tool].upgrade = false;
                }
            }));
        }
    }
} catch (e) {
}