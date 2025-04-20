// 事件处理器

// 设置所有事件监听器
export function setupEventListeners() {
  // 面板选项卡切换
  const panelTabs = document.querySelectorAll('.panel-tab');
  if (panelTabs) {
    panelTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // 移除所有选项卡的active类
        panelTabs.forEach(t => t.classList.remove('active'));
        
        // 隐藏所有内容面板
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // 添加当前选项卡的active类
        tab.classList.add('active');
        
        // 显示对应的内容面板
        const tabId = tab.dataset.tab;
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });
  }
  
  // 分类筛选按钮
  const categoryBtns = document.querySelectorAll('.category-btn');
  if (categoryBtns) {
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 移除所有按钮的active类
        categoryBtns.forEach(b => b.classList.remove('active'));
        
        // 添加当前按钮的active类
        btn.classList.add('active');
        
        // 获取分类值并渲染模板
        const category = btn.dataset.category;
        window.renderTemplates(window.templates, category);
      });
    });
  }
  
  // 下载按钮
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // 获取导出设置
      const exportFormat = document.getElementById('export-format')?.value || 'png';
      const exportQuality = document.getElementById('export-quality')?.value / 100 || 0.9;
      
      // 下载海报
      window.downloadPoster(exportFormat, exportQuality);
    });
  }
  
  // 分享按钮
  const shareBtn = document.getElementById('share-btn');
  const shareModal = document.getElementById('share-modal');
  const overlay = document.getElementById('overlay');
  const closeModal = document.querySelector('.close-modal');
  
  if (shareBtn && shareModal && overlay && closeModal) {
    // 打开分享模态框
    shareBtn.addEventListener('click', () => {
      shareModal.style.display = 'block';
      overlay.style.display = 'block';
    });
    
    // 关闭分享模态框
    closeModal.addEventListener('click', () => {
      shareModal.style.display = 'none';
      overlay.style.display = 'none';
    });
    
    // 点击遮罩层关闭模态框
    overlay.addEventListener('click', () => {
      shareModal.style.display = 'none';
      overlay.style.display = 'none';
    });
    
    // 设置分享选项点击事件
    const shareOptions = document.querySelectorAll('.share-option');
    shareOptions.forEach(option => {
      option.addEventListener('click', () => {
        // 先下载海报
        window.downloadPoster();
        
        const platform = option.dataset.platform;
        alert(`已下载海报，请在${getPlatformName(platform)}中分享`);
        
        // 关闭模态框
        shareModal.style.display = 'none';
        overlay.style.display = 'none';
      });
    });
  }
  
  // 设置高级选项事件监听器
  setupAdvancedOptions();
}

// 获取平台名称
function getPlatformName(platform) {
  const platforms = {
    wechat: '微信',
    weibo: '微博',
    xiaohongshu: '小红书',
    qq: 'QQ'
  };
  
  return platforms[platform] || '社交平台';
}

// 设置高级选项事件监听器
function setupAdvancedOptions() {
  // 布局调整
  const posterWidth = document.getElementById('poster-width');
  const posterHeight = document.getElementById('poster-height');
  const posterPreview = document.getElementById('poster-preview');
  
  if (posterWidth && posterHeight && posterPreview) {
    posterWidth.addEventListener('input', (e) => {
      const value = e.target.value;
      posterWidth.nextElementSibling.textContent = `${value}%`;
      posterPreview.style.width = `${375 * value / 100}px`;
    });
    
    posterHeight.addEventListener('input', (e) => {
      const value = e.target.value;
      posterHeight.nextElementSibling.textContent = `${value}%`;
      posterPreview.style.height = `${667 * value / 100}px`;
    });
  }
  
  // 滤镜效果
  const brightness = document.getElementById('brightness');
  const contrast = document.getElementById('contrast');
  const saturation = document.getElementById('saturation');
  
  if (brightness && contrast && saturation && posterPreview) {
    const updateFilter = () => {
      const brightnessValue = brightness.value;
      const contrastValue = contrast.value;
      const saturationValue = saturation.value;
      
      posterPreview.style.setProperty('--brightness', `${brightnessValue}%`);
      posterPreview.style.setProperty('--contrast', `${contrastValue}%`);
      posterPreview.style.setProperty('--saturation', `${saturationValue}%`);
      posterPreview.classList.add('with-filter');
      
      brightness.nextElementSibling.textContent = `${brightnessValue}%`;
      contrast.nextElementSibling.textContent = `${contrastValue}%`;
      saturation.nextElementSibling.textContent = `${saturationValue}%`;
    };
    
    brightness.addEventListener('input', updateFilter);
    contrast.addEventListener('input', updateFilter);
    saturation.addEventListener('input', updateFilter);
  }
  
  // 导出质量
  const exportQuality = document.getElementById('export-quality');
  if (exportQuality) {
    exportQuality.addEventListener('input', (e) => {
      const value = e.target.value;
      exportQuality.nextElementSibling.textContent = `${value}%`;
    });
  }
  
  // 水印设置
  const enableWatermark = document.getElementById('enable-watermark');
  const watermarkOptions = document.querySelector('.watermark-options');
  const watermarkText = document.getElementById('watermark-text');
  const watermarkPosition = document.getElementById('watermark-position');
  const watermarkOpacity = document.getElementById('watermark-opacity');
  
  if (enableWatermark && watermarkOptions) {
    enableWatermark.addEventListener('change', (e) => {
      if (e.target.checked) {
        watermarkOptions.style.display = 'block';
        updateWatermark();
      } else {
        watermarkOptions.style.display = 'none';
        removeWatermark();
      }
    });
    
    if (watermarkText && watermarkPosition && watermarkOpacity) {
      watermarkText.addEventListener('input', updateWatermark);
      watermarkPosition.addEventListener('change', updateWatermark);
      watermarkOpacity.addEventListener('input', () => {
        watermarkOpacity.nextElementSibling.textContent = `${watermarkOpacity.value}%`;
        updateWatermark();
      });
    }
  }
}

// 更新水印
function updateWatermark() {
  const posterPreview = document.getElementById('poster-preview');
  if (!posterPreview) return;
  
  // 移除现有水印
  removeWatermark();
  
  const watermarkText = document.getElementById('watermark-text').value;
  const watermarkPosition = document.getElementById('watermark-position').value;
  const watermarkOpacity = document.getElementById('watermark-opacity').value / 100;
  
  // 创建水印元素
  const watermark = document.createElement('div');
  watermark.className = 'poster-watermark';
  watermark.textContent = watermarkText;
  watermark.style.opacity = watermarkOpacity;
  
  // 设置水印位置
  switch (watermarkPosition) {
    case 'bottom-right':
      watermark.style.bottom = '10px';
      watermark.style.right = '10px';
      break;
    case 'bottom-left':
      watermark.style.bottom = '10px';
      watermark.style.left = '10px';
      break;
    case 'top-right':
      watermark.style.top = '10px';
      watermark.style.right = '10px';
      break;
    case 'top-left':
      watermark.style.top = '10px';
      watermark.style.left = '10px';
      break;
    case 'center':
      watermark.style.top = '50%';
      watermark.style.left = '50%';
      watermark.style.transform = 'translate(-50%, -50%)';
      break;
  }
  
  posterPreview.appendChild(watermark);
}

// 移除水印
function removeWatermark() {
  const posterPreview = document.getElementById('poster-preview');
  const watermark = posterPreview?.querySelector('.poster-watermark');
  if (watermark) {
    watermark.remove();
  }
}
