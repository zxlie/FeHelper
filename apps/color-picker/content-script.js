/**
 * FeHelper Page Color Picker Tools
 */

window.colorpickerContentScript = function () {


    let FeHelper = window.FeHelper || {};

    FeHelper.elemTool = {
        elm: function (nodeType, attributes, addchilds, appnedTo) {
            var ne = document.createElement(nodeType), i, l;
            if (attributes) {
                if (attributes.event || attributes.events) {
                    var lev = attributes.event || attributes.events;
                    if (typeof(lev[0]) == 'string') ne.addEventListener(lev[0], lev[1], lev[2]);
                    else if (lev.length)
                        for (i = 0, l = lev.length; i < l; i++)
                            ne.addEventListener(lev[i][0], lev[i][1], lev[i][2]);
                }
            }
            for (i in attributes) {
                if (i.substring(0, 5) == 'event') {
                    //handled earlier
                } else if (i == 'checked' || i == 'selected') {
                    if (attributes[i]) ne.setAttribute(i, i);
                } else ne.setAttribute(i, attributes[i]);
            }
            if (addchilds) {
                for (i = 0, l = addchilds.length; i < l; i++) {
                    if (addchilds[i]) ne.appendChild(addchilds[i]);//you probably forgot a comma when calling the function
                }
            }
            if (appnedTo) {
                this.insertNode(ne, appnedTo);
            }

            return ne;
        },
        /*elemTool.txt creates text nodes, does not support HTML entiteis */
        txt: function (textContent) {
            return document.createTextNode(textContent);
        },
        /*elemTool.ent creates text nodes that may or may not contain HTML entities.  From a
        single entity to many entities interspersed with text are all supported by this */
        ent: function (textContent) {
            return document.createTextNode(this.unescapeHtml(textContent));
        },
        /*elemTool.paragraphs creates an array of nodes that may or may not contain HTML entities.*/
        paragraphs: function (textContent) {
            var textPieces = textContent.split("\n");
            var elmArray = [];
            for (var i = 0, l = textPieces.length; i < l; i++) {
                elmArray.push(elemTool.elm('p', {}, [elemTool.ent(textPieces[i])]));
            }
            return elmArray;
        },
        insertNode: function (newNode, parentElem, optionalInsertBefore) {
            if (!parentElem) parentElem = document.body;
            if (optionalInsertBefore && optionalInsertBefore.parentNode == parentElem) {
                parentElem.insertBefore(newNode, optionalInsertBefore);
            } else {
                parentElem.appendChild(newNode);
            }
        },
        insertNodes: function (newNodes, parentElem, optionalInsertBefore) {
            if (typeof(newNodes) != 'array')
                this.insertNode(newNodes, parentElem, optionalInsertBefore);
            else {
                for (var i = 0, l = newNodes.length; i < l; i++) {
                    this.insertNode(newNodes[i], parentElem, optionalInsertBefore, true);
                }
            }
        },
        empty: function (node) {
            while (node.lastChild) node.removeChild(node.lastChild);
        },
        unescapeHtml: function (str) { //trick used to make HTMLentiites work inside textNodes
            if (str.length < 1) return str;
            var temp = document.createElement("div");
            str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
            temp.innerHTML = str;
            var result = temp.childNodes[0].nodeValue;
            this.empty(temp);
            return result;
        }
    };

    /**
     * 页面取色器
     */
    FeHelper.ColorPicker = (function () {

        if (!(document.documentElement instanceof HTMLElement)) {
            return;
        }

        var elmid1 = 'fehelper-colorpicker-box', elmid2 = 'fehelper-colorpicker-result';

        function _ge(n) {
            return document.getElementById(n);
        }

        var n = false, c = false, hex = 'F00BAF', lasthex = '', rgb = null;
        var hsv = null;
        var ex = 0, ey = 0, isEnabled = false, isLocked = false, hexIsLowerCase = false, borderValue = '1px solid #666',
            blankgif = '';
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
            while (node.lastChild) node.removeChild(node.lastChild);
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
                document.body.style.cursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAA8ElEQVRYCe1WAQ6DIAwsm//e9rP9jOU2z0CpyWhlcQkkpoCld15rVcQ5cs5ZRLZrXbuiXVynDj40SVDQkBKfshChZdBe6yaRUkolmF6X934xxxsSGm4lQqjq8CRBQa6cBCwK9Bk4LzMdVO8USizW129k47HwFtX43i0YjiOIkIDGRGV/2/EezKGydxHBZY2btWntbT8mIMRhOe7s7RFo3IvYFSZqonEekQqAIO5KpMJETVRfw+rugIWFd4pXdJI4MtttZXdGn+mgYP+vBBoPnoaWT9Zr3UpoYL3uIeImARA2W9oe4NI3RKIMFJlPElTvBRTxXFcOwvQSAAAAAElFTkSuQmCC) 16 16,crosshair';
                updateColorPreview();
            }, 255);
        }


        function setPixelPreview(pix, hxe, lhex) {
            if (isLocked) return;
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
            if (!n) return;
            hex = r.hex ? r.hex : hex;
            n.style.backgroundColor = '#' + hex;
            if (isLocked) setDisplay();
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
                    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAACwklEQVQ4Ea1US0tbQRg9kwmp8YXBi7hKyMZAcaFuFN26daFEUg1BEF24FQr9D/0BIqhbDe0/0I0LceNCQSIVIcZdLkrER2LUm6+caeZiEmkp7cDlMnfOOfM9zneB/7zUn/REJAEgXsfllVI/fscJvncoIhrAZwArrutGb25uoJRCb28vROQKwBqAr0opr5nfEqGIpGq12s7h4SH29vZQKpUMR2uN9vZ29PX1YWJiAsPDw7zkk1Iq+1a0QVBEkuVy+dvW1hYuLi58HKMLBoPo6uoyb+6j0ShmZmYQDodnlVLfLdgXFJGQ53nVjY0NnJ+fo1arMT2Do0BbWxs6OjoQCASMqOd5iMViSKVS0Fp/UEo9ExywygBWj4+PUSwWTWpDQ0MYHx/3jylE4cHBQSwuLiIUCqFQKODk5ISYVQt8K7jCujE1RtPf349kMomRkRGLRSKRwNTUlMng+dkEBHLYPAsyXRaRj9fX19H7+3sTBQ+Pjo5Miul0Gg8PD+aS6elp831/f9/ycXd3B3KpoZTKWdvEb29vfRBT4yKR0S4vL5uLTk9Psbu7619qCeQ6jkOv5t6mbM/Nm6J8WFfWj4sXsFG2WQ2E+sYK5nt6elrOHcfB/Py8sdDl5SUWFhZokxbROjdPASPI3B3Hueru7vZFCZqbm2N9sL29jc3NTVMv1pQdtpHSm+RSwxesq6yNjY35grQMm5TNZvHy8oKnpyesr6/Tc6bz3L++vmJ0dJQcjqJZLcamAP1F+7B2lUoFj4+PRpBRdXZ2mm9kDwwMYGlp6X1j0+la61lag2PF26vVqpkYToVdtBD38XgcmUyGYhy9X6YE4EdoCfw5eJ63wwk4ODiA67ool8tGhJhIJILJyUmwPFrrlp+D1Wl4c65F5IuIFFzXlbOzM8nlclIsFoXf6mehBlJ90xJhM+hvf7DN/H/e/wRZ4k9klRmUggAAAABJRU5ErkJggg==',
                    alt: 'Close',
                    title: '[esc]键可直接关闭',
                    id: 'fehelper-colorpicker-exitbtn',
                    event: ['click', dissableColorPickerFromHere, true]
                })
            ], n);
            if (_ge('fehelper-colorpicker-cphexvl')) _ge('fehelper-colorpicker-cphexvl').select();
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
            setTimeout(disableColorPicker, 500)
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
                if (c) document.body.removeChild(c);
                if (n) document.body.removeChild(n);
                c = false, n = false;
                document.body.style.cursor = '';
            }
        }

        function wk(ev) {
            if (!isEnabled) return;
            if (ev.keyCode == 27) {
                dissableColorPickerFromHere();
            } else if (ev.keyCode == 82 || ev.keyCode == 74) {//r or j refresh
                ssf();
            } else if (ev.keyCode == 13) {
                picked();
            }
        }

        function mmf(ev) {
            if (!isEnabled) return;
            if (!isLocked) {
                lx = (ev.pageX - pageXOffset), ly = (ev.pageY - pageYOffset);
                ex = Math.round(lx * x_cvs_scale),
                    ey = Math.round(ly * y_cvs_scale);
                updateColorPreview();
            }
        }

        function ssf(ev) {
            if (!isEnabled) return;
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
            initializeCanvas();
            remainingInit();
        }

        function enableColorPicker() {
            disableColorPicker();
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
                if (isLocked) picked();//unlocks for next pick
                document.body.style.cursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAYAAABX5MJvAAAA8ElEQVRYCe1WAQ6DIAwsm//e9rP9jOU2z0CpyWhlcQkkpoCld15rVcQ5cs5ZRLZrXbuiXVynDj40SVDQkBKfshChZdBe6yaRUkolmF6X934xxxsSGm4lQqjq8CRBQa6cBCwK9Bk4LzMdVO8USizW129k47HwFtX43i0YjiOIkIDGRGV/2/EezKGydxHBZY2btWntbT8mIMRhOe7s7RFo3IvYFSZqonEekQqAIO5KpMJETVRfw+rugIWFd4pXdJI4MtttZXdGn+mgYP+vBBoPnoaWT9Zr3UpoYL3uIeImARA2W9oe4NI3RKIMFJlPElTvBRTxXFcOwvQSAAAAAElFTkSuQmCC) 16 16,crosshair';
                isEnabled = true;
                setTimeout(newImage, 1);
                return false;
            }
            return true;
        }

        function keepOnScreen() {

            if (!n) return;
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
            if (!isEnabled) return;
            keepOnScreen();
            var data = ctx.getImageData(ex, ey, 1, 1).data;
            hsv = rgb2hsl(data[0], data[1], data[2]);
            rgb = {r: data[0], g: data[1], b: data[2]};
            setCurColor({hex: RGBtoHex(data[0], data[1], data[2])});
            handleRendering();
        }

        var isMakingNew = false, lastNewTimeout = 0;

        function newImage() {
            if (!isEnabled) return;
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
                    chrome.runtime.sendMessage({
                        type: 'fh-dynamic-any-thing',
                        thing:'color-picker-capture',
                        params: {
                            url: location.href
                        }
                    });
                } catch (e) {
                    console.log('有错误发生，可提交此反馈到官网！', e);
                }
            }, 255);
        }

        var lastPreviewURI;

        var icvs = 0, totalWidth = 150;//750

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

                ictx.fillRect(startPoint, 0, 1, totalWidth);
                ictx.fillRect(0, startPoint, totalWidth, 1);

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
                        if (++i >= startPoint) break;
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
                    if (mp < 1) mp = 1;
                    ictx.fillRect(spi + 1, 0, 1, totalWidth);
                    ictx.fillRect(smi - 1, 0, 1, totalWidth);
                    ictx.fillRect(0, spi + 1, totalWidth, 1);
                    ictx.fillRect(0, smi - 1, totalWidth, 1);
                }
            }

            lastPreviewURI = icvs.toDataURL();//the last one, large size, is cached for revisiting the menu

            var browseIconWidth = (devicePixelRatio > 1 ? 38 : 19);
            var browseIconHalfWidth = Math.floor(browseIconWidth * 0.5);

            var tmpCvs = document.createElement('canvas');
            tmpCvs.width = browseIconWidth, tmpCvs.height = browseIconWidth;
            var tctx = tmpCvs.getContext("2d");
            tctx.drawImage(icvs, startPoint - browseIconHalfWidth, startPoint - browseIconHalfWidth, browseIconWidth, browseIconWidth, 0, 0, browseIconWidth, browseIconWidth);
            var pathData = {};
            pathData[browseIconWidth] = tmpCvs.toDataURL();

            setPixelPreview(lastPreviewURI, hex, lasthex);

            isUpdating = false;
        }

        function getMain2dContext() {
            var context = icvs.getContext("2d");
            if (context) return context;
            else {
                initializeCanvas();
                return icvs.getContext("2d");
            }
        }

        function initializeCanvas() {
            icvs = document.createElement('canvas');//icon canvas
            icvs.width = totalWidth;
            icvs.height = totalWidth;
        }

        return function (request) {
            if (request.setPickerImage) {
                c.src = request.pickerImage;
            } else {
                enableColorPicker();
                picked();
            }
        };
    })();

    // 给background page直接调用的
    window.colorpickerNoPage = function (request) {
        FeHelper.ColorPicker(request)
    };
};
