/** Shared by the classic template manager and the background service worker. */
globalThis.FHMonkeyFreeCopy = (() => {
    const legacyScript = `(() => {
  const events = ['contextmenu', 'selectstart', 'copy', 'cut', 'dragstart', 'mousedown'];
  events.forEach(ev => {
    document.addEventListener(ev, e => e.stopPropagation(), true);
    window.addEventListener(ev, e => e.stopPropagation(), true);
  });
  document.oncontextmenu = document.onselectstart = document.oncopy = null;
  console.log('[FeHelper] 已解除复制/右键限制');
})();`;
    const script = `(() => {
  // 不拦截 mousedown/dragstart/cut：编辑器聚焦、时间选择和拖拽依赖这些事件。
  const allowCopy = e => {
    const path = e.composedPath();
    const editing = document.designMode === 'on' || path.some(el =>
      el.nodeType === 1 && (el.isContentEditable || el.matches('input, textarea, select, [role="textbox"]'))
    );
    if (!editing) e.stopPropagation();
  };
  ['contextmenu', 'selectstart', 'copy'].forEach(ev => {
    window.addEventListener(ev, allowCopy, true);
  });
  console.log('[FeHelper] 已解除复制/右键限制');
})();`;

    // Only replace the unmodified built-in body, including renamed installations.
    // User code and all matching, enabled/disabled, CSS and timing settings stay intact.
    function migrate(monkey) {
        if (monkey.mScript === legacyScript) monkey.mScript = script;
        return monkey;
    }

    return { script, migrate };
})();
