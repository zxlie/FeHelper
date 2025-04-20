import { templates } from './templateData.js';
import { renderTemplates } from './templateRenderer.js';
import { setupEventListeners } from './eventHandlers.js';
import { setupImageUpload } from './imageUpload.js';

// 将模板和渲染函数挂载到window对象上
window.templates = templates;
window.renderTemplates = renderTemplates;

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
  const posterPreview = document.getElementById('poster-preview');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const resetZoomBtn = document.getElementById('zoom-reset');
  const previewContainer = document.querySelector('.preview-container');
  
  if (!posterPreview || !zoomInBtn || !zoomOutBtn || !resetZoomBtn || !previewContainer) return;
  
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
    currentZoom = 0.65;
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

  // 初始化时自动触发重置缩放
  resetZoomBtn.click();
}
