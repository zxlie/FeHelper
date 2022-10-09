/**
 * WebSocket测试
 */
new Vue({
    el: '#pageContainer',
    data: {
        url: 'ws://localhost:6765/ws/single/test/1',
        msg: '',
        connBtn: false,
        closeBtn: true,
        results: [],
        websock: null,
    },
    watch: {},
    mounted: function () {
        this.$refs.url.focus();
    },
    destroyed() {
        this.websock.close() //离开之后断开websocket连接
    },
    methods: {
        initWebSocket() { //初始化weosocket
            this.results.push(this.now() + "连接到：" + this.url);
            console.log(this.now() + "连接到：" + this.url)
            this.websock = new WebSocket(this.url);
            this.websock.onmessage = this.websocketOnMessage;
            this.websock.onopen = this.websocketOnOpen;
            this.websock.onerror = this.websocketOnError;
            this.websock.onclose = this.websocketOnClose;
        },
        websocketSend() {//数据发送
            this.websock.send(this.msg);
            this.results.push(this.now() + "发送：" + this.msg);
            console.log(this.now() + "发送：" + this.msg)
            this.msg = '';
        },
        websocketClose() {//数据发送
            this.results.push(this.now() + "关闭连接");
            console.log(this.now() + "关闭连接")
            this.websock.close();
        },
        cleanupMsg() {
            this.results = [];
        },
        websocketOnOpen(e) { //连接建立之后执行send方法发送数据
            this.results.push(this.now() + "连接成功");
            console.log(this.now() + "连接成功！", e)
            this.connBtn = true
            this.closeBtn = false
        },
        websocketOnError(e) {//连接建立失败重连
            this.results.push(this.now() + "连接失败，请检查连接地址是否正确或服务器是否正常");
            console.log(this.now() + "连接失败，请检查连接地址是否正确或服务器是否正常！", e)
            this.connBtn = false
            this.closeBtn = true
        },
        websocketOnMessage(msg) { //数据接收
            this.results.push(this.now() + "收到消息：" + msg.data);
            console.log(this.now() + "收到消息：", msg)
        },
        websocketOnClose(e) {  //关闭
            console.log(this.now() + "连接断开！", e)
            this.connBtn = false
            this.closeBtn = true
        },
        now() {
            let date = new Date();
            return f0(date.getHours()) + ":" + f0(date.getMinutes()) + ":" + f0(date.getSeconds()) + " - ";
        }
    }

});
function f0(i) {
    return (i < 10 ? '0' : '') + i
}
