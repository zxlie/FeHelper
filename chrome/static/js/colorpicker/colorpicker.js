var FeHelper = window.FeHelper || {};

/**
 * 页面取色器
 */
FeHelper.ColorPicker = (function () {

    var elmid1 = 'fehelper-colorpicker-box', elmid2 = 'fehelper-colorpicker-result';
    var popupsShowing = 0;

    function _ge(n) {
        return document.getElementById(n);
    }

    var n = false, c = false, hex = 'F00BAF', lasthex = '', rgb = null;
    var hsv = null;
    var ex = 0, ey = 0, isEnabled = false, isLocked = false, hexIsLowerCase = false, borderValue = '1px solid #666', blankgif = '';
    var isUpdating = false, lastTimeout = 0, lx = 0, ly = 0;
    var cvs = document.createElement('canvas');
    var ctx = cvs.getContext('2d'), x_cvs_scale = 1, y_cvs_scale = 1;

    function RGBtoHex(R, G, B) {
        return applyHexCase(toHex(R) + toHex(G) + toHex(B))
    }

    function applyHexCase(hex) {
        return hexIsLowerCase ? hex.toLowerCase() : hex;
    }

    function toHex(N) {//http://www.javascripter.net/faq/rgbtohex.htm
        if (N == null) return "00";
        N = parseInt(N);
        if (N == 0 || isNaN(N)) return "00";
        N = Math.max(0, N);
        N = Math.min(N, 255);
        N = Math.round(N);
        return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
    }

    function rgb2hsl(r, g, b) {//http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(l * 100)
        };
    }

    function emptyNode(node) {
        while (node.lastChild)node.removeChild(node.lastChild);
    }

    function snapshotLoaded() {
        c.style.height = 'auto';
        c.style.width = (innerWidth) + 'px';
        x_cvs_scale = c.naturalWidth / innerWidth;
        y_cvs_scale = c.naturalHeight / innerHeight;
        cvs.width = c.naturalWidth;
        cvs.height = c.naturalHeight;
        ctx.drawImage(c, 0, 0);

        setTimeout(function () {
            isMakingNew = false;
            c.style.visibility = "visible";
            n.style.visibility = "visible";
            document.body.style.cursor = 'url(' + chrome.extension.getURL('static/img/crosshair.png') + ') 16 16,crosshair';
            updateColorPreview();
        }, 255);
    }


    function setPixelPreview(pix, hxe, lhex) {
        if (isLocked)return;
        var wid = 75, padr = 32;
        wid = 150;
        hex = hxe ? hxe : hex;
        if (!_ge('fehelper-colorpicker-cpimprev') || (rgb && !_ge('cprgbvl'))) {
            emptyNode(n);
            FeHelper.elemTool.elm('div', {}, [
                FeHelper.elemTool.elm('img', {
                    id: 'fehelper-colorpicker-cpimprev',
                    height: wid,
                    width: wid,
                    src: pix,
                    style: 'margin:0px;padding:0px;margin:0px;'
                }),
                FeHelper.elemTool.elm('br'),
                FeHelper.elemTool.elm('input', {
                    type: 'text',
                    size: 7,
                    style: 'width:60px;height:20px;line-height:20px;font-size:10pt;border:' + borderValue,
                    id: 'fehelper-colorpicker-cphexvl',
                    value: '#' + hex,
                    event: ['mouseover', selectTargElm]
                })
            ], n)
            keepOnScreen();
        } else {
            _ge('fehelper-colorpicker-cpimprev').src = pix;
            _ge('fehelper-colorpicker-cpimprev').width = wid;
            _ge('fehelper-colorpicker-cpimprev').height = wid;
            _ge('fehelper-colorpicker-cphexvl').value = hex;
            n.style.backgroundColor = '#' + hex;
        }
    }

    function setCurColor(r) {
        if (!n)return;
        hex = r.hex ? r.hex : hex;
        n.style.backgroundColor = '#' + hex;
        if (isLocked)setDisplay();
    }

    function selectTargElm(ev) {
        ev.target.select();
    }

    function setDisplay() {//FeHelper.elemTool.elm
        emptyNode(n);
        FeHelper.elemTool.elm('div', {}, [
            FeHelper.elemTool.elm('input', {
                type: 'text',
                size: 7,
                style: 'width:80px;height:20px;line-height:20px;font-size:10pt;border:' + borderValue,
                id: 'fehelper-colorpicker-cphexvl',
                value: '#' + hex,
                event: ['mouseover', selectTargElm]
            }),
            FeHelper.elemTool.elm('img', {
                style: 'width:20px;height:20px;position:absolute;top:-10px;right:-10px;cursor:pointer;',
                src: chrome.extension.getURL('static/img/close.png'),
                alt: 'Close',
                title: '[esc]键可直接关闭',
                id: 'fehelper-colorpicker-exitbtn',
                event: ['click', dissableColorPickerFromHere, true]
            })
        ], n);
        if (_ge('fehelper-colorpicker-cphexvl'))_ge('fehelper-colorpicker-cphexvl').select();
        keepOnScreen();
    }

    function picked() {
        if (isLocked) {
            lasthex = hex;
            isLocked = false;
            emptyNode(n);
        } else {
            isLocked = true;
            setDisplay();
        }
    }

    function dissableColorPickerFromHere() {
        var disableTimeout = setTimeout(disableColorPicker, 500)
        chrome.runtime.sendMessage({disableColorPicker: true}, function (r) {
            clearTimeout(disableTimeout);
        });
    }

    function disableColorPicker() {
        isEnabled = false, isLocked = false;
        document.removeEventListener('mousemove', mmf);
        removeEventListener('scroll', ssf);
        removeEventListener('resize', ssf);
        removeEventListener('keyup', wk);
        removeExistingNodes();
        clearTimeout(lastNewTimeout);
    }

    function removeExistingNodes() {
        if (document.body) {
            c = _ge(elmid1), n = _ge(elmid2);
            if (c)document.body.removeChild(c);
            if (n)document.body.removeChild(n);
            c = false, n = false;
            document.body.style.cursor = 'default';
        }
    }

    function wk(ev) {
        if (!isEnabled)return;
        if (ev.keyCode == 27) {
            dissableColorPickerFromHere();
        } else if (ev.keyCode == 82 || ev.keyCode == 74) {//r or j refresh
            ssf();
        } else if (ev.keyCode == 13) {
            picked();
        }
    }

    function mmf(ev) {
        if (!isEnabled)return;
        if (!isLocked) {
            lx = (ev.pageX - pageXOffset), ly = (ev.pageY - pageYOffset);
            ex = Math.round(lx * x_cvs_scale),
                ey = Math.round(ly * y_cvs_scale);
            updateColorPreview();
        }
    }

    function ssf(ev) {
        if (!isEnabled)return;
        n.style.visibility = "hidden";
        c.style.visibility = "hidden";//redundent?
        clearTimeout(lastNewTimeout);
        lastNewTimeout = setTimeout(function () {
            newImage()//some delay required OR it won't update
        }, 250);
    }

    function initialInit() {
        removeExistingNodes();
        c = FeHelper.elemTool.elm('img', {
            id: elmid1,
            src: blankgif,
            style: 'position:fixed;max-width:none!important;max-height:none!important;top:0px;left:0px;margin:0px;padding:0px;overflow:hidden;z-index:2147483646;',
            events: [['click', picked, true], ['load', snapshotLoaded]]
        }, [], document.body);
        n = FeHelper.elemTool.elm('div', {
            id: elmid2,
            style: 'position:fixed;min-width:30px;max-width:300px;box-shadow:2px 2px 2px #666;border:' + borderValue + ';border-radius:5px;z-index:2147483646;cursor:default;padding:10px;text-align:center;'
        }, [], document.body);
        document.addEventListener('mousemove', mmf);
        addEventListener('keyup', wk);
        addEventListener('scroll', ssf);
        addEventListener('resize', ssf);
        testWebGlAvail();
        initializeCanvas();
        remainingInit();
    }

    function enableColorPicker() {
        if (!n) {
            initialInit();
            return false;
        }
        return remainingInit();
    }

    function remainingInit() {
        if (!isEnabled) {
            n.style.visibility = "hidden";
            c.style.visibility = "hidden";
            if (isLocked)picked();//unlocks for next pick
            document.body.style.cursor = 'url(' + chrome.extension.getURL('static/img/crosshair.png') + ') 16 16,crosshair';
            isEnabled = true;
            setTimeout(newImage, 1);
            return false;
        }
        return true;
    }

    function keepOnScreen() {

        if (!n)return;
        n.style.top = (ly + 8) + "px";
        n.style.left = (lx + 8) + "px";
        if (n.clientWidth + n.offsetLeft + 24 > innerWidth) {
            n.style.left = (lx - 8 - n.clientWidth) + "px";
        }
        if (n.clientHeight + n.offsetTop + 24 > innerHeight) {
            n.style.top = (ly - 8 - n.clientHeight) + "px";
        }
    }

    function updateColorPreview(ev) {
        if (!isEnabled)return;
        keepOnScreen();
        var data = ctx.getImageData(ex, ey, 1, 1).data;
        hsv = rgb2hsl(data[0], data[1], data[2]);
        rgb = {r: data[0], g: data[1], b: data[2]};
        setCurColor({hex: RGBtoHex(data[0], data[1], data[2])});
        handleRendering();
    }

    var isMakingNew = false, lastNewTimeout = 0;

    function newImage() {
        if (!isEnabled)return;
        if (isMakingNew) {
            clearTimeout(lastNewTimeout);
            lastNewTimeout = setTimeout(function () {
                newImage()
            }, 255);
            return;
        }
        document.body.style.cursor = 'wait';
        isMakingNew = true;
        n.style.visibility = "hidden";
        c.style.visibility = "hidden";
        c.src = blankgif;
        var x = innerWidth, y = innerHeight;
        c.style.width = x + 'px';
        c.style.height = y + 'px';

        setTimeout(function () {
            try {
                chrome.runtime.sendMessage({type: 'color-picker:newImage'}, function (response) {
                });
            } catch (e) {
                exitAndDetach();
            }
        }, 255);
    }

    var lastPreviewURI;
    var gl = 0, texture = 0, texturectx = 0, snapTexture = 0, shaderProgram = 0, textureSampPosition = 0, fishEyeScalePosition = 0;

    var webGlAvail = false, icvs = 0, totalWidth = 150;//750
    function testWebGlAvail() {
        var testc = document.createElement("canvas");
        var testctx = testc.getContext('webgl');
        if (testctx && typeof(testctx.getParameter) == "function") webGlAvail = true;
        else webGlAvail = false;
    }

    function handleRendering(quick) {
        var x = ex, y = ey;
        if (isMakingNew) {
            isUpdating = false;
            return;
        }

        var startPoint = Math.floor(totalWidth * 0.5);
        var ox = Math.round(x), oy = Math.round(y);

        if (quick) {
            var ictx = getMain2dContext();
            ictx.scale(2, 2);
            ictx.drawImage(cvs, -ox + (startPoint * 0.5), -oy + (startPoint * 0.5));
            ictx.scale(0.5, 0.5);

            ictx.fillStyle = "rgba(0,0,0,0.3)";//croshair
            //ictx.globalAlpha = 1.0;

            ictx.fillRect(startPoint, 0, 1, totalWidth);
            ictx.fillRect(0, startPoint, totalWidth, 1);

        } else {
            if (webGlAvail) {
                getMain3dContext();
                texturectx.drawImage(cvs, -ox + (64), -oy + (64));
                //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, texture);
                gl.uniform1i(textureSampPosition, 0);
                gl.uniform1f(fishEyeScalePosition, 15)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            } else {
                var ictx = getMain2dContext();
                ictx.drawImage(cvs, -ox + (startPoint), -oy + (startPoint));
                var smi, spi, mp = 15 - 0;
                //xx,yy
                for (var i = 0; i < startPoint; i += 2) {
                    smi = startPoint - i;
                    spi = startPoint + i;
                    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) //CANVAS
                    ictx.drawImage(icvs, spi, 0, smi, totalWidth,//total width really??
                        spi + 1, 0, smi, totalWidth);

                    ictx.drawImage(icvs, 0, 0, smi + 1, totalWidth,
                        -1, 0, smi + 1, totalWidth);

                    ictx.drawImage(icvs, 0, spi, totalWidth, smi,
                        0, spi + 1, totalWidth, smi);

                    ictx.drawImage(icvs, 0, 0, totalWidth, smi + 1,
                        0, -1, totalWidth, smi + 1);

                    if (i == 0) {
                        var dat = ictx.getImageData(startPoint, startPoint, 1, 1).data;//notarget
                        var d = dat[0] + dat[1] + dat[2];
                        if (d > 192) ictx.fillStyle = "rgba(30,30,30,0.8)";
                        else ictx.fillStyle = "rgba(225,225,225,0.8)";
                    } else ictx.fillStyle = "rgba(255,255,255,0.4)";

                    for (var c = 0; c < mp; c++) {
                        if (++i >= startPoint)break;
                        smi = startPoint - i;
                        spi = startPoint + i;
                        ictx.drawImage(icvs, spi, 0, smi, totalWidth,
                            spi + 1, 0, smi, totalWidth);

                        ictx.drawImage(icvs, 0, 0, smi + 1, totalWidth,
                            -1, 0, smi + 1, totalWidth);

                        ictx.drawImage(icvs, 0, spi, totalWidth, smi,
                            0, spi + 1, totalWidth, smi);

                        ictx.drawImage(icvs, 0, 0, totalWidth, smi + 1,
                            0, -1, totalWidth, smi + 1);
                    }
                    mp--;
                    if (mp < 1)mp = 1;
                    ictx.fillRect(spi + 1, 0, 1, totalWidth);
                    ictx.fillRect(smi - 1, 0, 1, totalWidth);
                    ictx.fillRect(0, spi + 1, totalWidth, 1);
                    ictx.fillRect(0, smi - 1, totalWidth, 1);
                }
            }
        }

        lastPreviewURI = icvs.toDataURL();//the last one, large size, is cached for revisiting the menu

        var browseIconWidth = (devicePixelRatio > 1 ? 38 : 19);
        var browseIconHalfWidth = Math.floor(browseIconWidth * 0.5);
        //chrome.browserAction.setIcon({imageData:ictx.getImageData(startPoint-browseIconHalfWidth, startPoint-browseIconHalfWidth, browseIconWidth, browseIconWidth)});

        var tmpCvs = document.createElement('canvas');
        tmpCvs.width = browseIconWidth, tmpCvs.height = browseIconWidth;
        var tctx = tmpCvs.getContext("2d");
        tctx.drawImage(icvs, startPoint - browseIconHalfWidth, startPoint - browseIconHalfWidth, browseIconWidth, browseIconWidth, 0, 0, browseIconWidth, browseIconWidth);
        var pathData = {};
        pathData[browseIconWidth] = tmpCvs.toDataURL();
        chrome.runtime.sendMessage({browserIconMsg: true, path: (pathData)}, function () {
        });

        setPixelPreview(lastPreviewURI, hex, lasthex);

        if (popupsShowing > 0) {
            sendDataToPopup();
        }
        isUpdating = false;
    }

    function sendDataToPopup() {
        chrome.runtime.sendMessage({
            setPreview: true,
            previewURI: lastPreviewURI,
            hex: hex,
            lhex: lasthex,
            elemTool: rgb.r,
            cg: rgb.g,
            cb: rgb.b
        }, function (response) {
        });
    }

    function getMain2dContext() {
        var context = icvs.getContext("2d");
        if (context) return context;
        else {
            initializeCanvas();
            return icvs.getContext("2d");
        }
    }

    function getMain3dContext() {
        if (gl) return gl;
        else {
            initializeCanvas();
            return gl;
        }
    }

    function initializeCanvas() {
        gl = 0;
        icvs = document.createElement('canvas');//icon canvas
        icvs.width = totalWidth;
        icvs.height = totalWidth;
        if (webGlAvail) {
            gl = icvs.getContext("webgl");

            var squareVerticesBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
            var vertices = [
                1.0, 1.0, 0.0,//top right
                -1.0, 1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, -1.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            var textureCoordBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
            var textureCoordinates = [
                // Front
                1.0, 1.0,
                0.0, 1.0,
                1.0, 0.0,
                0.0, 0.0
            ];
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

            var fragShader = "" +
                "precision mediump float;" + "\n" +
                "varying highp vec2 vTextureCoord;" + "\n" +
                "uniform float fishEyeScale;" + "\n" +
                "uniform sampler2D uSampler;" + "\n" +
                "void main(void) {" + "\n" +
                " float texSizeFracOnePix=1.0 / 128.0;" + "\n" +
                " float halfTexSizeFracOnePix=texSizeFracOnePix * 0.5;" + "\n" +
                " vec2 ctr=vec2(0.5,0.5) + vec2(halfTexSizeFracOnePix,-halfTexSizeFracOnePix);" + "\n" +
                " vec2 agl=(vTextureCoord.xy - ctr.xy);" + "\n" +
                " float dis=distance(ctr,vTextureCoord) / fishEyeScale;" + "\n" +
                " vec2 get=ctr + (agl * dis);" + "\n" +
                " vec4 bcolor=texture2D(uSampler, get);" + "\n" +
                " vec2 res=get * 128.0;" + "\n" +
                " ivec2 geb=ivec2(res);" + "\n" +
                " vec4 pcolor = texture2D(uSampler, ctr);//picked color" + "\n" +
                " vec4 ccolor = vec4(0.0,0.0,0.0,1.0);//crosshair color" + "\n" +
                " if(pcolor.r + pcolor.g + pcolor.b < 1.5){" + "\n" +
                "  ccolor = vec4(1.0,1.0,1.0,1.0);" + "\n" +
                " }" + "\n" +
                " if( geb.x == 64 && geb.y == 63 ){" + "\n" +
                "  if( res.x < 64.1 || res.x > 64.9  || res.y > 63.9 || res.y < 63.1 	){" + "\n" +
                "   bcolor = mix(bcolor,ccolor,0.8);" + "\n" +
                "  }" + "\n" +
                " }" + "\n" +
                " gl_FragColor = bcolor;" + "\n" +
                "}";

            var vertShader = "" +
                "attribute vec3 aVertexPosition;" + "\n" +
                "attribute vec2 aTextureCoord;" + "\n" +
                "varying highp vec2 vTextureCoord;" + "\n" +
                "void main(void) {" + "\n" +
                " gl_Position = vec4(aVertexPosition, 1.0);" + "\n" +
                " vTextureCoord = aTextureCoord;" + "\n" +
                "}";

            var fshader = gl.createShader(gl.FRAGMENT_SHADER);
            var vshader = gl.createShader(gl.VERTEX_SHADER);

            gl.shaderSource(fshader, fragShader);
            gl.shaderSource(vshader, vertShader);

            gl.compileShader(fshader);
            if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
                webGlAvail = false;
                console.log("An error occurred compiling the frag shaders: " + gl.getShaderInfoLog(fshader));
            }

            gl.compileShader(vshader);
            if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
                webGlAvail = false;
                console.log("An error occurred compiling the vertex shaders: " + gl.getShaderInfoLog(vshader));
            }

            shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vshader);
            gl.attachShader(shaderProgram, fshader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                webGlAvail = false;
                console.log("Unable to initialize the shader program.");
                console.log(gl.getProgramInfoLog(shaderProgram));
            }

            gl.useProgram(shaderProgram);

            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);

            var textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
            gl.enableVertexAttribArray(textureCoordAttribute);

            textureSampPosition = gl.getUniformLocation(shaderProgram, "uSampler");
            fishEyeScalePosition = gl.getUniformLocation(shaderProgram, "fishEyeScale");

            texture = document.createElement('canvas');//icon canvas
            texture.width = 128;
            texture.height = 128;
            texturectx = texture.getContext("2d");

            gl.activeTexture(gl.TEXTURE0);
            snapTexture = gl.createTexture();
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, snapTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.uniform1i(textureSampPosition, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
            gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
            gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
        }
    }

    function reqLis(request, sender, sendResponse) {
        var resp = {result: true};
        if (request.enableColorPicker) {
            resp.wasAlreadyEnabled = enableColorPicker()
            if (request.workerHasChanged) lsnaptabid = -1;
            if (resp.wasAlreadyEnabled) {
                resp.hex = hex;
                resp.lhex = lasthex;
                resp.previewURI = lastPreviewURI;
                resp.FeHelper.elemTool = rgb.r;
                resp.cg = rgb.g;
                resp.cb = rgb.b;
            }
        } else if (request.doPick) {
            picked()
        } else if (request.setPickerImage) {
            c.src = request.pickerImage;
        }
        resp.isPicking = !isLocked;
        sendResponse(resp);
    }

    function init() {

        disableColorPicker();
        chrome.runtime.onMessage.removeListener(reqLis);
        chrome.runtime.onMessage.addListener(reqLis);

        chrome.runtime.onConnect.addListener(function (port) {
            if (port.name == "popupshown") {
                popupsShowing++;
                port.onDisconnect.addListener(function (msg) {
                    popupsShowing--;
                    if (popupsShowing < 0)popupsShowing = 0;
                });
            }
        });
    }

    return {
        init: init
    };


})();

FeHelper.ColorPicker.init();