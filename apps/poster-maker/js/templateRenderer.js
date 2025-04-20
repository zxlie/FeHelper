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
  const shareBtn = document.getElementById('share-btn');
  
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
      // 为检测到的文本创建一个更有意义的标签
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
  
  // 为每个字段创建表单控件
  allFields.forEach(field => {
    // 确保字段有默认值，避免undefined
    if (field.default === undefined || field.default === null) {
      field.default = '';
    }
    
    // 如果是检测到的文本字段，但内容过短或不需要编辑，则跳过
    if (field.name.startsWith('detected_text_') && isCommonText(field.default)) {
      return;
    }
    
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', `field-${field.name}`);
    
    let input;
    
    // 根据字段类型创建不同的输入控件
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
        
        // 添加图片预览功能
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
        
        // 存储默认值
        window.currentValues[field.name] = field.default || '';
        
        return;
        
      default: // text 和其他类型
        input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = `field-${field.name}`;
        input.value = field.default || '';
    }
    
    // 添加输入事件监听器
    input.addEventListener('input', function(e) {
      window.currentValues[field.name] = e.target.value;
      updatePosterPreview();
    });
    
    // 存储默认值
    window.currentValues[field.name] = field.default || '';
    
    formGroup.appendChild(label);
    formGroup.appendChild(input);
    editForm.appendChild(formGroup);
  });
  
  // 启用下载和分享按钮
  if (downloadBtn) downloadBtn.disabled = false;
  if (shareBtn) shareBtn.disabled = false;
  
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
  
  // 使用全局的html2canvas将预览区域转换为图片
  html2canvas(posterPreview, {
    scale: 2, // 提高图片质量
    useCORS: true, // 允许加载跨域图片
    allowTaint: true,
    backgroundColor: format === 'png' ? null : 'white'
  }).then(canvas => {
    // 根据格式选择导出方式
    if (format === 'png') {
      canvas.toBlob(blob => {
        const templateName = window.currentTemplate ? window.currentTemplate.name : 'poster';
        // 使用全局的saveAs
        saveAs(blob, `${templateName}-${Date.now()}.png`);
      }, 'image/png');
    } else {
      canvas.toBlob(blob => {
        const templateName = window.currentTemplate ? window.currentTemplate.name : 'poster';
        // 使用全局的saveAs
        saveAs(blob, `${templateName}-${Date.now()}.jpg`);
      }, 'image/jpeg', quality);
    }
    
    // 导出完成后恢复水印
    if (watermarkData) {
      watermarkData.parent.appendChild(watermarkData.element);
    }
  }).catch(error => {
    console.error('下载海报失败:', error);
    alert('下载失败，请重试');
    
    // 出错时也恢复水印
    if (watermarkData) {
      watermarkData.parent.appendChild(watermarkData.element);
    }
  });
}
