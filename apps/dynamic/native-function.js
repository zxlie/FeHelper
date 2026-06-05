// 保留原生 Function 引用，避免被 evalCore 覆盖后只能按 ES5 语法解析（会导致 const/let/=> 报错）
window.__FH_NATIVE_FUNCTION__ = Function;
