// Excel/CSV 转 JSON 工具主逻辑
// 作者：AI进化论-花生
// 详细中文注释，便于初学者理解

// 选择器
const fileInput = document.getElementById('fileInput');
const fileLink = document.querySelector('a.btn-file-input');
const pasteInput = document.getElementById('pasteInput');
const convertBtn = document.getElementById('convertBtn');
const jsonOutput = document.getElementById('jsonOutput');
const errorMsg = document.getElementById('errorMsg');

// 清空错误提示
function clearError() {
    errorMsg.textContent = '';
}

// 显示错误提示
function showError(msg) {
    errorMsg.textContent = msg;
}

// 解析CSV文本为JSON
function csvToJson(csv) {
    const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
            obj[h.trim()] = (values[i] || '').trim();
        });
        return obj;
    });
}

// 处理文件上传
fileInput.addEventListener('change', function (e) {
    clearError();
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    const ext = file.name.split('.').pop().toLowerCase();
    if (["xlsx", "xls"].includes(ext)) {
        // 读取Excel文件
        reader.onload = function (evt) {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                // 默认取第一个sheet
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                jsonOutput.value = JSON.stringify(json, null, 2);
                // 生成CSV文本并填充到输入框
                const csv = XLSX.utils.sheet_to_csv(sheet);
                pasteInput.value = csv;
            } catch (err) {
                showError('Excel文件解析失败，请确认文件格式！');
            }
        };
        reader.readAsBinaryString(file);
    } else if (ext === 'csv') {
        // 读取CSV文件
        reader.onload = function (evt) {
            try {
                const csv = evt.target.result;
                const json = csvToJson(csv);
                jsonOutput.value = JSON.stringify(json, null, 2);
                pasteInput.value = csv;
            } catch (err) {
                showError('CSV文件解析失败，请确认内容格式！');
            }
        };
        reader.readAsText(file);
    } else {
        showError('仅支持Excel（.xlsx/.xls）或CSV文件！');
    }
});

// 处理转换按钮点击
convertBtn.addEventListener('click', function () {
    clearError();

    // 处理粘贴内容
    const text = pasteInput.value.trim();
    if (!text) {
        showError('请上传文件或粘贴表格数据！');
        return;
    }
    // 判断是否为CSV格式
    if (text.includes(',') && text.includes('\n')) {
        try {
            const json = csvToJson(text);
            jsonOutput.value = JSON.stringify(json, null, 2);
        } catch (err) {
            showError('粘贴内容解析失败，请检查格式！');
        }
    } else {
        showError('仅支持CSV格式的粘贴内容！');
    }
});

// 示例数据
const EXAMPLES = {
    simple: `姓名,年龄,城市\n张三,18,北京\n李四,22,上海`,
    user: `ID,用户名,邮箱\n1,alice,alice@example.com\n2,bob,bob@example.com\n3,charlie,charlie@example.com`,
    score: `学号,姓名,数学,语文,英语\n1001,王小明,90,88,92\n1002,李小红,85,91,87\n1003,张大伟,78,80,85`
};

// 绑定“选择文件”a标签点击事件，触发文件选择
const fileSelectLink = document.querySelector('.btn-file-input');
if (fileSelectLink) {
    fileSelectLink.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });
}

// 绑定示例按钮事件（只针对.link-btn）
const exampleBtns = document.querySelectorAll('.link-btn');
exampleBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = btn.getAttribute('data-example');
        if (EXAMPLES[type]) {
            pasteInput.value = EXAMPLES[type];
            clearError();
            jsonOutput.value = '';
            // 自动触发转换
            convertBtn.click();
        }
    });
});

// 复制按钮功能
const copyBtn = document.getElementById('copyBtn');
if (copyBtn) {
    copyBtn.addEventListener('click', function() {
        if (!jsonOutput.value) {
            showError('暂无内容可复制！');
            return;
        }
        jsonOutput.select();
        document.execCommand('copy');
        
        // 复制成功效果
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制';
        copyBtn.style.background = '#27ae60';
        copyBtn.style.color = '#fff';
        copyBtn.style.borderColor = '#27ae60';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
        }, 1500);
        
        clearError();
    });
} 

// 打赏按钮
const donateBtn = document.querySelector('.x-donate-link');
if (donateBtn) {
    donateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.sendMessage({
            type: 'fh-dynamic-any-thing',
            thing: 'open-donate-modal',
            params: { toolName: 'excel2json' }
        }); 
    });
}

// 工具市场按钮
const toolMarketBtn = document.querySelector('.x-other-tools');
if (toolMarketBtn) {
    toolMarketBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        chrome.runtime.openOptionsPage();
    });
}   
