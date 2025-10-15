const EXAMPLES = {
    html: `<!DOCTYPE html>
<html>
<head>
    <title>示例页面</title>
    <meta charset="utf-8">
</head>
<body>
    <div class="container">
        <h1>这是一个HTML示例</h1>
        <p>这里包含了一些HTML标签和空格，适合用来测试HTML压缩功能</p>
    </div>
</body>
</html>`,
    
    js: `function calculateSum(a, b) {
    // 这是一个简单的加法函数
    var result = a + b;
    
    // 返回计算结果
    return result;
}

// 创建一个数组
var numbers = [1, 2, 3, 4, 5];

// 使用map方法
var doubled = numbers.map(function(num) {
    return num * 2;
});

console.log(doubled);`,
    
    css: `/* 这是一个CSS示例 */
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background-color: #f5f5f5;
    padding: 10px 20px;
    margin-bottom: 20px;
}

/* 响应式样式 */
@media screen and (max-width: 768px) {
    .container {
        padding: 10px;
    }
}`
}; 