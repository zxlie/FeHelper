/**
 * combocodegen.js ( based on escodegen )
 * @author dron
 * @create 2013-03-09
 */
void function( factory, global ) {
    var parseConf, generateConf, host, escodegen;

    host = global.document;

    if( host.combocodegen )
        return ;

    parseConf = { raw: true, loc: true  };
    generateConf = {
        format: { indent: { style: "    " }, quotes: "double" }
    };
    factory( escodegen = {}, global );

    var trialHtmlCommentError = function( content ){
        var errorRegx, cutFlag1, cutFlag2, lineSpliter;

        errorRegx = /^Line (\d+): Unexpected token (<|>)$/;
        cutFlag1 = "<!--";
        cutFlag2 = "-->";
        lineSpliter = /\r\n|[\r\n]/;

        var test = function( content ){
            var ast;

            try{
                ast = host.esprima.parse( content, parseConf );
                return { status: "OK", ast: ast };
            }catch( e ){
                // console.log( "【Tracker】 " + e.message );
                if( errorRegx.test( e.message ) ){

                    return {
                        status: "MaybeHtmlCommentError",
                        errorMode: RegExp.$2,
                        line: RegExp.$1 - 0,
                        error: e
                    }
                }

                return {
                    status: "OtherError",
                    error: e
                };
            }
        };

        return function( content ){
            var ret, status, c, b, l;

            c = content;

            while( true ){
                ret = test( c );
                status = ret.status;

                if( status == "OK" ){
                    return ret.ast;
                }else if( status == "OtherError" ){
                    throw ret.error;
                }else if( status == "MaybeHtmlCommentError" ){
                    c = c.split( lineSpliter );
                    l = ret.line - 1;
                    b = c[ l ];
                    if( ret.errorMode == "<" && b.indexOf( cutFlag1 ) > -1 ){
                        c[ l ] = b.slice( 0, b.lastIndexOf( cutFlag1 ) );
                    }else if( ret.errorMode == ">" && b.indexOf( cutFlag2 ) > -1 ){
                        c[ l ] = b.slice( 0, b.lastIndexOf( cutFlag2 ) );
                    }else{
                        throw ret.error;
                    }
                    c = c.join( "\n" );
                }
            }
        };
    }();

    host.combocodegen = function( code ){
        var ast;

        ast = trialHtmlCommentError( code.origContent );

        return escodegen.generate( ast, generateConf, code );
    };
}(function ( exports, global ) {
    'use strict';

    var Syntax,
        Precedence,
        BinaryPrecedence,
        Regex,
        VisitorKeys,
        VisitorOption,
        SourceNode,
        isArray,
        base,
        indent,
        json,
        renumber,
        hexadecimal,
        quotes,
        escapeless,
        newline,
        space,
        parentheses,
        semicolons,
        safeConcatenation,
        extra,
        parse,
        sourceMap;

    var _slice = [].slice, _push = [].push, _join = [].join, guid, currentCode,
        trackerDelimiterRegx;

    // NOTE: 以下的代码新增了 idBuffer 和 entrustedTraceId 的设计
    // idBuffer: 上一个语法环境里预置的 id 数组，在本语法环增中会追加新的代码片断 id 到其后，一般统一在外层语法环境里去做 trace 跟踪
    // entrustedTraceId: 上一个语法环境里预置的 id 数组，用于委托到本语法环境里做 trace 跟踪（正好与上面相反）

    trackerDelimiterRegx = /\{<\}.*?\{>\}/g;

    // NOTE: 用于生成代码关键 token 的唯一标识数字
    guid = function(){
        var index = 0;
        return function( length, joinWith ){
            if( !length )
                return index ++;

            for(var i = 0, result = []; i < length; i ++)
                result.push( index ++ );

            if( joinWith )
                _push.apply( result, joinWith );

            return result;
        }
    }();

    Syntax = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    };

    Precedence = {
        Sequence: 0,
        Assignment: 1,
        Conditional: 2,
        LogicalOR: 3,
        LogicalAND: 4,
        BitwiseOR: 5,
        BitwiseXOR: 6,
        BitwiseAND: 7,
        Equality: 8,
        Relational: 9,
        BitwiseSHIFT: 10,
        Additive: 11,
        Multiplicative: 12,
        Unary: 13,
        Postfix: 14,
        Call: 15,
        New: 16,
        Member: 17,
        Primary: 18
    };

    BinaryPrecedence = {
        '||': Precedence.LogicalOR,
        '&&': Precedence.LogicalAND,
        '|': Precedence.BitwiseOR,
        '^': Precedence.BitwiseXOR,
        '&': Precedence.BitwiseAND,
        '==': Precedence.Equality,
        '!=': Precedence.Equality,
        '===': Precedence.Equality,
        '!==': Precedence.Equality,
        '<': Precedence.Relational,
        '>': Precedence.Relational,
        '<=': Precedence.Relational,
        '>=': Precedence.Relational,
        'in': Precedence.Relational,
        'instanceof': Precedence.Relational,
        '<<': Precedence.BitwiseSHIFT,
        '>>': Precedence.BitwiseSHIFT,
        '>>>': Precedence.BitwiseSHIFT,
        '+': Precedence.Additive,
        '-': Precedence.Additive,
        '*': Precedence.Multiplicative,
        '%': Precedence.Multiplicative,
        '/': Precedence.Multiplicative
    };

    Regex = {
        NonAsciiIdentifierPart: new RegExp('[\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u05d0-\u05ea\u05f0-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u0800-\u082d\u0840-\u085b\u08a0\u08a2-\u08ac\u08e4-\u08fe\u0900-\u0963\u0966-\u096f\u0971-\u0977\u0979-\u097f\u0981-\u0983\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7\u09c8\u09cb-\u09ce\u09d7\u09dc\u09dd\u09df-\u09e3\u09e6-\u09f1\u0a01-\u0a03\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5c\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c58\u0c59\u0c60-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1\u0cf2\u0d02\u0d03\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d57\u0d60-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d82\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb9\u0ebb-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772\u1773\u1780-\u17d3\u17d7\u17dc\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1820-\u1877\u1880-\u18aa\u18b0-\u18f5\u1900-\u191c\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19d9\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1b00-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1cd0-\u1cd2\u1cd4-\u1cf6\u1d00-\u1de6\u1dfc-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c\u200d\u203f\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u2e2f\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099\u309a\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua697\ua69f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua827\ua840-\ua873\ua880-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua900-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a\uaa7b\uaa80-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabea\uabec\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]')
    };

    function returnSelf( string ){
        return string;
    }

    function getDefaultOptions() {
        // default options
        return {
            indent: null,
            base: null,
            parse: null,
            comment: false,
            format: {
                indent: {
                    style: '    ',
                    base: 0,
                    adjustMultilineComment: false
                },
                json: false,
                renumber: false,
                hexadecimal: false,
                quotes: 'single',
                escapeless: false,
                compact: false,
                parentheses: true,
                semicolons: true,
                safeConcatenation: false
            },
            sourceMap: null,
            sourceMapWithCode: false
        };
    }

    function stringToArray(str) {
        var length = str.length,
            result = [],
            i;
        for (i = 0; i < length; i += 1) {
            result[i] = str.charAt(i);
        }
        return result;
    }

    function stringRepeat(str, num) {
        var result = '';

        for (num |= 0; num > 0; num >>>= 1, str += str) {
            if (num & 1) {
                result += str;
            }
        }

        return result;
    }

    // NOTE: 新增各种包装函数，用于辅助实现代码入侵和代码跟踪展示
    function wrapTrackerDelimiter( string ){
        return "{<}" + string + "{>}";
    }

    function injectAssistedCode( content ){
        return wrapTrackerDelimiter( "/* TRACKERINJECTJS */" + content );
    }

    function injectCodeFragmentTrace( idArray ){
        var groupId = Tracker.StatusPool.snippetGroupCreate.call( Tracker.StatusPool, currentCode, idArray );
        return injectAssistedCode( "__tracker__(" + groupId + ");" );
    }

    function injectCodeFragmentTraceWithReturn( idArray ){
        var groupId = Tracker.StatusPool.snippetGroupCreate.call( Tracker.StatusPool, currentCode, idArray );
        return injectAssistedCode( "__tracker__(" + groupId + ")" );
    }

    function wrapCodeFragmentHtml( fragment, id ){
        // if( !snippetsIdSet[ id ] )
        //     snippetsIdSet[ id ] = 1;

        // Tracker.StatusPool.snippetToCodePut( id, currentCode );

        return wrapTrackerDelimiter( "<!-- TRACKERINJECTHTML --><span id=ckey-" + id + ">" ) + fragment +
        wrapTrackerDelimiter( "<!-- TRACKERINJECTHTML --></span>" );
    }

    isArray = Array.isArray;

    if (!isArray)
        isArray = function isArray(array) {
            return Object.prototype.toString.call(array) === '[object Array]';
        };

    // Fallback for the non SourceMap environment
    function SourceNodeMock(line, column, filename, chunk) {
        var result = [];

        function flatten(input) {
            var i, iz;
            if (isArray(input)) {
                for (i = 0, iz = input.length; i < iz; ++i) {
                    flatten(input[i]);
                }
            } else if (input instanceof SourceNodeMock) {
                result.push(input);
            } else if (typeof input === 'string' && input) {
                result.push(input);
            }
        }

        flatten(chunk);
        this.children = result;
    }

    SourceNodeMock.prototype.toString = function toString() {
        var res = '', i, iz, node;
        for (i = 0, iz = this.children.length; i < iz; ++i) {
            node = this.children[i];
            if (node instanceof SourceNodeMock) {
                res += node.toString();
            } else {
                res += node;
            }
        }
        return res;
    };

    SourceNodeMock.prototype.replaceRight = function replaceRight(pattern, replacement) {
        var last = this.children[this.children.length - 1];
        if (last instanceof SourceNodeMock) {
            last.replaceRight(pattern, replacement);
        } else if (typeof last === 'string') {
            this.children[this.children.length - 1] = last.replace(pattern, replacement);
        } else {
            this.children.push(''.replace(pattern, replacement));
        }
        return this;
    };

    SourceNodeMock.prototype.join = function join(sep) {
        var i, iz, result;
        result = [];
        iz = this.children.length;
        if (iz > 0) {
            for (i = 0, iz -= 1; i < iz; ++i) {
                result.push(this.children[i], sep);
            }
            result.push(this.children[iz]);
            this.children = result;
        }
        return this;
    };

    function endsWithLineTerminator(str) {
        var ch = str.charAt(str.length - 1);
        return ch === '\r' || ch === '\n';
    }

    function shallowCopy(obj) {
        var ret = {}, key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                ret[key] = obj[key];
            }
        }
        return ret;
    }

    function deepCopy(obj) {
        var ret = {}, key, val;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                val = obj[key];
                if (typeof val === 'object' && val !== null) {
                    ret[key] = deepCopy(val);
                } else {
                    ret[key] = val;
                }
            }
        }
        return ret;
    }

    function updateDeeply(target, override) {
        var key, val;

        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }

        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    } else {
                        target[key] = updateDeeply({}, val);
                    }
                } else {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    function generateNumber(value) {
        var result, point, temp, exponent, pos;

        if (value !== value) {
            throw new Error('Numeric literal whose value is NaN');
        }
        if (value < 0 || (value === 0 && 1 / value < 0)) {
            throw new Error('Numeric literal whose value is negative');
        }

        if (value === 1 / 0) {
            return json ? 'null' : renumber ? '1e400' : '1e+400';
        }

        result = '' + value;
        if (!renumber || result.length < 3) {
            return result;
        }

        point = result.indexOf('.');
        if (!json && result.charAt(0) === '0' && point === 1) {
            point = 0;
            result = result.slice(1);
        }
        temp = result;
        result = result.replace('e+', 'e');
        exponent = 0;
        if ((pos = temp.indexOf('e')) > 0) {
            exponent = +temp.slice(pos + 1);
            temp = temp.slice(0, pos);
        }
        if (point >= 0) {
            exponent -= temp.length - point - 1;
            temp = +(temp.slice(0, point) + temp.slice(point + 1)) + '';
        }
        pos = 0;
        while (temp.charAt(temp.length + pos - 1) === '0') {
            pos -= 1;
        }
        if (pos !== 0) {
            exponent -= pos;
            temp = temp.slice(0, pos);
        }
        if (exponent !== 0) {
            temp += 'e' + exponent;
        }
        if ((temp.length < result.length ||
            (hexadecimal && value > 1e12 && Math.floor(value) === value && (temp = '0x' + value.toString(16)).length < result.length)) &&
            +temp === value) {
            result = temp;
        }

        return result;
    }

    function escapeAllowedCharacter(ch, next) {
        var code = ch.charCodeAt(0), hex = code.toString(16), result = '\\';

        switch (ch) {
            case '\b':
                result += 'b';
                break;
            case '\f':
                result += 'f';
                break;
            case '\t':
                result += 't';
                break;
            default:
                if (json || code > 0xff) {
                    result += 'u' + '0000'.slice(hex.length) + hex;
                } else if (ch === '\u0000' && '0123456789'.indexOf(next) < 0) {
                    result += '0';
                } else if (ch === '\v') {
                    result += 'v';
                } else {
                    result += 'x' + '00'.slice(hex.length) + hex;
                }
                break;
        }

        return result;
    }

    function escapeDisallowedCharacter(ch) {
        var result = '\\';
        switch (ch) {
            case '\\':
                result += '\\';
                break;
            case '\n':
                result += 'n';
                break;
            case '\r':
                result += 'r';
                break;
            case '\u2028':
                result += 'u2028';
                break;
            case '\u2029':
                result += 'u2029';
                break;
            default:
                throw new Error('Incorrectly classified character');
        }

        return result;
    }

    function escapeString(str) {
        var result = '', i, len, ch, next, singleQuotes = 0, doubleQuotes = 0, single;

        if (typeof str[0] === 'undefined') {
            str = stringToArray(str);
        }

        for (i = 0, len = str.length; i < len; i += 1) {
            ch = str[i];
            if (ch === '\'') {
                singleQuotes += 1;
            } else if (ch === '"') {
                doubleQuotes += 1;
            } else if (ch === '/' && json) {
                result += '\\';
            } else if ('\\\n\r\u2028\u2029'.indexOf(ch) >= 0) {
                result += escapeDisallowedCharacter(ch);
                continue;
            } else if ((json && ch < ' ') || !(json || escapeless || (ch >= ' ' && ch <= '~'))) {
                result += escapeAllowedCharacter(ch, str[i + 1]);
                continue;
            }
            result += ch;
        }

        single = !(quotes === 'double' || (quotes === 'auto' && doubleQuotes < singleQuotes));
        str = result;
        result = single ? '\'' : '"';

        if (typeof str[0] === 'undefined') {
            str = stringToArray(str);
        }

        for (i = 0, len = str.length; i < len; i += 1) {
            ch = str[i];
            if ((ch === '\'' && single) || (ch === '"' && !single)) {
                result += '\\';
            }
            result += ch;
        }

        return result + (single ? '\'' : '"');
    }

    function isWhiteSpace(ch) {
        return '\t\v\f \xa0'.indexOf(ch) >= 0 || (ch.charCodeAt(0) >= 0x1680 && '\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff'.indexOf(ch) >= 0);
    }

    function isLineTerminator(ch) {
        return '\n\r\u2028\u2029'.indexOf(ch) >= 0;
    }

    function isIdentifierPart(ch) {
        return (ch === '$') || (ch === '_') || (ch === '\\') ||
        (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
        ((ch >= '0') && (ch <= '9')) ||
        ((ch.charCodeAt(0) >= 0x80) && Regex.NonAsciiIdentifierPart.test(ch));
    }

    function join(left, right) {
        var leftSource = toSourceNode(left).toString(),
            rightSource = toSourceNode(right).toString(),
            leftChar = leftSource.charAt(leftSource.length - 1),
            rightChar = rightSource.charAt(0);

        if (((leftChar === '+' || leftChar === '-') && leftChar === rightChar) || (isIdentifierPart(leftChar) && isIdentifierPart(rightChar))) {
            return [left, ' ', right];
        } else if (isWhiteSpace(leftChar) || isLineTerminator(leftChar) || isWhiteSpace(rightChar) || isLineTerminator(rightChar)) {
            return [left, right];
        }
        return [left, space, right];
    }

    function addIndent(stmt) {
        return [base, stmt];
    }

    function withIndent(fn) {
        var previousBase;
        previousBase = base;
        base += indent;
        var result = fn.call(this, base);
        base = previousBase;
        return result;
    }

    function calculateSpaces(str) {
        var i;
        for (i = str.length - 1; i >= 0; i -= 1) {
            if (isLineTerminator(str.charAt(i))) {
                break;
            }
        }
        return (str.length - 1) - i;
    }

    function toSourceNode(generated, node) {
        if (node == null) {
            if (generated instanceof SourceNode) {
                return generated;
            } else {
                node = {};
            }
        }
        if (node.loc == null) {
            return new SourceNode(null, null, sourceMap, generated);
        }
        return new SourceNode(node.loc.start.line, node.loc.start.column, sourceMap, generated);
    }

    function adjustMultilineComment(value, specialBase) {
        var array, i, len, line, j, ch, spaces, previousBase;

        array = value.split(/\r\n|[\r\n]/);
        spaces = Number.MAX_VALUE;

        // first line doesn't have indentation
        for (i = 1, len = array.length; i < len; i += 1) {
            line = array[i];
            j = 0;
            while (j < line.length && isWhiteSpace(line[j])) {
                j += 1;
            }
            if (spaces > j) {
                spaces = j;
            }
        }

        if (typeof specialBase !== 'undefined') {
            // pattern like
            // {
            //   var t = 20;  /*
            //                 * this is comment
            //                 */
            // }
            previousBase = base;
            if (array[1][spaces] === '*') {
                specialBase += ' ';
            }
            base = specialBase;
        } else {
            if (spaces & 1) {
                // /*
                //  *
                //  */
                // If spaces are odd number, above pattern is considered.
                // We waste 1 space.
                spaces -= 1;
            }
            previousBase = base;
        }

        for (i = 1, len = array.length; i < len; i += 1) {
            array[i] = toSourceNode(addIndent(array[i].slice(spaces))).join('');
        }

        base = previousBase;

        return array.join('\n');
    }

    function generateComment(comment, specialBase) {
        if (comment.type === 'Line') {
            if (endsWithLineTerminator(comment.value)) {
                return '//' + comment.value;
            } else {
                // Always use LineTerminator
                return '//' + comment.value + '\n';
            }
        }
        if (extra.format.indent.adjustMultilineComment && /[\n\r]/.test(comment.value)) {
            return adjustMultilineComment('/*' + comment.value + '*/', specialBase);
        }
        return '/*' + comment.value + '*/';
    }

    function addCommentsToStatement(stmt, result) {
        var i, len, comment, save, node, tailingToStatement, specialBase, fragment;

        if (stmt.leadingComments && stmt.leadingComments.length > 0) {
            save = result;

            comment = stmt.leadingComments[0];
            result = [];
            if (safeConcatenation && stmt.type === Syntax.Program && stmt.body.length === 0) {
                result.push('\n');
            }
            result.push(generateComment(comment));
            if (!endsWithLineTerminator(toSourceNode(result).toString())) {
                result.push('\n');
            }

            for (i = 1, len = stmt.leadingComments.length; i < len; i += 1) {
                comment = stmt.leadingComments[i];
                fragment = [generateComment(comment)];
                if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                    fragment.push('\n');
                }
                result.push(addIndent(fragment));
            }

            result.push(addIndent(save));
        }

        if (stmt.trailingComments) {
            tailingToStatement = !endsWithLineTerminator(toSourceNode(result).toString());
            specialBase = stringRepeat(' ', calculateSpaces(toSourceNode([base, result, indent]).toString()));
            for (i = 0, len = stmt.trailingComments.length; i < len; i += 1) {
                comment = stmt.trailingComments[i];
                if (tailingToStatement) {
                    // We assume target like following script
                    //
                    // var t = 20;  /**
                    //               * This is comment of t
                    //               */
                    if (i === 0) {
                        // first case
                        result.push(indent);
                    } else {
                        result.push(specialBase);
                    }
                    result.push(generateComment(comment, specialBase));
                } else {
                    result.push(addIndent(generateComment(comment)));
                }
                if (i !== len - 1 && !endsWithLineTerminator(toSourceNode(result).toString())) {
                    result.push('\n');
                }
            }
        }

        return result;
    }

    function parenthesize( text, current, should, wrapHtml ) {
        wrapHtml = wrapHtml || returnSelf;

        if ( current < should ) {
            return [ wrapHtml( '(' ), ' ', text, ' ', wrapHtml( ')' ) ];
        }
        return text;
    }

    function maybeBlock( stmt, semicolonOptional, entrustedTraceId, idBuffer, dontBlock ) {
        var result, noLeadingComment;

        // NOTE: entrustedTraceId 用于接受外部语法的委托 traceId

        noLeadingComment = !extra.comment || !stmt.leadingComments;

        if (stmt.type === Syntax.BlockStatement && noLeadingComment) {
            return [ space, generateStatement( stmt, {
                entrustedTraceId: entrustedTraceId,
                idBuffer: idBuffer
            } ) ];
        }

        if (stmt.type === Syntax.EmptyStatement && noLeadingComment) {
            return ';';
        }

        // dontBlock = false;
        if( !dontBlock )
            withIndent(function (indent) {
                var id = guid( 2, entrustedTraceId );

                result = [
                    " ",
                    wrapCodeFragmentHtml( "{", id[ 0 ] ),
                    injectCodeFragmentTrace( id ),
                    newline,
                    addIndent(
                        generateStatement( stmt, { semicolonOptional: semicolonOptional } ) ),
                    newline,
                    base.slice( 4 ),
                    wrapCodeFragmentHtml( "}", id[ 1 ] )
                ];

                if( idBuffer )
                    idBuffer.push( id[0], id[1] );
            });
        else
            withIndent(function (indent) {
                // var id = guid( 2, entrustedTraceId );

                result = [
                    " ",
                    // wrapCodeFragmentHtml( "{", id[ 0 ] ),
                    // injectCodeFragmentTrace( id ),
                    newline,
                    addIndent(
                        generateStatement( stmt, { semicolonOptional: semicolonOptional } ) ),
                    // newline,
                    // base.slice( 4 ),
                    // wrapCodeFragmentHtml( "}", id[ 1 ] )
                ];

                // if( idBuffer )
                //     idBuffer.push( id[0], id[1] );
            });

        return result;
    }

    function maybeBlockSuffix( stmt, result ) {
        var ends = endsWithLineTerminator(toSourceNode(result).toString());
        if (stmt.type === Syntax.BlockStatement && (!extra.comment || !stmt.leadingComments) && !ends) {
            return [result, space];
        }
        if (ends) {
            return [result, base];
        }
        return [result, newline, base];
    }

    function generateFunctionBody( node, idBuffer ) {
        var result, i, len, wrapHtml;

        wrapHtml = idBuffer ? function( string ){
            var id;
            idBuffer.push( id = guid() );
            return wrapCodeFragmentHtml( string, id );
        } : returnSelf;

        len = node.params.length;
        result = [ wrapHtml( '(' ), len ? space : '' ];

        for (i = 0; i < len; i += 1) {
            result.push( wrapHtml( node.params[i].name ) );
            if (i + 1 < len) {
                result.push( ',' + space );
            }
        }

        result.push(
            len ? space : '',
            wrapHtml( ')' ),
            maybeBlock( node.body, null, null, idBuffer )
        );
        return result;
    }

    function generateExpression( expr, option ) {
        var result, precedence, currentPrecedence, i, len, raw, fragment, multiline, leftChar, leftSource, rightChar, rightSource, allowIn, allowCall, idBuffer, wrapHtml, allowUnparenthesizedNew;

        precedence = option.precedence;
        allowIn = option.allowIn;
        allowCall = option.allowCall;
        idBuffer = option.idBuffer;

        wrapHtml = idBuffer ? function( string ){
            var id;
            idBuffer.push( id = guid() );
            return wrapCodeFragmentHtml( string, id );
        } : returnSelf;

        switch (expr.type) {

            case Syntax.SequenceExpression:
                result = [];
                allowIn |= ( Precedence.Sequence < precedence );

                for (i = 0, len = expr.expressions.length; i < len; i += 1) {
                    result.push( generateExpression( expr.expressions[i], {
                        precedence: Precedence.Assignment,
                        allowIn: allowIn,
                        allowCall: true,
                        idBuffer: idBuffer
                    }) );
                    if (i + 1 < len) {
                        result.push( ',' + space );
                    }
                }
                result = parenthesize( result, Precedence.Sequence, precedence, wrapHtml );
                break;

            case Syntax.AssignmentExpression:
                allowIn |= (Precedence.Assignment < precedence);
                result = parenthesize(
                    [
                        generateExpression( expr.left, {
                            precedence: Precedence.Call,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        }),
                        space + wrapHtml( expr.operator ) + space,
                        generateExpression( expr.right, {
                            precedence: Precedence.Assignment,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        })
                    ],
                    Precedence.Assignment,
                    precedence,
                    wrapHtml
                );
                break;

            case Syntax.ConditionalExpression:
                allowIn |= (Precedence.Conditional < precedence);
                result = parenthesize(
                    [
                        generateExpression(expr.test, {
                            precedence: Precedence.LogicalOR,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        }),
                        space + wrapHtml( '?' ) + space,
                        generateExpression(expr.consequent, {
                            precedence: Precedence.Assignment,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        }),
                        space + wrapHtml( ':' ) + space,
                        generateExpression(expr.alternate, {
                            precedence: Precedence.Assignment,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        })
                    ],
                    Precedence.Conditional,
                    precedence,
                    wrapHtml
                );
                break;

            case Syntax.LogicalExpression:
            case Syntax.BinaryExpression:
                currentPrecedence = BinaryPrecedence[expr.operator];

                allowIn |= (currentPrecedence < precedence);

                result = join(
                    generateExpression(expr.left, {
                        precedence: currentPrecedence,
                        allowIn: allowIn,
                        allowCall: true,
                        idBuffer: idBuffer
                    }),
                    wrapHtml( expr.operator )
                );

                fragment = generateExpression(expr.right, {
                    precedence: currentPrecedence + 1,
                    allowIn: allowIn,
                    allowCall: true,
                    idBuffer: idBuffer
                });

                if (expr.operator === '/' && fragment.toString().charAt(0) === '/') {
                    // If '/' concats with '/', it is interpreted as comment start
                    result.push(' ', wrapHtml( fragment ));
                } else {
                    result = join(result, wrapHtml( fragment ));
                }

                if (expr.operator === 'in' && !allowIn) {
                    result = [ wrapHtml('('), result, wrapHtml( ')' ) ];
                } else {
                    result = parenthesize( result, currentPrecedence, precedence, wrapHtml );
                }

                break;

            case Syntax.CallExpression:
                result = [ generateExpression( expr.callee, {
                    precedence: Precedence.Call,
                    allowIn: true,
                    allowCall: true,
                    allowUnparenthesizedNew: false,
                    idBuffer: idBuffer
                }) ];

                result.push( wrapHtml( '(' ) );

                for (i = 0, len = expr['arguments'].length; i < len; i += 1) {
                    result.push(
                        space,
                        generateExpression( expr['arguments'][i], {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer
                        })
                    );
                    result.push( i + 1 < len ? ',' : space );
                }

                result.push( wrapHtml( ')' ) );

                if ( !allowCall ) {
                    result = [ wrapHtml( '(' ), result, wrapHtml( ')' ) ];
                } else {
                    result = parenthesize( result, Precedence.Call, precedence, wrapHtml );
                }
                break;

            case Syntax.NewExpression:
                len = expr['arguments'].length;
                allowUnparenthesizedNew = option.allowUnparenthesizedNew === undefined || option.allowUnparenthesizedNew;

                result = join(
                    wrapHtml( 'new' ),
                    generateExpression(expr.callee, {
                        precedence: Precedence.New,
                        allowIn: true,
                        allowCall: false,
                        allowUnparenthesizedNew: allowUnparenthesizedNew && !parentheses && len === 0,
                        idBuffer: idBuffer
                    })
                );

                if (!allowUnparenthesizedNew || parentheses || len > 0) {
                    result.push( wrapHtml( '(' ) );
                    for (i = 0; i < len; i += 1) {
                        result.push( space, generateExpression(expr['arguments'][i], {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer
                        } ));
                        result.push( i + 1 < len ? ',' : space );
                    }
                    result.push( wrapHtml( ')' ) );
                }

                result = parenthesize( result, Precedence.New, precedence, wrapHtml );
                break;

            case Syntax.MemberExpression:
                result = [ generateExpression( expr.object, {
                    precedence: Precedence.Call,
                    allowIn: true,
                    allowCall: allowCall,
                    allowUnparenthesizedNew: false,
                    idBuffer: idBuffer
                } ) ];

                if (expr.computed) {
                    result.push( wrapHtml( '[' ), generateExpression(expr.property, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: allowCall,
                        idBuffer: idBuffer
                    }), wrapHtml( ']' ) );
                } else {
                    if (expr.object.type === Syntax.Literal && typeof expr.object.value === 'number') {
                        if (result.indexOf('.') < 0) {
                            if (!/[eExX]/.test(result) && !(result.length >= 2 && result[0] === '0')) {
                                result.push( wrapHtml( '.' ) );
                            }
                        }
                    }
                    result.push( '.' + wrapHtml( expr.property.name ) );
                }

                result = parenthesize( result, Precedence.Member, precedence, wrapHtml );
                break;

            case Syntax.UnaryExpression:
                fragment = generateExpression(expr.argument, {
                    precedence: Precedence.Unary,
                    allowIn: true,
                    allowCall: true,
                    idBuffer: idBuffer
                });

                if (space === '') {
                    result = join( wrapHtml( expr.operator ), fragment );
                } else {
                    result = [ wrapHtml( expr.operator ) ];
                    if (expr.operator.length > 2) {
                        // delete, void, typeof
                        // get `typeof []`, not `typeof[]`
                        result = join(result, fragment);
                    } else {
                        // Prevent inserting spaces between operator and argument if it is unnecessary
                        // like, `!cond`
                        leftSource = toSourceNode(result).toString();
                        leftChar = leftSource.charAt(leftSource.length - 1);
                        rightChar = fragment.toString().charAt(0);

                        if (((leftChar === '+' || leftChar === '-') && leftChar === rightChar) || (isIdentifierPart(leftChar) && isIdentifierPart(rightChar))) {
                            result.push( ' ', fragment );
                        } else {
                            result.push( fragment );
                        }
                    }
                }
                result = parenthesize( result, Precedence.Unary, precedence, wrapHtml );
                break;

            case Syntax.UpdateExpression:
                if (expr.prefix) {
                    result = parenthesize(
                        [
                            wrapHtml( expr.operator ),
                            generateExpression(expr.argument, {
                                precedence: Precedence.Unary,
                                allowIn: true,
                                allowCall: true,
                                idBuffer: idBuffer
                            })
                        ],
                        Precedence.Unary,
                        precedence,
                        wrapHtml
                    );
                } else {
                    result = parenthesize(
                        [
                            generateExpression(expr.argument, {
                                precedence: Precedence.Postfix,
                                allowIn: true,
                                allowCall: true,
                                idBuffer: idBuffer
                            }),
                            wrapHtml( expr.operator )
                        ],
                        Precedence.Postfix,
                        precedence,
                        wrapHtml
                    );
                }
                break;

            case Syntax.FunctionExpression:
                result = wrapHtml( 'function' );

                if ( expr.id ) {
                    result += ' ' + wrapHtml( expr.id.name );
                } else {
                    result += space;
                }

                result = [ result, generateFunctionBody( expr, idBuffer ) ];
                break;

            case Syntax.ArrayExpression:
                if ( !expr.elements.length ) {
                    result = wrapHtml( '[]' );
                    break;
                }
                multiline = expr.elements.length > 1;
                result = [
                    wrapHtml( '[' ), multiline ? newline : ''
                ];
                withIndent(function (indent) {
                    for (i = 0, len = expr.elements.length; i < len; i += 1) {
                        if (!expr.elements[i]) {
                            if(multiline) result.push(base);
                            if (i + 1 === len) {
                                result.push( ',' );
                            }
                        } else {
                            result.push( multiline ? base : '', generateExpression( expr.elements[i], {
                                precedence: Precedence.Assignment,
                                allowIn: true,
                                allowCall: true,
                                idBuffer: idBuffer,
                                addLine: true
                            } ) );
                        }
                        if (i + 1 < len) {
                            result.push( ',' + ( multiline ? newline : space ) );
                        }
                    }
                });
                if (multiline && !endsWithLineTerminator(toSourceNode(result).toString())) {
                    result.push(newline);
                }
                result.push( multiline ? base : '', wrapHtml( ']' ) );
                break;

            case Syntax.Property:
                // NOTE: get 和 set 在初版的时候暂不考虑
                if (expr.kind === 'get' || expr.kind === 'set') {
                    result = [
                        expr.kind + ' ',
                        generateExpression(expr.key, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer
                        }),
                        generateFunctionBody( expr.value )
                    ];
                } else {
                    result = [
                        generateExpression( expr.key, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer,
                            addLine: true
                        } ),
                        ':' + space,
                        generateExpression( expr.value, {
                            precedence: Precedence.Assignment,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer
                        } )
                    ];
                }
                break;

            case Syntax.ObjectExpression:
                if ( !expr.properties.length ) {
                    result = wrapHtml( '{}' );
                    break;
                }

                multiline = expr.properties.length > 1;
                result = [ wrapHtml( '{' ), multiline ? newline : ''];

                withIndent(function (indent) {
                    for (i = 0, len = expr.properties.length; i < len; i += 1) {
                        result.push( multiline ? base : '', generateExpression(expr.properties[i], {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: idBuffer
                        }));
                        if (i + 1 < len) {
                            result.push( ',' + (multiline ? newline : space));
                        }
                    }
                });

                if (multiline && !endsWithLineTerminator(toSourceNode(result).toString())) {
                    result.push(newline);
                }

                result.push( multiline ? base : '', wrapHtml( '}' ) );
                break;

            case Syntax.ThisExpression:
                result = wrapHtml( 'this' );
                break;

            case Syntax.Identifier:
                result = wrapHtml( expr.name );
                break;

            case Syntax.Literal:
                if (expr.hasOwnProperty('raw') && parse) {
                    try {
                        raw = parse(expr.raw).body[0].expression;
                        if (raw.type === Syntax.Literal) {
                            if (raw.value === expr.value) {
                                result = wrapHtml( expr.raw );
                                break;
                            }
                        }
                    } catch (e) {
                        // not use raw property
                    }
                }

                if (expr.value === null) {
                    result = wrapHtml( 'null' );
                    break;
                }

                if (typeof expr.value === 'string') {
                    result = wrapHtml( escapeString( expr.value ) );
                    break;
                }

                if (typeof expr.value === 'number') {
                    result = wrapHtml( generateNumber( expr.value ) );
                    break;
                }

                result = wrapHtml( expr.value.toString() );
                break;

            default:
                throw new Error('Unknown expression type: ' + expr.type);
        }

        return toSourceNode(result, expr);
    }

    function generateStatement( stmt, option ) {
        var i, len, result, node, allowIn, fragment, semicolon, idBuffer, entrustedTraceId, id,
            tid, resultString;

        allowIn = true;
        semicolon = ';';

        if (option) {
            allowIn = option.allowIn === undefined || option.allowIn;
            idBuffer = option.idBuffer;
            entrustedTraceId = option.entrustedTraceId; // NOTE: 上一个语法委托 trace 的 id 数组
            if (!semicolons && option.semicolonOptional === true) {
                semicolon = '';
            }
        }

        switch (stmt.type) {
            case Syntax.BlockStatement:
                id = guid( 2, entrustedTraceId );

                result = [
                    wrapCodeFragmentHtml( '{', id[ 0 ] ),
                    injectCodeFragmentTrace( id ),
                    newline,
                ];

                withIndent(function (indent) {
                    for (i = 0, len = stmt.body.length; i < len; i += 1) {
                        fragment = addIndent(generateStatement(stmt.body[i], {semicolonOptional: i === len - 1}));
                        result.push(fragment);
                        if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                            result.push(newline);
                        }
                    }
                });

                result.push(addIndent(
                    wrapCodeFragmentHtml( '}', id[ 1 ] )
                ));

                if( idBuffer )
                    idBuffer.push( id[0], id[1] );

                break;

            case Syntax.BreakStatement:
                if (stmt.label) {
                    // NOTE: 居然可以跟 label，这种情况暂时不考虑了
                    result = 'break ' + stmt.label.name + semicolon;
                } else {
                    id = guid( 1 );
                    result = [
                        injectCodeFragmentTrace( id ),
                        wrapCodeFragmentHtml( 'break', id[ 0 ] ),
                        semicolon
                    ];
                }
                break;

            case Syntax.ContinueStatement:
                if ( stmt.label ) {
                    // TODO: break/continue label 需要处理，否则无法高亮
                    result = 'continue ' + stmt.label.name + semicolon;
                } else {
                    id = guid( 1 );
                    result = [
                        injectCodeFragmentTrace( id ),
                        wrapCodeFragmentHtml( 'continue', id[ 0 ] ),
                        semicolon
                    ];
                }
                break;

            case Syntax.DoWhileStatement:
                // Because `do 42 while (cond)` is Syntax Error. We need semicolon.
                id = guid( 4 );
                result = [
                    wrapCodeFragmentHtml( 'do', id[ 0 ] ),
                    maybeBlock( stmt.body )
                ];

                result = maybeBlockSuffix(stmt.body, result);
                result = join(result, [
                    wrapCodeFragmentHtml( 'while', id[ 1 ] ),
                    space,
                    wrapCodeFragmentHtml( '(', id[ 2 ] ),
                    space,
                    generateExpression(stmt.test, {
                        precedence: Precedence.Sequence,
                        allowIn: true,
                        allowCall: true,
                        idBuffer: id
                    }),
                    space,
                    wrapCodeFragmentHtml( ')', id[ 3 ] ),
                    semicolon,
                    injectCodeFragmentTrace( id )
                ]);
                break;

            case Syntax.CatchClause:
                id = guid( 3 );
                withIndent(function (indent) {
                    result = [
                        wrapCodeFragmentHtml( 'catch', id[ 0 ] ),
                        space,
                        wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space,
                        generateExpression( stmt.param, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        } ),
                        space,
                        wrapCodeFragmentHtml( ')', id[ 2 ] )
                    ];
                });
                result.push( maybeBlock( stmt.body, null, id ) );
                break;

            case Syntax.DebuggerStatement:
                result = 'debugger' + semicolon;
                break;

            case Syntax.EmptyStatement:
                result = ';';
                break;

            case Syntax.ExpressionStatement:
                id = [];
                result = [generateExpression(stmt.expression, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true,
                    fromStatement: true,
                    idBuffer: id
                })];

                // 12.4 '{', 'function' is not allowed in this position.
                // wrap expression with parentheses
                resultString = result.toString().replace( trackerDelimiterRegx, "" );
                if ( resultString.charAt(0) === '{' ||
                    ( resultString.slice(0, 8) === 'function' && " (".indexOf( resultString.charAt(8) ) >= 0 ) ) {
                    _push.apply( id, tid = guid(2) );
                    result = [
                        wrapCodeFragmentHtml( '(', tid[0] ),
                        result,
                        wrapCodeFragmentHtml( ')', tid[1] ),
                        semicolon,
                        injectCodeFragmentTrace( id )
                    ];
                } else {
                    result.push(
                        semicolon,
                        injectCodeFragmentTrace( id )
                    );
                }

                break;

            case Syntax.VariableDeclarator:
                if ( stmt.init ){
                    id = guid( 2 );

                    idBuffer && _push.apply( idBuffer, id );
                    result = [
                        wrapCodeFragmentHtml( stmt.id.name, id[ 0 ] ),
                        space,
                        wrapCodeFragmentHtml( '=', id[ 1 ] ),
                        space,
                        generateExpression( stmt.init, {
                            precedence: Precedence.Assignment,
                            allowIn: allowIn,
                            allowCall: true,
                            idBuffer: idBuffer
                        } )
                    ];
                } else {
                    id = guid();
                    idBuffer && idBuffer.push( id );
                    result = wrapCodeFragmentHtml( stmt.id.name, id );
                }
                break;

            case Syntax.VariableDeclaration:
                id = [];
                id.push( tid = guid() );

                result = [
                    wrapCodeFragmentHtml( stmt.kind, tid )
                ];

                // special path for
                // var x = function () {
                // };
                if ( stmt.declarations.length === 1 && stmt.declarations[0].init &&
                    stmt.declarations[0].init.type === Syntax.FunctionExpression ) {
                    result.push( ' ', generateStatement( stmt.declarations[0], {
                        allowIn: allowIn,
                        idBuffer: id
                    } ) );
                } else {
                    // VariableDeclarator is typed as Statement,
                    // but joined with comma (not LineTerminator).
                    // So if comment is attached to target node, we should specialize.
                    withIndent(function (indent) {
                        node = stmt.declarations[0];

                        if ( extra.comment && node.leadingComments ) {
                            result.push( '\n', addIndent( generateStatement( node, {
                                allowIn: allowIn
                            } ) ) );
                        } else {
                            result.push( ' ', generateStatement(node, {
                                allowIn: allowIn,
                                idBuffer: id
                            } ) );
                        }

                        for ( i = 1, len = stmt.declarations.length; i < len; i += 1 ) {
                            node = stmt.declarations[i];
                            if (extra.comment && node.leadingComments) {
                                result.push( ',' + newline, addIndent( generateStatement( node, {
                                    allowIn: allowIn,
                                    idBuffer: id
                                } ) ) );
                            } else {
                                result.push( ',' + space, generateStatement( node, {
                                    allowIn: allowIn,
                                    idBuffer: id
                                } ) );
                            }
                        }

                    });
                }

                result.push(
                    injectAssistedCode( ", __trackerTempVariable__ = " ),
                    injectCodeFragmentTraceWithReturn( id ),
                    // injectCodeFragmentTrace( id ),
                    semicolon
                );

                break;

            case Syntax.ThrowStatement:
                // TODO: throw 后面如果哪一个复杂的表达式，整段都会被绿色块包含起来，因为直接用了 wrapCodeFragmentHtml，
                // 应该改为 idBuffer 的实现
                // 但由于 throw 完成之后，代码会中断，没有机会执行 trace，暂时也无比较好的办法（用 try..finally ? ）
                // 参考 ReturnStatement 中加 try 的实现
                id = guid( 2 );
                result = [
                    injectCodeFragmentTrace( id ),
                    join(
                        wrapCodeFragmentHtml( 'throw', id[ 0 ] ),
                        wrapCodeFragmentHtml( generateExpression(stmt.argument, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true
                        }), id[ 1 ] )
                    ),
                    semicolon
                ];
                break;

            case Syntax.TryStatement:
                id = guid( 1 );

                result = [
                    wrapCodeFragmentHtml( 'try', id[ 0 ] ),
                    maybeBlock( stmt.block, null, id )
                ];

                result = maybeBlockSuffix(stmt.block, result);

                for (i = 0, len = stmt.handlers.length; i < len; i += 1) {
                    result = join(result, generateStatement(stmt.handlers[i]));
                    if (stmt.finalizer || i + 1 !== len) {
                        result = maybeBlockSuffix(stmt.handlers[i].body, result);
                    }
                }

                id = guid( 1 );

                if (stmt.finalizer) {
                    result = join(result, [
                        wrapCodeFragmentHtml( 'finally', id[ 0 ] ),
                        maybeBlock( stmt.finalizer, null, id )
                    ]);
                }

                break;

            case Syntax.SwitchStatement:
                id = guid( 5 );

                withIndent(function (indent) {
                    result = [
                        wrapCodeFragmentHtml( 'switch', id[ 0 ]),
                        space,
                        wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space,
                        generateExpression(stmt.discriminant, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }),
                        space,
                        wrapCodeFragmentHtml( ')', id[ 2 ] ),
                        space,
                        wrapCodeFragmentHtml( '{', id[ 3 ] ),
                        newline
                    ];
                });

                if (stmt.cases) {
                    for (i = 0, len = stmt.cases.length; i < len; i += 1) {
                        fragment = addIndent(generateStatement(stmt.cases[i], {semicolonOptional: i === len - 1}));
                        result.push(fragment);
                        if (!endsWithLineTerminator(toSourceNode(fragment).toString())) {
                            result.push(newline);
                        }
                    }
                }

                result.push(
                    addIndent( wrapCodeFragmentHtml( '}', id[ 4 ] ) ),
                    injectCodeFragmentTrace( id )
                );

                break;

            case Syntax.SwitchCase:
                withIndent(function (indent) {
                    if (stmt.test) {
                        id = guid( 1 );
                        result = [
                            join(
                                wrapCodeFragmentHtml( 'case', id[ 0 ] ),
                                generateExpression(stmt.test, {
                                    precedence: Precedence.Sequence,
                                    allowIn: true,
                                    allowCall: true,
                                    idBuffer: id
                                })
                            ),
                            ':',
                            injectCodeFragmentTrace( id )
                        ];
                    } else {
                        id = guid( 1 );
                        result = [
                            wrapCodeFragmentHtml( 'default' ),
                            ':',
                            injectCodeFragmentTrace( id )
                        ];
                    }

                    i = 0;
                    len = stmt.consequent.length;
                    if (len && stmt.consequent[0].type === Syntax.BlockStatement) {
                        fragment = maybeBlock(stmt.consequent[0]);
                        result.push(fragment);
                        i = 1;
                    }

                    if (i !== len && !endsWithLineTerminator(toSourceNode(result).toString())) {
                        result.push(newline);
                    }

                    for (; i < len; i += 1) {
                        fragment = addIndent(generateStatement(stmt.consequent[i], {semicolonOptional: i === len - 1 && semicolon === ''}));
                        result.push(fragment);
                        if (i + 1 !== len && !endsWithLineTerminator(toSourceNode(fragment).toString())) {
                            result.push(newline);
                        }
                    }
                });
                break;

            case Syntax.IfStatement:
                id = guid( 3, entrustedTraceId );

                withIndent(function (indent) {
                    result = [
                        // NOTE: 加了 wrap
                        wrapCodeFragmentHtml( 'if', id[ 0 ] ),
                        space,
                        wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space,
                        generateExpression(stmt.test, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }),
                        space,
                        wrapCodeFragmentHtml( ')', id[ 2 ] )
                    ];
                });

                if ( stmt.alternate ) {
                    result.push( maybeBlock( stmt.consequent, null, id ) );
                    result = maybeBlockSuffix( stmt.consequent, result );

                    if ( stmt.alternate.type === Syntax.IfStatement ) {
                        id = guid( 1 );

                        result = join(
                            result, [
                                wrapCodeFragmentHtml( "else", id[ 0 ] )  + ' ',
                                generateStatement( stmt.alternate, {
                                    semicolonOptional: semicolon === '',
                                    entrustedTraceId: id
                                } )
                            ]
                        );
                    } else {
                        id = guid( 1 );

                        result = join(
                            result,
                            join(
                                wrapCodeFragmentHtml( 'else', id[ 0 ] ),
                                maybeBlock(stmt.alternate, semicolon === '', id)
                            )
                        );
                    }

                } else {
                    result.push( maybeBlock(stmt.consequent, semicolon === '', id ));
                }

                break;

            case Syntax.ForStatement:
                id = guid( 4 );

                withIndent(function (indent) {
                    result = [
                        wrapCodeFragmentHtml( 'for', id[ 0 ] ),
                        space,
                        wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space
                    ];

                    if (stmt.init) {
                        if (stmt.init.type === Syntax.VariableDeclaration) {
                            result.push(
                                generateStatement(
                                    stmt.init, { allowIn: false, idBuffer: id }
                                )
                            );
                        } else {
                            result.push( generateExpression(stmt.init, {
                                precedence: Precedence.Sequence,
                                allowIn: false,
                                allowCall: true,
                                idBuffer: id
                            } ), ';' );
                        }
                    } else {
                        result.push( ';' );
                    }

                    if (stmt.test) {
                        result.push( space, generateExpression(stmt.test, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }), ';');
                    } else {
                        result.push( ';' );
                    }

                    if ( stmt.update ) {
                        result.push(space, generateExpression(stmt.update, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }), space, wrapCodeFragmentHtml( ')', id[ 2 ] ) );
                    } else {
                        result.push( space, wrapCodeFragmentHtml( ')', id[ 3 ] ) );
                    }
                });

                result.push(
                    maybeBlock(stmt.body, semicolon === ''),
                    injectAssistedCode( ";" ),
                    injectCodeFragmentTrace( id )
                );

                break;

            case Syntax.ForInStatement:
                id = guid( 5 );

                result = [
                    wrapCodeFragmentHtml( 'for', id[ 0 ] ),
                    space,
                    wrapCodeFragmentHtml( '(', space, id[ 1 ] )
                ];

                withIndent(function (indent) {
                    if (stmt.left.type === Syntax.VariableDeclaration) {
                        withIndent(function (indent) {
                            result.push(
                                wrapCodeFragmentHtml( stmt.left.kind, id[ 2 ] ) + ' ',
                                generateStatement(stmt.left.declarations[0], {
                                    allowIn: false,
                                    idBuffer: id
                                }));
                        });
                    } else {
                        result.push( generateExpression(stmt.left, {
                            precedence: Precedence.Call,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }));
                    }

                    result = join( result, wrapCodeFragmentHtml( 'in', id[ 3 ] ) );
                    result = [ join(
                        result,
                        generateExpression(stmt.right, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        })
                    ), space, wrapCodeFragmentHtml( ')', id[ 4 ] ) ];
                });

                result.push(
                    maybeBlock(stmt.body, semicolon === ''),
                    injectAssistedCode( ";" ),
                    injectCodeFragmentTrace( id )
                );
                break;

            case Syntax.LabeledStatement:
                id = guid( 1 );

                result = [
                    injectCodeFragmentTrace( id ),
                    wrapCodeFragmentHtml( stmt.label.name, id[ 0 ] ),
                    ':',
                    maybeBlock( stmt.body, semicolon === '', null, null, true )
                ];
                break;

            case Syntax.Program:
                len = stmt.body.length;
                result = [safeConcatenation && len > 0 ? '\n' : ''];
                for (i = 0; i < len; i += 1) {
                    fragment = addIndent(generateStatement(stmt.body[i], {semicolonOptional: !safeConcatenation && i === len - 1}));
                    result.push(fragment);
                    if (i + 1 < len && !endsWithLineTerminator(toSourceNode(fragment).toString())) {
                        result.push(newline);
                    }
                }
                break;

            case Syntax.FunctionDeclaration:
                id = guid( 2 );

                result = [
                    wrapCodeFragmentHtml( "function", id[ 0 ] ),
                    ' ',
                    wrapCodeFragmentHtml( stmt.id.name, id[ 1 ] ),
                    generateFunctionBody( stmt, id ),
                    injectAssistedCode( ";" ),
                    injectCodeFragmentTrace( id )
                ];
                break;

            case Syntax.ReturnStatement:
                id = guid( 1 );

                if (stmt.argument) {
                    result = [
                        injectAssistedCode( "try{" ),
                        join(
                            wrapCodeFragmentHtml( 'return', id[ 0 ] ),
                            generateExpression(stmt.argument, {
                                precedence: Precedence.Sequence,
                                allowIn: true,
                                allowCall: true,
                                idBuffer: id
                            })
                        ),
                        injectAssistedCode( "}catch(__trackerErrorData__){throw __trackerErrorData__;}finally{" ),
                        injectCodeFragmentTrace( id ),
                        injectAssistedCode( "}" ),
                        semicolon
                    ];
                } else {
                    result = [
                        injectCodeFragmentTrace( id ),
                        wrapCodeFragmentHtml( 'return', id[ 0 ] ),
                        semicolon
                    ];
                }
                break;

            case Syntax.WhileStatement:
                id = guid( 3 );

                withIndent(function (indent) {
                    result = [
                        wrapCodeFragmentHtml( 'while', id[ 0 ] ) + space + wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space,
                        generateExpression(stmt.test, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }),
                        space,
                        wrapCodeFragmentHtml( ')', id[ 2 ] )
                    ];
                });
                result.push(
                    maybeBlock(stmt.body, semicolon === ''),
                    injectAssistedCode( ";" ),
                    injectCodeFragmentTrace( id )
                );
                break;

            case Syntax.WithStatement:
                id = guid( 3 );

                withIndent(function (indent) {
                    result = [
                        wrapCodeFragmentHtml( 'with', id[ 0 ] ),
                        space,
                        wrapCodeFragmentHtml( '(', id[ 1 ] ),
                        space,
                        generateExpression(stmt.object, {
                            precedence: Precedence.Sequence,
                            allowIn: true,
                            allowCall: true,
                            idBuffer: id
                        }),
                        space,
                        wrapCodeFragmentHtml( ')', id[ 2 ] )
                    ];
                });
                result.push(
                    maybeBlock(stmt.body, semicolon === '', id)
                );
                break;

            default:
                throw new Error('Unknown statement type: ' + stmt.type);
        }

        // Attach comments

        if (extra.comment) {
            result = addCommentsToStatement(stmt, result);
        }

        var fragment = toSourceNode(result).toString();
        if (stmt.type === Syntax.Program && !safeConcatenation && newline === '' &&  fragment.charAt(fragment.length - 1) === '\n') {
            result = toSourceNode(result).replaceRight(/\s+$/, '');
        }

        return toSourceNode(result, stmt);
    }

    function generate( node, options, currentCodeInstance ) {
        var defaultOptions = getDefaultOptions(), result, pair;

        currentCode = currentCodeInstance;
        // snippetsIdSet = currentCode.snippetsIdSet;

        if (options != null) {
            // Obsolete options
            //
            //   `options.indent`
            //   `options.base`
            //
            // Instead of them, we can use `option.format.indent`.
            if (typeof options.indent === 'string') {
                defaultOptions.format.indent.style = options.indent;
            }
            if (typeof options.base === 'number') {
                defaultOptions.format.indent.base = options.base;
            }
            options = updateDeeply(defaultOptions, options);
            indent = options.format.indent.style;
            if (typeof options.base === 'string') {
                base = options.base;
            } else {
                base = stringRepeat(indent, options.format.indent.base);
            }
        } else {
            options = defaultOptions;
            indent = options.format.indent.style;
            base = stringRepeat(indent, options.format.indent.base);
        }

        json = options.format.json;
        renumber = options.format.renumber;
        hexadecimal = json ? false : options.format.hexadecimal;
        quotes = json ? 'double' : options.format.quotes;
        escapeless = options.format.escapeless;
        if (options.format.compact) {
            newline = space = indent = base = '';
        } else {
            newline = '\n';
            space = ' ';
        }
        parentheses = options.format.parentheses;
        semicolons = options.format.semicolons;
        safeConcatenation = options.format.safeConcatenation;
        parse = json ? null : options.parse;
        sourceMap = options.sourceMap;
        extra = options;

        if (sourceMap) {
            if (typeof process !== 'undefined') {
                // We assume environment is node.js
                SourceNode = require('source-map').SourceNode;
            } else {
                SourceNode = global.sourceMap.SourceNode;
            }
        } else {
            SourceNode = SourceNodeMock;
        }

        switch (node.type) {
            case Syntax.BlockStatement:
            case Syntax.BreakStatement:
            case Syntax.CatchClause:
            case Syntax.ContinueStatement:
            case Syntax.DoWhileStatement:
            case Syntax.DebuggerStatement:
            case Syntax.EmptyStatement:
            case Syntax.ExpressionStatement:
            case Syntax.ForStatement:
            case Syntax.ForInStatement:
            case Syntax.FunctionDeclaration:
            case Syntax.IfStatement:
            case Syntax.LabeledStatement:
            case Syntax.Program:
            case Syntax.ReturnStatement:
            case Syntax.SwitchStatement:
            case Syntax.SwitchCase:
            case Syntax.ThrowStatement:
            case Syntax.TryStatement:
            case Syntax.VariableDeclaration:
            case Syntax.VariableDeclarator:
            case Syntax.WhileStatement:
            case Syntax.WithStatement:
                result = generateStatement(node);
                break;

            case Syntax.AssignmentExpression:
            case Syntax.ArrayExpression:
            case Syntax.BinaryExpression:
            case Syntax.CallExpression:
            case Syntax.ConditionalExpression:
            case Syntax.FunctionExpression:
            case Syntax.Identifier:
            case Syntax.Literal:
            case Syntax.LogicalExpression:
            case Syntax.MemberExpression:
            case Syntax.NewExpression:
            case Syntax.ObjectExpression:
            case Syntax.Property:
            case Syntax.SequenceExpression:
            case Syntax.ThisExpression:
            case Syntax.UnaryExpression:
            case Syntax.UpdateExpression:
                result = generateExpression(node, {
                    precedence: Precedence.Sequence,
                    allowIn: true,
                    allowCall: true
                });
                break;

            default:
                throw new Error('Unknown node type: ' + node.type);
        }

        if (!sourceMap) {
            return result.toString();
        }

        pair = result.toStringWithSourceMap({file: options.sourceMap});

        if (options.sourceMapWithCode) {
            return pair;
        }
        return pair.map.toString();
    }

    // simple visitor implementation

    VisitorKeys = {
        AssignmentExpression: ['left', 'right'],
        ArrayExpression: ['elements'],
        BlockStatement: ['body'],
        BinaryExpression: ['left', 'right'],
        BreakStatement: ['label'],
        CallExpression: ['callee', 'arguments'],
        CatchClause: ['param', 'body'],
        ConditionalExpression: ['test', 'consequent', 'alternate'],
        ContinueStatement: ['label'],
        DoWhileStatement: ['body', 'test'],
        DebuggerStatement: [],
        EmptyStatement: [],
        ExpressionStatement: ['expression'],
        ForStatement: ['init', 'test', 'update', 'body'],
        ForInStatement: ['left', 'right', 'body'],
        FunctionDeclaration: ['id', 'params', 'body'],
        FunctionExpression: ['id', 'params', 'body'],
        Identifier: [],
        IfStatement: ['test', 'consequent', 'alternate'],
        Literal: [],
        LabeledStatement: ['label', 'body'],
        LogicalExpression: ['left', 'right'],
        MemberExpression: ['object', 'property'],
        NewExpression: ['callee', 'arguments'],
        ObjectExpression: ['properties'],
        Program: ['body'],
        Property: ['key', 'value'],
        ReturnStatement: ['argument'],
        SequenceExpression: ['expressions'],
        SwitchStatement: ['discriminant', 'cases'],
        SwitchCase: ['test', 'consequent'],
        ThisExpression: [],
        ThrowStatement: ['argument'],
        TryStatement: ['block', 'handlers', 'finalizer'],
        UnaryExpression: ['argument'],
        UpdateExpression: ['argument'],
        VariableDeclaration: ['declarations'],
        VariableDeclarator: ['id', 'init'],
        WhileStatement: ['test', 'body'],
        WithStatement: ['object', 'body']
    };

    VisitorOption = {
        Break: 1,
        Skip: 2
    };

    function traverse(top, visitor) {
        var worklist, leavelist, node, ret, current, current2, candidates, candidate, marker = {};

        worklist = [ top ];
        leavelist = [ null ];

        while (worklist.length) {
            node = worklist.pop();

            if (node === marker) {
                node = leavelist.pop();
                if (visitor.leave) {
                    ret = visitor.leave(node, leavelist[leavelist.length - 1]);
                } else {
                    ret = undefined;
                }
                if (ret === VisitorOption.Break) {
                    return;
                }
            } else if (node) {
                if (visitor.enter) {
                    ret = visitor.enter(node, leavelist[leavelist.length - 1]);
                } else {
                    ret = undefined;
                }

                if (ret === VisitorOption.Break) {
                    return;
                }

                worklist.push(marker);
                leavelist.push(node);

                if (ret !== VisitorOption.Skip) {
                    candidates = VisitorKeys[node.type];
                    current = candidates.length;
                    while ((current -= 1) >= 0) {
                        candidate = node[candidates[current]];
                        if (candidate) {
                            if (isArray(candidate)) {
                                current2 = candidate.length;
                                while ((current2 -= 1) >= 0) {
                                    if (candidate[current2]) {
                                        worklist.push(candidate[current2]);
                                    }
                                }
                            } else {
                                worklist.push(candidate);
                            }
                        }
                    }
                }
            }
        }
    }

    // based on LLVM libc++ upper_bound / lower_bound
    // MIT License

    function upperBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                len = diff;
            } else {
                i = current + 1;
                len -= diff + 1;
            }
        }
        return i;
    }

    function lowerBound(array, func) {
        var diff, len, i, current;

        len = array.length;
        i = 0;

        while (len) {
            diff = len >>> 1;
            current = i + diff;
            if (func(array[current])) {
                i = current + 1;
                len -= diff + 1;
            } else {
                len = diff;
            }
        }
        return i;
    }

    function extendCommentRange(comment, tokens) {
        var target, token;

        target = upperBound(tokens, function search(token) {
            return token.range[0] > comment.range[0];
        });

        comment.extendedRange = [comment.range[0], comment.range[1]];

        if (target !== tokens.length) {
            comment.extendedRange[1] = tokens[target].range[0];
        }

        target -= 1;
        if (target >= 0) {
            if (target < tokens.length) {
                comment.extendedRange[0] = tokens[target].range[1];
            } else if (token.length) {
                comment.extendedRange[1] = tokens[tokens.length - 1].range[0];
            }
        }

        return comment;
    }

    function attachComments(tree, providedComments, tokens) {
        // At first, we should calculate extended comment ranges.
        var comments = [], comment, len, i;

        if (!tree.range) {
            throw new Error('attachComments needs range information');
        }

        // tokens array is empty, we attach comments to tree as 'leadingComments'
        if (!tokens.length) {
            if (providedComments.length) {
                for (i = 0, len = providedComments.length; i < len; i += 1) {
                    comment = deepCopy(providedComments[i]);
                    comment.extendedRange = [0, tree.range[0]];
                    comments.push(comment);
                }
                tree.leadingComments = comments;
            }
            return tree;
        }

        for (i = 0, len = providedComments.length; i < len; i += 1) {
            comments.push(extendCommentRange(deepCopy(providedComments[i]), tokens));
        }

        // This is based on John Freeman's implementation.
        traverse(tree, {
            cursor: 0,
            enter: function (node) {
                var comment;

                while (this.cursor < comments.length) {
                    comment = comments[this.cursor];
                    if (comment.extendedRange[1] > node.range[0]) {
                        break;
                    }

                    if (comment.extendedRange[1] === node.range[0]) {
                        if (!node.leadingComments) {
                            node.leadingComments = [];
                        }
                        node.leadingComments.push(comment);
                        comments.splice(this.cursor, 1);
                    } else {
                        this.cursor += 1;
                    }
                }

                // already out of owned node
                if (this.cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[this.cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        traverse(tree, {
            cursor: 0,
            leave: function (node) {
                var comment;

                while (this.cursor < comments.length) {
                    comment = comments[this.cursor];
                    if (node.range[1] < comment.extendedRange[0]) {
                        break;
                    }

                    if (node.range[1] === comment.extendedRange[0]) {
                        if (!node.trailingComments) {
                            node.trailingComments = [];
                        }
                        node.trailingComments.push(comment);
                        comments.splice(this.cursor, 1);
                    } else {
                        this.cursor += 1;
                    }
                }

                // already out of owned node
                if (this.cursor === comments.length) {
                    return VisitorOption.Break;
                }

                if (comments[this.cursor].extendedRange[0] > node.range[1]) {
                    return VisitorOption.Skip;
                }
            }
        });

        return tree;
    }

    // Sync with package.json.
    exports.version = '0.0.9-dev';

    exports.generate = generate;
    exports.traverse = traverse;
    exports.attachComments = attachComments;
}, this );