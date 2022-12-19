window.qrcodeContentScript = function () {

    let decode = function (imgUrl) {

        function loadImage(src) {
            return new Promise(resolve => {
                let image = new Image();
                image.setAttribute('crossOrigin', 'Anonymous');
                image.src = src;
                image.onload = function () {
                    let width = this.naturalWidth;
                    let height = this.naturalHeight;
                    let canvas = document.createElement('canvas');
                    canvas.style.cssText = 'position:absolute;top:-10000px;left:-10000px';
                    document.body.appendChild(canvas);
                    canvas.setAttribute('id', 'qr-canvas');
                    canvas.height = height + 100;
                    canvas.width = width + 100;
                    let context = canvas.getContext('2d');
                    context.fillStyle = 'rgb(255,255,255)';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.drawImage(image, 0, 0, width, height, 50, 50, width, height);
                    resolve(canvas.toDataURL());
                };
                image.onerror = function () {
                    resolve(src);
                };
            });
        }

        loadImage(imgUrl).then(dataUrl => {

            chrome.runtime.sendMessage({
                type: 'fh-dynamic-any-thing',
                thing: 'qr-decode',
                params: {
                    uri: dataUrl || imgUrl
                }
            });
        });
    };

    return {decode}
};
