/* PrismJS 1.15.0
https://prismjs.com/download.html#themes=prism-coy&languages=markup+css+clike+javascript+sql+plsql */
var _self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{},Prism=function(){var e=/\blang(?:uage)?-([\w-]+)\b/i,t=0,n=_self.Prism={manual:_self.Prism&&_self.Prism.manual,disableWorkerMessageHandler:_self.Prism&&_self.Prism.disableWorkerMessageHandler,util:{encode:function(e){return e instanceof r?new r(e.type,n.util.encode(e.content),e.alias):"Array"===n.util.type(e)?e.map(n.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},objId:function(e){return e.__id||Object.defineProperty(e,"__id",{value:++t}),e.__id},clone:function(e,t){var r=n.util.type(e);switch(t=t||{},r){case"Object":if(t[n.util.objId(e)])return t[n.util.objId(e)];var a={};t[n.util.objId(e)]=a;for(var l in e)e.hasOwnProperty(l)&&(a[l]=n.util.clone(e[l],t));return a;case"Array":if(t[n.util.objId(e)])return t[n.util.objId(e)];var a=[];return t[n.util.objId(e)]=a,e.forEach(function(e,r){a[r]=n.util.clone(e,t)}),a}return e}},languages:{extend:function(e,t){var r=n.util.clone(n.languages[e]);for(var a in t)r[a]=t[a];return r},insertBefore:function(e,t,r,a){a=a||n.languages;var l=a[e];if(2==arguments.length){r=arguments[1];for(var i in r)r.hasOwnProperty(i)&&(l[i]=r[i]);return l}var o={};for(var s in l)if(l.hasOwnProperty(s)){if(s==t)for(var i in r)r.hasOwnProperty(i)&&(o[i]=r[i]);o[s]=l[s]}return n.languages.DFS(n.languages,function(t,n){n===a[e]&&t!=e&&(this[t]=o)}),a[e]=o},DFS:function(e,t,r,a){a=a||{};for(var l in e)e.hasOwnProperty(l)&&(t.call(e,l,e[l],r||l),"Object"!==n.util.type(e[l])||a[n.util.objId(e[l])]?"Array"!==n.util.type(e[l])||a[n.util.objId(e[l])]||(a[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,l,a)):(a[n.util.objId(e[l])]=!0,n.languages.DFS(e[l],t,null,a)))}},plugins:{},highlightAll:function(e,t){n.highlightAllUnder(document,e,t)},highlightAllUnder:function(e,t,r){var a={callback:r,selector:'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'};n.hooks.run("before-highlightall",a);for(var l,i=a.elements||e.querySelectorAll(a.selector),o=0;l=i[o++];)n.highlightElement(l,t===!0,a.callback)},highlightElement:function(t,r,a){for(var l,i,o=t;o&&!e.test(o.className);)o=o.parentNode;o&&(l=(o.className.match(e)||[,""])[1].toLowerCase(),i=n.languages[l]),t.className=t.className.replace(e,"").replace(/\s+/g," ")+" language-"+l,t.parentNode&&(o=t.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+l));var s=t.textContent,u={element:t,language:l,grammar:i,code:s};if(n.hooks.run("before-sanity-check",u),!u.code||!u.grammar)return u.code&&(n.hooks.run("before-highlight",u),u.element.textContent=u.code,n.hooks.run("after-highlight",u)),n.hooks.run("complete",u),void 0;if(n.hooks.run("before-highlight",u),r&&_self.Worker){var g=new Worker(n.filename);g.onmessage=function(e){u.highlightedCode=e.data,n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,a&&a.call(u.element),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},g.postMessage(JSON.stringify({language:u.language,code:u.code,immediateClose:!0}))}else u.highlightedCode=n.highlight(u.code,u.grammar,u.language),n.hooks.run("before-insert",u),u.element.innerHTML=u.highlightedCode,a&&a.call(t),n.hooks.run("after-highlight",u),n.hooks.run("complete",u)},highlight:function(e,t,a){var l={code:e,grammar:t,language:a};return n.hooks.run("before-tokenize",l),l.tokens=n.tokenize(l.code,l.grammar),n.hooks.run("after-tokenize",l),r.stringify(n.util.encode(l.tokens),l.language)},matchGrammar:function(e,t,r,a,l,i,o){var s=n.Token;for(var u in r)if(r.hasOwnProperty(u)&&r[u]){if(u==o)return;var g=r[u];g="Array"===n.util.type(g)?g:[g];for(var c=0;c<g.length;++c){var h=g[c],f=h.inside,d=!!h.lookbehind,m=!!h.greedy,p=0,y=h.alias;if(m&&!h.pattern.global){var v=h.pattern.toString().match(/[imuy]*$/)[0];h.pattern=RegExp(h.pattern.source,v+"g")}h=h.pattern||h;for(var b=a,k=l;b<t.length;k+=t[b].length,++b){var w=t[b];if(t.length>e.length)return;if(!(w instanceof s)){if(m&&b!=t.length-1){h.lastIndex=k;var _=h.exec(e);if(!_)break;for(var j=_.index+(d?_[1].length:0),P=_.index+_[0].length,A=b,x=k,O=t.length;O>A&&(P>x||!t[A].type&&!t[A-1].greedy);++A)x+=t[A].length,j>=x&&(++b,k=x);if(t[b]instanceof s)continue;I=A-b,w=e.slice(k,x),_.index-=k}else{h.lastIndex=0;var _=h.exec(w),I=1}if(_){d&&(p=_[1]?_[1].length:0);var j=_.index+p,_=_[0].slice(p),P=j+_.length,N=w.slice(0,j),S=w.slice(P),C=[b,I];N&&(++b,k+=N.length,C.push(N));var E=new s(u,f?n.tokenize(_,f):_,y,_,m);if(C.push(E),S&&C.push(S),Array.prototype.splice.apply(t,C),1!=I&&n.matchGrammar(e,t,r,b,k,!0,u),i)break}else if(i)break}}}}},tokenize:function(e,t){var r=[e],a=t.rest;if(a){for(var l in a)t[l]=a[l];delete t.rest}return n.matchGrammar(e,r,t,0,0,!1),r},hooks:{all:{},add:function(e,t){var r=n.hooks.all;r[e]=r[e]||[],r[e].push(t)},run:function(e,t){var r=n.hooks.all[e];if(r&&r.length)for(var a,l=0;a=r[l++];)a(t)}}},r=n.Token=function(e,t,n,r,a){this.type=e,this.content=t,this.alias=n,this.length=0|(r||"").length,this.greedy=!!a};if(r.stringify=function(e,t,a){if("string"==typeof e)return e;if("Array"===n.util.type(e))return e.map(function(n){return r.stringify(n,t,e)}).join("");var l={type:e.type,content:r.stringify(e.content,t,a),tag:"span",classes:["token",e.type],attributes:{},language:t,parent:a};if(e.alias){var i="Array"===n.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(l.classes,i)}n.hooks.run("wrap",l);var o=Object.keys(l.attributes).map(function(e){return e+'="'+(l.attributes[e]||"").replace(/"/g,"&quot;")+'"'}).join(" ");return"<"+l.tag+' class="'+l.classes.join(" ")+'"'+(o?" "+o:"")+">"+l.content+"</"+l.tag+">"},!_self.document)return _self.addEventListener?(n.disableWorkerMessageHandler||_self.addEventListener("message",function(e){var t=JSON.parse(e.data),r=t.language,a=t.code,l=t.immediateClose;_self.postMessage(n.highlight(a,n.languages[r],r)),l&&_self.close()},!1),_self.Prism):_self.Prism;var a=document.currentScript||[].slice.call(document.getElementsByTagName("script")).pop();return a&&(n.filename=a.src,n.manual||a.hasAttribute("data-manual")||("loading"!==document.readyState?window.requestAnimationFrame?window.requestAnimationFrame(n.highlightAll):window.setTimeout(n.highlightAll,16):document.addEventListener("DOMContentLoaded",n.highlightAll))),_self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism),"undefined"!=typeof global&&(global.Prism=Prism);
Prism.languages.markup={comment:/<!--[\s\S]*?-->/,prolog:/<\?[\s\S]+?\?>/,doctype:/<!DOCTYPE[\s\S]+?>/i,cdata:/<!\[CDATA\[[\s\S]*?]]>/i,tag:{pattern:/<\/?(?!\d)[^\s>\/=$<%]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+))?)*\s*\/?>/i,greedy:!0,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=(?:("|')(?:\\[\s\S]|(?!\1)[^\\])*\1|[^\s'">=]+)/i,inside:{punctuation:[/^=/,{pattern:/(^|[^\\])["']/,lookbehind:!0}]}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},Prism.languages.markup.tag.inside["attr-value"].inside.entity=Prism.languages.markup.entity,Prism.hooks.add("wrap",function(a){"entity"===a.type&&(a.attributes.title=a.content.replace(/&amp;/,"&"))}),Prism.languages.xml=Prism.languages.markup,Prism.languages.html=Prism.languages.markup,Prism.languages.mathml=Prism.languages.markup,Prism.languages.svg=Prism.languages.markup;
Prism.languages.css={comment:/\/\*[\s\S]*?\*\//,atrule:{pattern:/@[\w-]+?.*?(?:;|(?=\s*\{))/i,inside:{rule:/@[\w-]+/}},url:/url\((?:(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,selector:/[^{}\s][^{};]*?(?=\s*\{)/,string:{pattern:/("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},property:/[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,important:/\B!important\b/i,"function":/[-a-z0-9]+(?=\()/i,punctuation:/[(){};:]/},Prism.languages.css.atrule.inside.rest=Prism.languages.css,Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/(<style[\s\S]*?>)[\s\S]*?(?=<\/style>)/i,lookbehind:!0,inside:Prism.languages.css,alias:"language-css",greedy:!0}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0,greedy:!0}],string:{pattern:/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,greedy:!0},"class-name":{pattern:/((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,lookbehind:!0,inside:{punctuation:/[.\\]/}},keyword:/\b(?:if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,"boolean":/\b(?:true|false)\b/,"function":/[a-z0-9_]+(?=\()/i,number:/\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,operator:/--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,punctuation:/[{}[\];(),.:]/};
Prism.languages.javascript=Prism.languages.extend("clike",{keyword:/\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,number:/\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|NaN|Infinity)\b|(?:\b\d+\.?\d*|\B\.\d+)(?:[Ee][+-]?\d+)?/,"function":/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/i,operator:/-[-=]?|\+[+=]?|!=?=?|<<?=?|>>?>?=?|=(?:==?|>)?|&[&=]?|\|[|=]?|\*\*?=?|\/=?|~|\^=?|%=?|\?|\.{3}/}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/((?:^|[^$\w\xA0-\uFFFF."'\])\s])\s*)\/(\[[^\]\r\n]+]|\\.|[^\/\\\[\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})\]]))/,lookbehind:!0,greedy:!0},"function-variable":{pattern:/[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*=\s*(?:function\b|(?:\([^()]*\)|[_$a-z\xA0-\uFFFF][$\w\xA0-\uFFFF]*)\s*=>))/i,alias:"function"},constant:/\b[A-Z][A-Z\d_]*\b/}),Prism.languages.insertBefore("javascript","string",{"template-string":{pattern:/`(?:\\[\s\S]|\${[^}]+}|[^\\`])*`/,greedy:!0,inside:{interpolation:{pattern:/\${[^}]+}/,inside:{"interpolation-punctuation":{pattern:/^\${|}$/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}}}),Prism.languages.javascript["template-string"].inside.interpolation.inside.rest=Prism.languages.javascript,Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/(<script[\s\S]*?>)[\s\S]*?(?=<\/script>)/i,lookbehind:!0,inside:Prism.languages.javascript,alias:"language-javascript",greedy:!0}}),Prism.languages.js=Prism.languages.javascript;
Prism.languages.sql={comment:{pattern:/(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,lookbehind:!0},string:{pattern:/(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\])*\2/,greedy:!0,lookbehind:!0},variable:/@[\w.$]+|@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,"function":/\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,keyword:/\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR(?:ACTER|SET)?|CHECK(?:POINT)?|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMNS?|COMMENT|COMMIT(?:TED)?|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS(?:TABLE)?|CONTINUE|CONVERT|CREATE|CROSS|CURRENT(?:_DATE|_TIME|_TIMESTAMP|_USER)?|CURSOR|CYCLE|DATA(?:BASES?)?|DATE(?:TIME)?|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS?|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DROP|DUMMY|DUMP(?:FILE)?|DUPLICATE|ELSE(?:IF)?|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC(?:UTE)?|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR(?: EACH ROW)?|FORCE|FOREIGN|FREETEXT(?:TABLE)?|FROM|FULL|FUNCTION|GEOMETRY(?:COLLECTION)?|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY(?:_INSERT|COL)?|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONG(?:BLOB|TEXT)|LOOP|MATCH(?:ED)?|MEDIUM(?:BLOB|INT|TEXT)|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTI(?:LINESTRING|POINT|POLYGON)|NATIONAL|NATURAL|NCHAR|NEXT|NO|NONCLUSTERED|NULLIF|NUMERIC|OFF?|OFFSETS?|ON|OPEN(?:DATASOURCE|QUERY|ROWSET)?|OPTIMIZE|OPTION(?:ALLY)?|ORDER|OUT(?:ER|FILE)?|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC(?:EDURE)?|PUBLIC|PURGE|QUICK|RAISERROR|READS?|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT(?:ABLE)?|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURNS?|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROW(?:COUNT|GUIDCOL|S)?|RTREE|RULE|SAVE(?:POINT)?|SCHEMA|SECOND|SELECT|SERIAL(?:IZABLE)?|SESSION(?:_USER)?|SET(?:USER)?|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|START(?:ING)?|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLES?|TABLESPACE|TEMP(?:ORARY|TABLE)?|TERMINATED|TEXT(?:SIZE)?|THEN|TIME(?:STAMP)?|TINY(?:BLOB|INT|TEXT)|TOP?|TRAN(?:SACTIONS?)?|TRIGGER|TRUNCATE|TSEQUAL|TYPES?|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE(?:TEXT)?|USAGE|USE|USER|USING|VALUES?|VAR(?:BINARY|CHAR|CHARACTER|YING)|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH(?: ROLLUP|IN)?|WORK|WRITE(?:TEXT)?|YEAR)\b/i,"boolean":/\b(?:TRUE|FALSE|NULL)\b/i,number:/\b0x[\da-f]+\b|\b\d+\.?\d*|\B\.\d+\b/i,operator:/[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|IN|LIKE|NOT|OR|IS|DIV|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b/i,punctuation:/[;[\]()`,.]/};
Prism.languages.plsql=Prism.languages.extend("sql",{comment:[/\/\*[\s\S]*?\*\//,/--.*/]}),"Array"!==Prism.util.type(Prism.languages.plsql.keyword)&&(Prism.languages.plsql.keyword=[Prism.languages.plsql.keyword]),Prism.languages.plsql.keyword.unshift(/\b(?:ACCESS|AGENT|AGGREGATE|ARRAY|ARROW|AT|ATTRIBUTE|AUDIT|AUTHID|BFILE_BASE|BLOB_BASE|BLOCK|BODY|BOTH|BOUND|BYTE|CALLING|CHAR_BASE|CHARSET(?:FORM|ID)|CLOB_BASE|COLAUTH|COLLECT|CLUSTERS?|COMPILED|COMPRESS|CONSTANT|CONSTRUCTOR|CONTEXT|CRASH|CUSTOMDATUM|DANGLING|DATE_BASE|DEFINE|DETERMINISTIC|DURATION|ELEMENT|EMPTY|EXCEPTIONS?|EXCLUSIVE|EXTERNAL|FINAL|FORALL|FORM|FOUND|GENERAL|HEAP|HIDDEN|IDENTIFIED|IMMEDIATE|INCLUDING|INCREMENT|INDICATOR|INDEXES|INDICES|INFINITE|INITIAL|ISOPEN|INSTANTIABLE|INTERFACE|INVALIDATE|JAVA|LARGE|LEADING|LENGTH|LIBRARY|LIKE[24C]|LIMITED|LONG|LOOP|MAP|MAXEXTENTS|MAXLEN|MEMBER|MINUS|MLSLABEL|MULTISET|NAME|NAN|NATIVE|NEW|NOAUDIT|NOCOMPRESS|NOCOPY|NOTFOUND|NOWAIT|NUMBER(?:_BASE)?|OBJECT|OCI(?:COLL|DATE|DATETIME|DURATION|INTERVAL|LOBLOCATOR|NUMBER|RAW|REF|REFCURSOR|ROWID|STRING|TYPE)|OFFLINE|ONLINE|ONLY|OPAQUE|OPERATOR|ORACLE|ORADATA|ORGANIZATION|ORL(?:ANY|VARY)|OTHERS|OVERLAPS|OVERRIDING|PACKAGE|PARALLEL_ENABLE|PARAMETERS?|PASCAL|PCTFREE|PIPE(?:LINED)?|PRAGMA|PRIOR|PRIVATE|RAISE|RANGE|RAW|RECORD|REF|REFERENCE|REM|REMAINDER|RESULT|RESOURCE|RETURNING|REVERSE|ROW(?:ID|NUM|TYPE)|SAMPLE|SB[124]|SEGMENT|SELF|SEPARATE|SEQUENCE|SHORT|SIZE(?:_T)?|SPARSE|SQL(?:CODE|DATA|NAME|STATE)|STANDARD|STATIC|STDDEV|STORED|STRING|STRUCT|STYLE|SUBMULTISET|SUBPARTITION|SUBSTITUTABLE|SUBTYPE|SUCCESSFUL|SYNONYM|SYSDATE|TABAUTH|TDO|THE|TIMEZONE_(?:ABBR|HOUR|MINUTE|REGION)|TRAILING|TRANSAC(?:TIONAL)?|TRUSTED|UB[124]|UID|UNDER|UNTRUSTED|VALIDATE|VALIST|VARCHAR2|VARIABLE|VARIANCE|VARRAY|VIEWS|VOID|WHENEVER|WRAPPED|ZONE)\b/i),"Array"!==Prism.util.type(Prism.languages.plsql.operator)&&(Prism.languages.plsql.operator=[Prism.languages.plsql.operator]),Prism.languages.plsql.operator.unshift(/:=/);


// plugin: line-number
(function () {

    if (typeof self === 'undefined' || !self.Prism || !self.document) {
        return;
    }

    /**
     * Plugin name which is used as a class name for <pre> which is activating the plugin
     * @type {String}
     */
    var PLUGIN_NAME = 'line-numbers';

    /**
     * Regular expression used for determining line breaks
     * @type {RegExp}
     */
    var NEW_LINE_EXP = /\n(?!$)/g;

    /**
     * Resizes line numbers spans according to height of line of code
     * @param {Element} element <pre> element
     */
    var _resizeElement = function (element) {
        var codeStyles = getStyles(element);
        var whiteSpace = codeStyles['white-space'];

        if (whiteSpace === 'pre-wrap' || whiteSpace === 'pre-line') {
            var codeElement = element.querySelector('code');
            var lineNumbersWrapper = element.querySelector('.line-numbers-rows');
            var lineNumberSizer = element.querySelector('.line-numbers-sizer');
            var codeLines = codeElement.textContent.split(NEW_LINE_EXP);

            if (!lineNumberSizer) {
                lineNumberSizer = document.createElement('span');
                lineNumberSizer.className = 'line-numbers-sizer';

                codeElement.appendChild(lineNumberSizer);
            }

            lineNumberSizer.style.display = 'block';

            codeLines.forEach(function (line, lineNumber) {
                lineNumberSizer.textContent = line || '\n';
                var lineSize = lineNumberSizer.getBoundingClientRect().height;
                lineNumbersWrapper.children[lineNumber].style.height = lineSize + 'px';
            });

            lineNumberSizer.textContent = '';
            lineNumberSizer.style.display = 'none';
        }
    };

    /**
     * Returns style declarations for the element
     * @param {Element} element
     */
    var getStyles = function (element) {
        if (!element) {
            return null;
        }

        return window.getComputedStyle ? getComputedStyle(element) : (element.currentStyle || null);
    };

    window.addEventListener('resize', function () {
        Array.prototype.forEach.call(document.querySelectorAll('pre.' + PLUGIN_NAME), _resizeElement);
    });

    Prism.hooks.add('complete', function (env) {
        if (!env.code) {
            return;
        }

        // works only for <code> wrapped inside <pre> (not inline)
        var pre = env.element.parentNode;
        var clsReg = /\s*\bline-numbers\b\s*/;
        if (
            !pre || !/pre/i.test(pre.nodeName) ||
            // Abort only if nor the <pre> nor the <code> have the class
            (!clsReg.test(pre.className) && !clsReg.test(env.element.className))
        ) {
            return;
        }

        if (env.element.querySelector('.line-numbers-rows')) {
            // Abort if line numbers already exists
            return;
        }

        if (clsReg.test(env.element.className)) {
            // Remove the class 'line-numbers' from the <code>
            env.element.className = env.element.className.replace(clsReg, ' ');
        }
        if (!clsReg.test(pre.className)) {
            // Add the class 'line-numbers' to the <pre>
            pre.className += ' line-numbers';
        }

        var match = env.code.match(NEW_LINE_EXP);
        var linesNum = match ? match.length + 1 : 1;
        var lineNumbersWrapper;

        var lines = new Array(linesNum + 1);
        lines = lines.join('<span></span>');

        lineNumbersWrapper = document.createElement('span');
        lineNumbersWrapper.setAttribute('aria-hidden', 'true');
        lineNumbersWrapper.className = 'line-numbers-rows';
        lineNumbersWrapper.innerHTML = lines;

        if (pre.hasAttribute('data-start')) {
            pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
        }

        env.element.appendChild(lineNumbersWrapper);

        _resizeElement(pre);

        Prism.hooks.run('line-numbers', env);
    });

    Prism.hooks.add('line-numbers', function (env) {
        env.plugins = env.plugins || {};
        env.plugins.lineNumbers = true;
    });

    /**
     * Global exports
     */
    Prism.plugins.lineNumbers = {
        /**
         * Get node for provided line number
         * @param {Element} element pre element
         * @param {Number} number line number
         * @return {Element|undefined}
         */
        getLine: function (element, number) {
            if (element.tagName !== 'PRE' || !element.classList.contains(PLUGIN_NAME)) {
                return;
            }

            var lineNumberRows = element.querySelector('.line-numbers-rows');
            var lineNumberStart = parseInt(element.getAttribute('data-start'), 10) || 1;
            var lineNumberEnd = lineNumberStart + (lineNumberRows.children.length - 1);

            if (number < lineNumberStart) {
                number = lineNumberStart;
            }
            if (number > lineNumberEnd) {
                number = lineNumberEnd;
            }

            var lineIndex = number - lineNumberStart;

            return lineNumberRows.children[lineIndex];
        }
    };

}());

// plugin：autolinker
(function(){

    if (
        typeof self !== 'undefined' && !self.Prism ||
        typeof global !== 'undefined' && !global.Prism
    ) {
        return;
    }

    var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:=&]+(?:\?[\w\-+%~/.:#=?&!$'()*,;]*)?(?:#[\w\-+%~/.:#=?&!$'()*,;]*)?/,
        email = /\b\S+@[\w.]+[a-z]{2}/,
        linkMd = /\[([^\]]+)]\(([^)]+)\)/,

        // Tokens that may contain URLs and emails
        candidates = ['comment', 'url', 'attr-value', 'string'];

    Prism.plugins.autolinker = {
        processGrammar: function (grammar) {
            // Abort if grammar has already been processed
            if (!grammar || grammar['url-link']) {
                return;
            }
            Prism.languages.DFS(grammar, function (key, def, type) {
                if (candidates.indexOf(type) > -1 && Prism.util.type(def) !== 'Array') {
                    if (!def.pattern) {
                        def = this[key] = {
                            pattern: def
                        };
                    }

                    def.inside = def.inside || {};

                    if (type == 'comment') {
                        def.inside['md-link'] = linkMd;
                    }
                    if (type == 'attr-value') {
                        Prism.languages.insertBefore('inside', 'punctuation', { 'url-link': url }, def);
                    }
                    else {
                        def.inside['url-link'] = url;
                    }

                    def.inside['email-link'] = email;
                }
            });
            grammar['url-link'] = url;
            grammar['email-link'] = email;
        }
    };

    Prism.hooks.add('before-highlight', function(env) {
        Prism.plugins.autolinker.processGrammar(env.grammar);
    });

    Prism.hooks.add('wrap', function(env) {
        if (/-link$/.test(env.type)) {
            env.tag = 'a';

            var href = env.content;

            if (env.type == 'email-link' && href.indexOf('mailto:') != 0) {
                href = 'mailto:' + href;
            }
            else if (env.type == 'md-link') {
                // Markdown
                var match = env.content.match(linkMd);

                href = match[2];
                env.content = match[1];
            }

            env.attributes.href = href;
        }

        // Silently catch any error thrown by decodeURIComponent (#1186)
        try {
            env.content = decodeURIComponent(env.content);
        } catch(e) {}
    });

})();

// plugin：keywords
(function(){

    if (
        typeof self !== 'undefined' && !self.Prism ||
        typeof global !== 'undefined' && !global.Prism
    ) {
        return;
    }

    Prism.hooks.add('wrap', function(env) {
        if (env.type !== "keyword") {
            return;
        }
        env.classes.push('keyword-' + env.content);
    });

})();