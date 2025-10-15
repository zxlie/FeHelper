document.addEventListener('DOMContentLoaded', function() {
    // 工具映射表（文件名到工具名称的映射）
    const toolNameMap = {
        'json-format': 'JSON美化工具',
        'json-diff': 'JSON比对工具',
        'code-beautify': '代码美化工具',
        'code-compress': '代码压缩工具',
        'postman': '简易Postman',
        'websocket': 'Websocket工具',
        'regexp': '正则公式速查',
        'page-timing': '网站性能优化',
        'en-decode': '信息编码转换',
        'trans-radix': '进制转换工具',
        'timestamp': '时间(戳)转换',
        'trans-color': '颜色转换工具',
        'qr-code': '二维码/解码',
        'image-base64': '图片转Base64',
        'svg-converter': 'SVG转为图片',
        'chart-maker': '图表制作工具',
        'poster-maker': '海报快速生成',
        'screenshot': '网页截屏工具',
        'color-picker': '页面取色工具',
        'aiagent': 'AI(智能助手)',
        'sticky-notes': '我的便签笔记',
        'html2markdown': 'Markdown转换',
        'page-monkey': '网页油猴工具',
        'crontab': 'Crontab工具',
        'loan-rate': '贷(还)款利率',
        'password': '随机密码生成',
        'devtools': 'FH开发者工具',
        'index': '文档首页',
        'grid-ruler': '网页标尺工具',
        'excel2json': 'Excel转JSON',
        'naotu': '思维导图工具'
    };
    
    // 工具分类映射
    const toolCategoryMap = {
        'dev': ['json-format', 'json-diff', 'code-beautify', 'code-compress', 'postman', 'websocket', 'regexp', 'page-timing', 'devtools'],
        'encode': ['en-decode', 'trans-radix', 'timestamp', 'trans-color'],
        'image': ['qr-code', 'image-base64', 'svg-converter', 'chart-maker', 'poster-maker', 'screenshot', 'color-picker'],
        'productivity': ['aiagent', 'sticky-notes', 'html2markdown', 'page-monkey', 'naotu'],
        'calculator': ['crontab', 'loan-rate', 'password'],
        'other': ['grid-ruler', 'excel2json']
    };

    // 获取URL参数
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }
    
    // 初始化 marked 解析器
    const markedOptions = {
        gfm: true,
        breaks: true,
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    };
    
    // 加载工具列表
    async function loadToolList() {
        try {
            const toolListElement = document.getElementById('tool-list');
            
            // 创建"文档首页"链接
            const indexItem = document.createElement('li');
            const indexLink = document.createElement('a');
            indexLink.href = '?tool=index';
            indexLink.textContent = '文档首页';
            indexLink.dataset.tool = 'index';
            indexItem.appendChild(indexLink);
            toolListElement.innerHTML = '';
            toolListElement.appendChild(indexItem);
            
            // 根据分类创建工具列表
            const categories = {
                'dev': '开发工具类',
                'encode': '编解码转换类',
                'image': '图像处理类',
                'productivity': '效率工具类',
                'calculator': '计算工具类',
                'other': '其他工具'
            };
            
            // 遍历分类
            for (const [category, categoryName] of Object.entries(categories)) {
                // 创建分类标题
                const categoryHeader = document.createElement('li');
                categoryHeader.innerHTML = `<h3 style="padding: 15px 20px 5px; margin: 10px 0 0; font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">${categoryName}</h3>`;
                toolListElement.appendChild(categoryHeader);
                
                // 获取分类下的工具
                const tools = toolCategoryMap[category] || [];
                
                // 创建工具链接
                for (const tool of tools) {
                    if (toolNameMap[tool]) {
                        const toolItem = document.createElement('li');
                        const toolLink = document.createElement('a');
                        toolLink.href = `?tool=${tool}`;
                        toolLink.textContent = toolNameMap[tool];
                        toolLink.dataset.tool = tool;
                        toolItem.appendChild(toolLink);
                        toolListElement.appendChild(toolItem);
                    }
                }
            }
            
            // 为所有工具链接添加点击事件
            const toolLinks = document.querySelectorAll('.tool-list a');
            toolLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tool = this.dataset.tool;
                    history.pushState(null, null, `?tool=${tool}`);
                    loadToolDoc(tool);
                    
                    // 更新活动状态
                    toolLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // 在移动设备上自动关闭侧边栏
                    if (window.innerWidth <= 768) {
                        document.body.classList.remove('sidebar-open');
                        document.body.classList.add('sidebar-closed');
                    }
                });
            });
            
            // 根据URL参数加载指定工具的文档
            const selectedTool = getQueryParam('tool') || 'index';
            const activeLink = document.querySelector(`.tool-list a[data-tool="${selectedTool}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
            loadToolDoc(selectedTool);
            
        } catch (error) {
            console.error('加载工具列表失败:', error);
            document.getElementById('tool-list').innerHTML = '<p style="padding: 20px; color: #ef4444;">加载工具列表失败，请刷新页面重试。</p>';
        }
    }
    
    // 加载工具文档
    async function loadToolDoc(toolId) {
        const docContainer = document.getElementById('doc-container');
        docContainer.innerHTML = '<div class="loader"><div class="loader-spinner"></div></div>';
        
        try {
            const response = await fetch(`docs/${toolId}.md`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const markdownText = await response.text();
            const htmlContent = marked.parse(markdownText, markedOptions);
            
            // 添加标题和标签
            const toolName = toolNameMap[toolId] || toolId;
            let category = '';
            
            // 确定工具所属类别
            for (const [cat, tools] of Object.entries(toolCategoryMap)) {
                if (tools.includes(toolId)) {
                    switch(cat) {
                        case 'dev': category = '开发工具类'; break;
                        case 'encode': category = '编解码转换类'; break;
                        case 'image': category = '图像处理类'; break;
                        case 'productivity': category = '效率工具类'; break;
                        case 'calculator': category = '计算工具类'; break;
                        case 'other': category = '其他工具'; break;
                    }
                    break;
                }
            }
            
            const docHeader = `
                <div class="doc-header">
                    <h1>${toolName}</h1>
                    ${category ? `<div class="tool-tags"><span class="doc-tag">${category}</span></div>` : ''}
                </div>
            `;
            
            docContainer.innerHTML = `
                ${toolId !== 'index' ? docHeader : ''}
                <div class="doc-content">${htmlContent}</div>
            `;
            
            // 文档加载后，自动滚动到顶部
            window.scrollTo(0, 0);
            
            // 为文档中的链接添加点击事件
            const docLinks = docContainer.querySelectorAll('a[href^="../"]');
            docLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href.startsWith('../') && href.endsWith('.md')) {
                    const toolPath = href.replace('../', '').replace('.md', '');
                    link.href = `?tool=${toolPath}`;
                    
                    link.addEventListener('click', function(e) {
                        e.preventDefault();
                        history.pushState(null, null, this.href);
                        loadToolDoc(toolPath);
                        
                        // 更新侧边栏活动状态
                        const toolLinks = document.querySelectorAll('.tool-list a');
                        toolLinks.forEach(l => l.classList.remove('active'));
                        const activeLink = document.querySelector(`.tool-list a[data-tool="${toolPath}"]`);
                        if (activeLink) {
                            activeLink.classList.add('active');
                        }
                    });
                }
            });
            
        } catch (error) {
            console.error('加载文档失败:', error);
            docContainer.innerHTML = `
                <div class="doc-header">
                    <h1>文档加载失败</h1>
                </div>
                <div class="doc-content">
                    <p>抱歉，文档加载失败，请刷新页面重试或返回<a href="?tool=index">文档首页</a>。</p>
                    <p>错误信息: ${error.message}</p>
                </div>
            `;
        }
    }
    
    // 搜索功能
    const searchInput = document.getElementById('search-docs');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const toolLinks = document.querySelectorAll('.tool-list a');
        
        toolLinks.forEach(link => {
            const toolName = link.textContent.toLowerCase();
            if (toolName.includes(searchTerm) || searchTerm === '') {
                link.parentElement.style.display = 'block';
            } else {
                link.parentElement.style.display = 'none';
            }
        });
        
        // 隐藏/显示类别标题
        const categoryHeaders = document.querySelectorAll('.tool-list h3');
        categoryHeaders.forEach(header => {
            const nextSibling = header.parentElement.nextElementSibling;
            let hasVisibleTools = false;
            
            // 检查该类别下是否有可见的工具
            let current = nextSibling;
            while (current && !current.querySelector('h3')) {
                if (current.style.display !== 'none') {
                    hasVisibleTools = true;
                    break;
                }
                current = current.nextElementSibling;
            }
            
            header.parentElement.style.display = hasVisibleTools ? 'block' : 'none';
        });
    });
    
    // 移动端侧边栏切换
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    // 初始化侧边栏状态
    function initSidebarState() {
        if (window.innerWidth <= 768) {
            document.body.classList.add('sidebar-closed');
            document.body.classList.remove('sidebar-open');
            if (sidebarToggle) {
                sidebarToggle.style.display = 'flex';
                sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        } else {
            document.body.classList.add('sidebar-open');
            document.body.classList.remove('sidebar-closed');
            if (sidebarToggle) {
                sidebarToggle.style.display = 'none';
            }
        }
    }
    
    // 页面加载时初始化
    initSidebarState();
    
    // 侧边栏切换按钮点击事件
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (document.body.classList.contains('sidebar-open')) {
                document.body.classList.remove('sidebar-open');
                document.body.classList.add('sidebar-closed');
                this.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                document.body.classList.add('sidebar-open');
                document.body.classList.remove('sidebar-closed');
                this.innerHTML = '<i class="fas fa-times"></i>';
            }
        });
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        initSidebarState();
    });
    
    // 返回顶部按钮
    const backToTopButton = document.getElementById('back-to-top');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 初始化
    loadToolList();
    
    // 同步导航栏
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    navToggle.addEventListener('click', function() {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}); 

