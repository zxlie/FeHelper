import { templates } from './js/templateData.js';
import { renderTemplates, initializeEditor } from './js/templateRenderer.js';
import { setupEventListeners } from './js/eventHandlers.js';
import { setupImageUpload } from './js/imageUpload.js';

document.addEventListener('DOMContentLoaded', () => {
  // 渲染所有模板缩略图
  renderTemplates(templates);
  
  // 设置事件监听器
  setupEventListeners();
  
  // 初始化图片上传功能
  setupImageUpload();
  
  // 添加预览区域的缩放控制
  setupPreviewZoom();
  
  // 默认选择第一个模板
  setTimeout(() => {
    const firstTemplate = document.querySelector('.template-item');
    if (firstTemplate) {
      firstTemplate.click();
    }
  }, 100);
});

// 设置预览区域的缩放控制
function setupPreviewZoom() {
  const previewContainer = document.querySelector('.preview-container');
  const posterPreview = document.getElementById('poster-preview');
  
  if (!previewContainer || !posterPreview) return;
  
  // 创建缩放控制按钮容器
  const zoomControls = document.createElement('div');
  zoomControls.className = 'zoom-controls';
  
  // 创建放大按钮
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'zoom-btn';
  zoomInBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
  zoomInBtn.title = '放大';
  
  // 创建缩小按钮
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'zoom-btn';
  zoomOutBtn.innerHTML = '<i class="fas fa-search-minus"></i>';
  zoomOutBtn.title = '缩小';
  
  // 创建重置按钮
  const resetZoomBtn = document.createElement('button');
  resetZoomBtn.className = 'zoom-btn';
  resetZoomBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
  resetZoomBtn.title = '重置大小';
  
  // 添加按钮到控制容器
  zoomControls.appendChild(zoomOutBtn);
  zoomControls.appendChild(resetZoomBtn);
  zoomControls.appendChild(zoomInBtn);
  
  // 添加控制容器到预览区域
  previewContainer.appendChild(zoomControls);
  
  // 设置当前缩放级别
  let currentZoom = 1;
  const zoomStep = 0.1;
  const maxZoom = 1.5;
  const minZoom = 0.5;
  
  // 添加放大事件
  zoomInBtn.addEventListener('click', () => {
    if (currentZoom < maxZoom) {
      currentZoom += zoomStep;
      applyZoom();
    }
  });
  
  // 添加缩小事件
  zoomOutBtn.addEventListener('click', () => {
    if (currentZoom > minZoom) {
      currentZoom -= zoomStep;
      applyZoom();
    }
  });
  
  // 添加重置事件
  resetZoomBtn.addEventListener('click', () => {
    currentZoom = 1;
    applyZoom();
  });
  
  // 应用缩放
  function applyZoom() {
    posterPreview.style.transform = `scale(${currentZoom})`;
  }
  
  // 添加鼠标滚轮缩放
  previewContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    if (e.deltaY < 0 && currentZoom < maxZoom) {
      // 向上滚动，放大
      currentZoom += zoomStep;
    } else if (e.deltaY > 0 && currentZoom > minZoom) {
      // 向下滚动，缩小
      currentZoom -= zoomStep;
    }
    
    applyZoom();
  });
} 