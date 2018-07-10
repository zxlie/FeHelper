new Vue({
    el: '#pageContainer',
    data: {
        errorMessage: '',
        errorHighlight: false
    },
    mounted: function () {
        // 错误处理器
        let errorHandler = (which, ok) => {
            if (ok) {
                this.errorMessage = '两侧JSON比对完成！';
                this.errorHighlight = false;
            } else {
                this.errorMessage = {'left': '左', 'right': '右', 'left-right': '两'}[which] + '侧JSON不合法！';
                this.errorHighlight = true;
            }
        };

        // diff处理器
        let diffHandler = (diffs) => {
            if (!this.errorHighlight) {
                if (diffs.length) {
                    this.errorMessage += '共有 ' + diffs.length + ' 处不一致！';
                } else {
                    this.errorMessage += '左右两侧JSON内容一致！';
                }
            }
        };

        // 代码比对
        JsonDiff.init(this.$refs.srcLeft, this.$refs.srcRight, errorHandler, diffHandler);
    }
});