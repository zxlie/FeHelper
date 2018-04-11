// ==ClosureCompiler==
// @compilation_level ADVANCED_OPTIMIZATIONS
// @output_file_name background.js
// @externs_url http://closure-compiler.googlecode.com/svn/trunk/contrib/externs/chrome_extensions.js
// @js_externs var console = {assert: function(){}};
// @formatting pretty_print
// ==/ClosureCompiler==

/** @license
  JSON Formatter | MIT License
  Copyright 2012 Callum Locke

  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
  of the Software, and to permit persons to whom the Software is furnished to do
  so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

 */

/*jshint eqeqeq:true, forin:true, strict:true */
/*global chrome, console */

var JsonFormatDealer = (function () {
  
  "use strict" ;

  // Constants
    var
      TYPE_STRING = 1,
      TYPE_NUMBER = 2,
      TYPE_OBJECT = 3,
      TYPE_ARRAY  = 4,
      TYPE_BOOL   = 5,
      TYPE_NULL   = 6
    ;

  // Utility functions
    function removeComments (str) {
      str = ('__' + str + '__').split('');
      var mode = {
        singleQuote: false,
        doubleQuote: false,
        regex: false,
        blockComment: false,
        lineComment: false,
        condComp: false
      };
      for (var i = 0, l = str.length; i < l; i++) {
        if (mode.regex) {
          if (str[i] === '/' && str[i-1] !== '\\') {
            mode.regex = false;
          }
          continue;
        }
        if (mode.singleQuote) {
          if (str[i] === "'" && str[i-1] !== '\\') {
            mode.singleQuote = false;
          }
          continue;
        }
        if (mode.doubleQuote) {
          if (str[i] === '"' && str[i-1] !== '\\') {
            mode.doubleQuote = false;
          }
          continue;
        }
        if (mode.blockComment) {
          if (str[i] === '*' && str[i+1] === '/') {
            str[i+1] = '';
            mode.blockComment = false;
          }
          str[i] = '';
          continue;
        }
        if (mode.lineComment) {
          if (str[i+1] === '\n' || str[i+1] === '\r') {
            mode.lineComment = false;
          }
          str[i] = '';
          continue;
        }
        if (mode.condComp) {
          if (str[i-2] === '@' && str[i-1] === '*' && str[i] === '/') {
            mode.condComp = false;
          }
          continue;
        }
        mode.doubleQuote = str[i] === '"';
        mode.singleQuote = str[i] === "'";
        if (str[i] === '/') {
          if (str[i+1] === '*' && str[i+2] === '@') {
            mode.condComp = true;
            continue;
          }
          if (str[i+1] === '*') {
            str[i] = '';
            mode.blockComment = true;
            continue;
          }
          if (str[i+1] === '/') {
            str[i] = '';
            mode.lineComment = true;
            continue;
          }
          mode.regex = true;
        }
      }
      return str.join('').slice(2, -2);
    }
    // function spin(seconds) {
    //   // spin - Hog the CPU for the specified number of seconds
    //   // (for simulating long processing times in development)
    //   var stop = +new Date() + (seconds*1000)  ;
    //   while (new Date() < stop) {}
    //   return true ;
    // }

  // Record current version (in case future update wants to know)
    localStorage.jfVersion = '0.5.6' ;

  // Template elements
    var templates,
        baseDiv = document.createElement('div'),
        baseSpan = document.createElement('span') ;
    
    function getSpanBoth(innerText,className) {
      var span = baseSpan.cloneNode(false) ;
      span.className = className ;
      span.innerText = innerText ;
      return span ;
    }
    function getSpanText(innerText) {
      var span = baseSpan.cloneNode(false) ;
      span.innerText = innerText ;
      return span ;
    }
    function getSpanClass(className) {
      var span = baseSpan.cloneNode(false) ;
      span.className = className ;
      return span ;
    }
    function getDivClass(className) {
        var span = baseDiv.cloneNode(false) ;
        span.className = className ;
        return span ;
    }

    // Create template nodes
      var templatesObj = {
        t_kvov: getDivClass('kvov'),
        t_exp: getSpanClass('e'),
        t_key: getSpanClass('k'),
        t_string: getSpanClass('s'),
        t_number: getSpanClass('n'),
        
        t_null: getSpanBoth('null', 'nl'),
        t_true: getSpanBoth('true','bl'),
        t_false: getSpanBoth('false','bl'),
        
        t_oBrace: getSpanBoth('{','b'),
        t_cBrace: getSpanBoth('}','b'),
        t_oBracket: getSpanBoth('[','b'),
        t_cBracket: getSpanBoth(']','b'),
        
        t_ellipsis: getSpanClass('ell'),
        t_blockInner: getSpanClass('blockInner'),
        
        t_colonAndSpace: document.createTextNode(':\u00A0'),
        t_commaText: document.createTextNode(','),
        t_dblqText: document.createTextNode('"')
      } ;

  // Core recursive DOM-building function
    function getKvovDOM(value, keyName) {
      var type,
          kvov,
          nonZeroSize,
          templates = templatesObj, // bring into scope for tiny speed boost
          objKey,
          keySpan,
          valueElement
      ;

      // Establish value type
        if (typeof value === 'string')
          type = TYPE_STRING ;
        else if (typeof value === 'number')
          type = TYPE_NUMBER ;
        else if (value === false || value === true )
          type = TYPE_BOOL ;
        else if (value === null)
          type = TYPE_NULL ;
        else if (value instanceof Array)
          type = TYPE_ARRAY ;
        else
          type = TYPE_OBJECT ;

      // Root node for this kvov
        kvov = templates.t_kvov.cloneNode(false) ;
      
      // Add an 'expander' first (if this is object/array with non-zero size)
        if (type === TYPE_OBJECT || type === TYPE_ARRAY) {
          nonZeroSize = false ;
          for (objKey in value) {
            if (value.hasOwnProperty(objKey)) {
              nonZeroSize = true ;
              break ; // no need to keep counting; only need one
            }
          }
          if (nonZeroSize)
            kvov.appendChild(  templates.t_exp.cloneNode(false) ) ;
        }
        
      // If there's a key, add that before the value
        if (keyName !== false) { // NB: "" is a legal keyname in JSON
          // This kvov must be an object property
            kvov.classList.add('objProp') ;
          // Create a span for the key name
            keySpan = templates.t_key.cloneNode(false) ;
            keySpan.textContent = JSON.stringify(keyName).slice(1,-1) ; // remove quotes
          // Add it to kvov, with quote marks
            kvov.appendChild(templates.t_dblqText.cloneNode(false)) ;
            kvov.appendChild( keySpan ) ;
            kvov.appendChild(templates.t_dblqText.cloneNode(false)) ;
          // Also add ":&nbsp;" (colon and non-breaking space)
            kvov.appendChild( templates.t_colonAndSpace.cloneNode(false) ) ;
        }
        else {
          // This is an array element instead
            kvov.classList.add('arrElem') ;
        }
      
      // Generate DOM for this value
        var blockInner, childKvov ;
        switch (type) {
          case TYPE_STRING:
            // If string is a URL, get a link, otherwise get a span
              var innerStringEl = baseSpan.cloneNode(false),
                  escapedString = JSON.stringify(value) ;
              escapedString = escapedString.substring(1, escapedString.length-1) ; // remove quotes
              if (value[0] === 'h' && value.substring(0, 4) === 'http') { // crude but fast - some false positives, but rare, and UX doesn't suffer terribly from them.
                var innerStringA = document.createElement('A') ;
                innerStringA.href = value ;
                innerStringA.innerText = escapedString ;
                innerStringEl.appendChild(innerStringA) ;
              }
              else {
                innerStringEl.innerText = escapedString ;
              }
              valueElement = templates.t_string.cloneNode(false) ;
              valueElement.appendChild(templates.t_dblqText.cloneNode(false)) ;
              valueElement.appendChild(innerStringEl) ;
              valueElement.appendChild(templates.t_dblqText.cloneNode(false)) ;
              kvov.appendChild(valueElement) ;
            break ;
          
          case TYPE_NUMBER:
            // Simply add a number element (span.n)
              valueElement = templates.t_number.cloneNode(false) ;
              valueElement.innerText = value ;
              kvov.appendChild(valueElement) ;
            break ;
          
          case TYPE_OBJECT:
            // Add opening brace
              kvov.appendChild( templates.t_oBrace.cloneNode(true) ) ;
            // If any properties, add a blockInner containing k/v pair(s)
              if (nonZeroSize) {
                // Add ellipsis (empty, but will be made to do something when kvov is collapsed)
                  kvov.appendChild( templates.t_ellipsis.cloneNode(false) ) ;
                // Create blockInner, which indents (don't attach yet)
                  blockInner = templates.t_blockInner.cloneNode(false) ;
                // For each key/value pair, add as a kvov to blockInner
                  var count = 0, k, comma ;
                  for (k in value) {
                    if (value.hasOwnProperty(k)) {
                      count++ ;
                      childKvov =  getKvovDOM(value[k], k) ;
                      // Add comma
                        comma = templates.t_commaText.cloneNode() ;
                        childKvov.appendChild(comma) ;
                      blockInner.appendChild( childKvov ) ;
                    }
                  }
                // Now remove the last comma
                  childKvov.removeChild(comma) ;
                // Add blockInner
                  kvov.appendChild( blockInner ) ;
              }
            
            // Add closing brace
              kvov.appendChild( templates.t_cBrace.cloneNode(true) ) ;
            break ;

          case TYPE_ARRAY:
            // Add opening bracket
              kvov.appendChild( templates.t_oBracket.cloneNode(true) ) ;
            // If non-zero length array, add blockInner containing inner vals
              if (nonZeroSize) {
                // Add ellipsis
                  kvov.appendChild( templates.t_ellipsis.cloneNode(false) ) ;
                // Create blockInner (which indents) (don't attach yet)
                  blockInner = templates.t_blockInner.cloneNode(false) ;
                // For each key/value pair, add the markup
                  for (var i=0, length=value.length, lastIndex=length-1; i<length; i++) {
                    // Make a new kvov, with no key
                      childKvov = getKvovDOM(value[i], false) ;
                    // Add comma if not last one
                      if (i < lastIndex)
                        childKvov.appendChild( templates.t_commaText.cloneNode() ) ;
                    // Append the child kvov
                      blockInner.appendChild( childKvov ) ;
                  }
                // Add blockInner
                  kvov.appendChild( blockInner ) ;
              }
            // Add closing bracket
              kvov.appendChild( templates.t_cBracket.cloneNode(true) ) ;
            break ;

          case TYPE_BOOL:
            if (value)
              kvov.appendChild( templates.t_true.cloneNode(true) ) ;
            else
              kvov.appendChild( templates.t_false.cloneNode(true) ) ;
            break ;

          case TYPE_NULL:
            kvov.appendChild( templates.t_null.cloneNode(true) ) ;
            break ;
        }

      return kvov ;
    }

  // Function to convert object to an HTML string
    function jsonObjToHTML(obj, jsonpFunctionName) {

      // spin(5) ;

      // Format object (using recursive kvov builder)
        var rootKvov = getKvovDOM(obj, false) ;

      // The whole DOM is now built.

      // Set class on root node to identify it
        rootKvov.classList.add('rootKvov') ;
        
      // Make div#formattedJson and append the root kvov
        var divFormattedJson = document.createElement('DIV') ;
        divFormattedJson.id = 'formattedJson' ;
        divFormattedJson.appendChild( rootKvov ) ;
      
      // Convert it to an HTML string (shame about this step, but necessary for passing it through to the content page)
        var returnHTML = divFormattedJson.outerHTML ;
        
      // Top and tail with JSONP padding if necessary
        if (jsonpFunctionName !== null) {
          returnHTML =
            '<div id="jsonpOpener">' + jsonpFunctionName + ' ( </div>' +
            returnHTML +
            '<div id="jsonpCloser">)</div>' ;
        }

      // Return the HTML
        return returnHTML ;
    }

  // Listen for requests from content pages wanting to set up a port
    var dealTheMsg = function(msg) {
        var jsonpFunctionName = null ;
        var port = JsonFormatEntrance;

        if (msg.type === 'SENDING TEXT') {
          // Try to parse as JSON
            var obj,
              text = msg.text ;
              try {
                obj = new Function('return ' + text)() ;
              }
              catch(e){
                // Not JSON; could be JSONP though.

                // Try stripping 'padding' (if any), and try parsing it again
                  text = text.trim() ;
                  // Find where the first paren is (and exit if none)
                    var indexOfParen ;
                    if ( ! (indexOfParen = text.indexOf('(') ) ) {
                      port.postMessage(['NOT JSON', 'no opening parenthesis']) ;
                      port.disconnect() ;
                      return ;
                    }
                  
                  // Get the substring up to the first "(", with any comments/whitespace stripped out
                    var firstBit = removeComments( text.substring(0,indexOfParen) ).trim() ;
                    if ( ! firstBit.match(/^[a-zA-Z_$][\.\[\]'"0-9a-zA-Z_$]*$/) ) {
                      // The 'firstBit' is NOT a valid function identifier.
                      port.postMessage(['NOT JSON', 'first bit not a valid function name']) ;
                      port.disconnect() ;
                      return ;
                    }
                  
                  // Find last parenthesis (exit if none)
                    var indexOfLastParen ;
                    if ( ! (indexOfLastParen = text.lastIndexOf(')') ) ) {
                      port.postMessage(['NOT JSON', 'no closing paren']) ;
                      port.disconnect() ;
                      return ;
                    }
                  
                  // Check that what's after the last parenthesis is just whitespace, comments, and possibly a semicolon (exit if anything else)
                    var lastBit = removeComments(text.substring(indexOfLastParen+1)).trim() ;
                    if ( lastBit !== "" && lastBit !== ';' ) {
                      port.postMessage(['NOT JSON', 'last closing paren followed by invalid characters']) ;
                      port.disconnect() ;
                      return ;
                    }
                    
                  // So, it looks like a valid JS function call, but we don't know whether it's JSON inside the parentheses...
                  // Check if the 'argument' is actually JSON (and record the parsed result)
                    text = text.substring(indexOfParen+1, indexOfLastParen) ;
                    try {
                      obj = JSON.parse(text) ;
                    }
                    catch(e2) {
                      // Just some other text that happens to be in a function call.
                      // Respond as not JSON, and exit
                        port.postMessage(['NOT JSON', 'looks like a function call, but the parameter is not valid JSON']) ;
                        return ;
                    }
                    
                jsonpFunctionName = firstBit ;
              }

            // If still running, we now have obj, which is valid JSON.

            // Ensure it's not a number or string (technically valid JSON, but no point prettifying it)
              if (typeof obj !== 'object' && typeof obj !== 'array') {
                port.postMessage(['NOT JSON', 'technically JSON but not an object or array']) ;
                port.disconnect() ;
                return ;
              }

            // And send it the message to confirm that we're now formatting (so it can show a spinner)
              port.postMessage(['FORMATTING' /*, JSON.stringify(localStorage)*/]) ;

            // Do formatting
              var html = jsonObjToHTML(obj, jsonpFunctionName) ;

            // Post the HTML string to the content script
              port.postMessage(['FORMATTED', html]) ;

            // Disconnect
              port.disconnect() ;
        }
    };

    /**
     * 发送消息
     * @param  {[type]} config [description]
     * @return {[type]}
     */
    var postMessage = function(msg){
        dealTheMsg(msg);
    };

    /**
     * 断开连接
     * @return {[type]}
     */
    var disconnect = function(){
    };

    return {
        postMessage : postMessage,
        disconnect : disconnect
    };
})() ;
