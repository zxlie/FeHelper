new Vue({
    el: '#pageContainer',
    data: {
        errorMessage: '',
        errorHighlight: false
    },
    mounted: function () {
        // 错误处理器
        let errorHandler = (which, ok) => {
            let message = '';
            if (ok) {
                message = '两侧JSON比对完成！';
                this.errorHighlight = false;
            } else {
                let side = {'left': '左', 'right': '右', 'left-right': '两'}[which];
                if(!jsonBox.left.getValue().trim().length) {
                    message = '请在<span class="x-hlt1">左侧</span>填入待比对的JSON内容！'
                }else if(!jsonBox.right.getValue().trim().length) {
                    message = '请在<span class="x-hlt1">右侧</span>填入待比对的JSON内容！'
                }else{
                    message = '<span class="x-hlt1">' + side + '侧</span>JSON不合法！';
                }
                this.errorHighlight = true;
            }
            this.errorMessage = '<span class="x-hlt">Tips：</span>' + message;
        };

        // diff处理器
        let diffHandler = (diffs) => {
            if (!this.errorHighlight) {
                if (diffs.length) {
                    this.errorMessage += '共有 <span class="x-hlt">' + diffs.length + '</span> 处不一致！';
                } else {
                    this.errorMessage += '且JSON内容一致！';
                }
            }
        };

        // 代码比对
        let jsonBox = JsonDiff.init(this.$refs.srcLeft, this.$refs.srcRight, errorHandler, diffHandler);
    }
});