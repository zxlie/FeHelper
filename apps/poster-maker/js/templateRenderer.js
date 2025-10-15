// 模板渲染器

// 渲染模板缩略图列表
export function renderTemplates(templates, category = 'all') {
  const templatesContainer = document.getElementById('templates-container');
  
  if (!templatesContainer) return;
  
  templatesContainer.innerHTML = '';
  
  // 根据分类筛选模板
  const filteredTemplates = category === 'all' 
    ? templates 
    : templates.filter(template => template.category === category);
  
  // 创建一个文档片段，减少DOM操作
  const fragment = document.createDocumentFragment();
  
  filteredTemplates.forEach(template => {
    const templateItem = document.createElement('div');
    templateItem.className = 'template-item';
    templateItem.dataset.templateId = template.id;
    
    const thumbnail = document.createElement('img');
    // 使用较小的缩略图尺寸来加快加载
    thumbnail.src = template.thumbnail;
    thumbnail.className = 'template-thumbnail';
    thumbnail.alt = template.name;
    thumbnail.loading = 'lazy'; // 懒加载图片
    
    const templateName = document.createElement('div');
    templateName.className = 'template-name';
    templateName.textContent = template.name;
    
    templateItem.appendChild(thumbnail);
    templateItem.appendChild(templateName);
    fragment.appendChild(templateItem);
    
    // 添加点击事件
    templateItem.addEventListener('click', () => {
      // 移除其他模板的选中状态
      document.querySelectorAll('.template-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // 添加选中状态
      templateItem.classList.add('selected');
      
      // 初始化编辑器
      initializeEditor(template);
    });
  });
  
  // 一次性将所有元素添加到容器中
  templatesContainer.appendChild(fragment);
}

// 初始化编辑器
export function initializeEditor(template) {
  const editForm = document.getElementById('edit-form');
  const posterPreview = document.getElementById('poster-preview');
  const downloadBtn = document.getElementById('download-btn');
  
  if (!editForm || !posterPreview) return;
  
  // 清空编辑表单
  editForm.innerHTML = '';
  
  // 存储当前模板数据
  window.currentTemplate = template;
  window.currentValues = {};
  
  // 创建一个空的数据对象，用于生成模板HTML
  const emptyData = {};
  template.fields.forEach(field => {
    // 为每个字段提供默认值，避免undefined
    emptyData[field.name] = field.default || '';
  });
  
  // 检查模板HTML中是否有硬编码的内容
  const templateHTML = template.template(emptyData);
  const hardcodedTexts = findHardcodedTexts(templateHTML);
  
  // 组合所有需要编辑的字段
  let allFields = [...template.fields];
  
  // 添加从模板中检测到的硬编码文本作为可编辑字段
  const existingDefaults = allFields.map(field => field.default);
  
  hardcodedTexts.forEach((text, index) => {
    // 检查文本是否已存在于字段中，或者是否是常见文本
    if (!existingDefaults.includes(text) && !isCommonText(text)) {
      let label = '检测到的文本';
      
      if (text.length > 15) {
        label = `${text.substring(0, 15)}...`;
      } else {
        label = text;
      }
      
      allFields.push({
        name: `detected_text_${index}`,
        type: 'text',
        label: label,
        default: text
      });
    }
  });

  // 创建特殊的布局容器用于前三个字段
  const specialFormGroup = document.createElement('div');
  specialFormGroup.className = 'form-group special-layout';
  specialFormGroup.style.display = 'flex';
  specialFormGroup.style.gap = '15px';
  specialFormGroup.style.marginBottom = '20px';

  // 左侧图片容器
  const leftColumn = document.createElement('div');
  leftColumn.style.flex = '1';
  leftColumn.classList.add('left-column');

  // 右侧颜色容器
  const rightColumn = document.createElement('div');
  rightColumn.style.flex = '1';
  rightColumn.style.display = 'flex';
  rightColumn.style.flexDirection = 'column';
  rightColumn.style.gap = '30px';
  rightColumn.classList.add('right-column');

  // 处理前三个特殊字段
  const firstThreeFields = allFields.slice(0, 3);
  const remainingFields = allFields.slice(3);

  firstThreeFields.forEach((field, index) => {
    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', `field-${field.name}`);

    if (index === 0) { // 图片字段
      const imageUpload = document.createElement('div');
      imageUpload.className = 'image-upload';
      
      const imagePreview = document.createElement('div');
      imagePreview.className = 'upload-preview';
      
      const img = document.createElement('img');
      img.src = field.default || '';
      img.id = `preview-${field.name}`;
      imagePreview.appendChild(img);
      
      const uploadButton = document.createElement('label');
      uploadButton.className = 'upload-btn';
      uploadButton.textContent = '更换图片';
      uploadButton.setAttribute('for', `field-${field.name}`);
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.id = `field-${field.name}`;
      input.style.display = 'none';
      
      input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function(event) {
            img.src = event.target.result;
            window.currentValues[field.name] = event.target.result;
            updatePosterPreview();
          };
          reader.readAsDataURL(file);
        }
      });
      
      imageUpload.appendChild(imagePreview);
      imageUpload.appendChild(uploadButton);
      imageUpload.appendChild(input);
      
      leftColumn.appendChild(label);
      leftColumn.appendChild(imageUpload);
      
      window.currentValues[field.name] = field.default || '';
    } else { // 颜色字段
      const colorContainer = document.createElement('div');
      colorContainer.style.flex = '1';
      
      const input = document.createElement('input');
      input.type = 'color';
      input.className = 'color-picker';
      input.id = `field-${field.name}`;
      input.value = field.default || '#000000';
      
      input.addEventListener('input', function(e) {
        window.currentValues[field.name] = e.target.value;
        updatePosterPreview();
      });
      
      window.currentValues[field.name] = field.default || '';
      
      colorContainer.appendChild(label);
      colorContainer.appendChild(input);
      rightColumn.appendChild(colorContainer);
    }
  });

  specialFormGroup.appendChild(leftColumn);
  specialFormGroup.appendChild(rightColumn);
  editForm.appendChild(specialFormGroup);

  // 处理剩余字段
  remainingFields.forEach(field => {
    if (field.default === undefined || field.default === null) {
      field.default = '';
    }
    
    if (field.name.startsWith('detected_text_') && isCommonText(field.default)) {
      return;
    }
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', `field-${field.name}`);
    
    let input;
    
    switch (field.type) {
      case 'textarea':
        input = document.createElement('textarea');
        input.className = 'form-control';
        input.id = `field-${field.name}`;
        input.value = field.default || '';
        input.rows = 3;
        break;
        
      case 'color':
        input = document.createElement('input');
        input.type = 'color';
        input.className = 'color-picker';
        input.id = `field-${field.name}`;
        input.value = field.default || '#000000';
        break;
        
      case 'image':
        const imageUpload = document.createElement('div');
        imageUpload.className = 'image-upload';
        
        const imagePreview = document.createElement('div');
        imagePreview.className = 'upload-preview';
        
        const img = document.createElement('img');
        img.src = field.default || '';
        img.id = `preview-${field.name}`;
        imagePreview.appendChild(img);
        
        const uploadButton = document.createElement('label');
        uploadButton.className = 'upload-btn';
        uploadButton.textContent = '选择图片';
        uploadButton.setAttribute('for', `field-${field.name}`);
        
        input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.id = `field-${field.name}`;
        input.style.display = 'none';
        
        input.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
              img.src = event.target.result;
              window.currentValues[field.name] = event.target.result;
              updatePosterPreview();
            };
            reader.readAsDataURL(file);
          }
        });
        
        imageUpload.appendChild(imagePreview);
        imageUpload.appendChild(uploadButton);
        imageUpload.appendChild(input);
        
        formGroup.appendChild(label);
        formGroup.appendChild(imageUpload);
        editForm.appendChild(formGroup);
        
        window.currentValues[field.name] = field.default || '';
        
        return;
        
      default:
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = `field-${field.name}`;
        input.value = field.default || '';
    }
    
    input.addEventListener('input', function(e) {
      window.currentValues[field.name] = e.target.value;
      updatePosterPreview();
    });
    
    window.currentValues[field.name] = field.default || '';
    
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    editForm.appendChild(formGroup);
  });
  
  // 启用下载按钮
  if (downloadBtn) downloadBtn.disabled = false;
  
  // 更新预览
  updatePosterPreview();
  
  // 自动切换到编辑标签页
  const editorTab = document.querySelector('.panel-tab[data-tab="editor-tab"]');
  if (editorTab) {
    editorTab.click();
  }
  
  // 添加一个提示信息，如果检测到了额外文本
  const detectedCount = allFields.filter(f => f.name.startsWith('detected_text_')).length;
  if (detectedCount > 0 && !document.querySelector('.detection-notice')) {
    const notice = document.createElement('div');
    notice.className = 'detection-notice';
    notice.innerHTML = `
      <div class="info-message">
        <i class="fas fa-info-circle"></i>
        <span>已自动检测到模板中的额外可编辑文本</span>
      </div>
    `;
    editForm.insertBefore(notice, editForm.firstChild);
  }
}

// 查找模板中的硬编码文本
function findHardcodedTexts(html) {
  const texts = new Set();
  
  // 创建一个临时的DOM元素来解析HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 递归收集文本节点
  const collectTextNodes = (element) => {
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && !isFontAwesomeClass(text) && !isCssValue(text)) {
          texts.add(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        collectTextNodes(node);
      }
    });
  };
  
  collectTextNodes(temp);
  return Array.from(texts);
}

// 检查是否是Font Awesome类名
function isFontAwesomeClass(text) {
  return text.startsWith('fa-') || text.startsWith('fas ') || text.startsWith('far ') || text.startsWith('fab ');
}

// 检查是否是CSS值
function isCssValue(text) {
  // CSS单位和值的正则表达式
  const cssValueRegex = /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|deg|s|ms)?$/;
  const colorRegex = /^#[0-9a-f]{3,6}$/i;
  const rgbaRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/;
  
  return cssValueRegex.test(text) || colorRegex.test(text) || rgbaRegex.test(text);
}

// 检查是否是常见文本
function isCommonText(text) {
  // 如果文本太短，可能不需要编辑
  if (text.length < 3) return true;
  
  // 常见的不需要编辑的文本
  const commonTexts = [
    '选择图片',
    '上传',
    '下载',
    '分享',
    '编辑',
    '预览',
    '确定',
    '取消'
  ];
  
  return commonTexts.includes(text);
}

// 更新海报预览
function updatePosterPreview() {
  const posterPreview = document.getElementById('poster-preview');
  if (!posterPreview || !window.currentTemplate) return;
  
  // 生成预览HTML
  const previewHTML = window.currentTemplate.template(window.currentValues);
  posterPreview.innerHTML = previewHTML;
}

// 下载海报
window.downloadPoster = function(format = 'png', quality = 0.9) {
  const posterPreview = document.getElementById('poster-preview');
  
  if (!posterPreview) return;
  
  // 显示加载提示
  const loadingTip = document.createElement('div');
  loadingTip.className = 'loading-tip';
  loadingTip.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成海报...';
  document.body.appendChild(loadingTip);

  // 获取所有图片并保存原始样式
  const images = posterPreview.getElementsByTagName('img');
  const originalStyles = Array.from(images).map(img => ({
    width: img.style.width,
    height: img.style.height,
    maxWidth: img.style.maxWidth,
    maxHeight: img.style.maxHeight,
    objectFit: img.style.objectFit
  }));

  // 创建一个函数来清理资源
  const cleanup = () => {
    try {
      // 移除加载提示
      if (loadingTip && loadingTip.parentNode) {
        loadingTip.remove();
      }
      
      // 恢复图片原始样式
      Array.from(images).forEach((img, index) => {
        if (originalStyles[index]) {
          Object.assign(img.style, originalStyles[index]);
        }
      });
      
      // 恢复水印
      if (watermarkData) {
        watermarkData.parent.appendChild(watermarkData.element);
      }
    } catch (error) {
      console.error('清理资源时发生错误:', error);
    }
  };
  
  // 临时移除水印（如果有）以便导出时不包含水印
  const watermark = posterPreview.querySelector('.poster-watermark');
  let watermarkData = null;
  
  if (watermark) {
    watermarkData = {
      element: watermark,
      parent: watermark.parentNode
    };
    watermark.remove();
  }
  
  try {
    // 获取预览区域的实际尺寸
    const previewRect = posterPreview.getBoundingClientRect();
    const previewWidth = previewRect.width;
    const previewHeight = previewRect.height;
    
    // 优化图片尺寸和质量
    Array.from(images).forEach(img => {
      // 保持图片原始比例
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.maxWidth = 'none'; // 移除最大宽度限制
      img.style.objectFit = 'cover';
      img.style.imageRendering = 'high-quality';
      img.style.webkitFontSmoothing = 'antialiased';
      img.style.mozOsxFontSmoothing = 'grayscale';
      
      // 强制浏览器使用高质量缩放
      if (img.naturalWidth && img.naturalHeight) {
        img.setAttribute('width', img.naturalWidth);
        img.setAttribute('height', img.naturalHeight);
      }
    });
  } catch (error) {
    console.error('设置图片样式时发生错误:', error);
    cleanup();
    return;
  }
  
  // 优化的html2canvas配置
  const canvasOptions = {
    scale: format === 'png' ? 3 : 2, // 提高缩放比例以获得更清晰的输出
    useCORS: true,
    allowTaint: true,
    backgroundColor: format === 'png' ? null : 'white',
    imageTimeout: 30000, // 30秒超时
    logging: false,
    onclone: function(clonedDoc) {
      try {
        const clonedImages = clonedDoc.getElementsByTagName('img');
        Array.from(clonedImages).forEach(img => {
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.maxWidth = 'none';
          img.style.objectFit = 'cover';
          img.style.imageRendering = 'high-quality';
          img.style.webkitFontSmoothing = 'antialiased';
          img.style.mozOsxFontSmoothing = 'grayscale';
          
          if (img.naturalWidth && img.naturalHeight) {
            img.setAttribute('width', img.naturalWidth);
            img.setAttribute('height', img.naturalHeight);
          }
          
          // 确保图片已加载
          if (!img.complete) {
            return new Promise((resolve) => {
              img.onload = resolve;
            });
          }
        });
      } catch (error) {
        console.error('克隆文档时发生错误:', error);
      }
    }
  };

  // 使用Promise.race来添加超时处理
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('生成超时')), 40000); // 40秒总超时
  });

  Promise.race([
    html2canvas(posterPreview, canvasOptions),
    timeoutPromise
  ]).then(canvas => {
    try {
      // 根据格式选择导出方式
      const exportQuality = format === 'png' ? undefined : 1.0; // 最高质量JPEG
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      
      // 获取原始canvas的尺寸
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      
      // 创建一个新的canvas，保持原始比例
      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d', {
        alpha: format === 'png',
        willReadFrequently: false,
        desynchronized: true
      });
      
      // 设置输出尺寸，保持原始比例
      const maxWidth = 1600; // 增加最大宽度以提高清晰度
      const scale = maxWidth / originalWidth;
      tempCanvas.width = maxWidth;
      tempCanvas.height = originalHeight * scale;
      
      // 使用高质量的图像平滑
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // 绘制调整后的图像，保持比例
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      
      // 如果是PNG格式，尝试优化透明度处理
      if (format === 'png') {
        const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.putImageData(imageData, 0, 0);
      }
      
      tempCanvas.toBlob(blob => {
        const templateName = window.currentTemplate ? window.currentTemplate.name : 'poster';
        saveAs(blob, `${templateName}-${Date.now()}.${format}`);
        cleanup();
      }, mimeType, exportQuality);
    } catch (error) {
      console.error('导出图片时发生错误:', error);
      cleanup();
    }
  }).catch(error => {
    console.error('下载海报失败:', error);
    alert('生成海报失败，请重试');
    cleanup();
  });
}
