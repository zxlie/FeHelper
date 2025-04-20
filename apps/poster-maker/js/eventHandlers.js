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
          content.style.display = 'none';
        });
        
        // 添加当前选项卡的active类
        tab.classList.add('active');
        
        // 显示对应的内容面板
        const tabId = tab.dataset.tab;
        if (tabId === 'templates') {
          document.getElementById('templates-tab').style.display = 'block';
        } else if (tabId === 'editor') {
          document.getElementById('editor-tab').style.display = 'block';
        } else if (tabId === 'advanced') {
          document.getElementById('advanced-tab').style.display = 'block';
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
  
  // 设置高级选项事件监听器
  setupAdvancedOptions();
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
