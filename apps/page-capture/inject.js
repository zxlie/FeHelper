/**
 * FeHelper Full Page Capture
 * @type {{scroll}}
 */
module.exports = (() => {

    function max(nums) {
        return Math.max.apply(Math, nums.filter(function (x) {
            return x;
        }));
    }

    function getPositions(callback) {

        let body = document.body,
            originalBodyOverflowYStyle = body ? body.style.overflowY : '',
            originalX = window.scrollX,
            originalY = window.scrollY,
            originalOverflowStyle = document.documentElement.style.overflow;

        if (body) {
            body.style.overflowY = 'visible';
        }

        let widths = [
                document.documentElement.clientWidth,
                body ? body.scrollWidth : 0,
                document.documentElement.scrollWidth,
                body ? body.offsetWidth : 0,
                document.documentElement.offsetWidth
            ],
            heights = [
                document.documentElement.clientHeight,
                body ? body.scrollHeight : 0,
                document.documentElement.scrollHeight,
                body ? body.offsetHeight : 0,
                document.documentElement.offsetHeight
            ],
            fullWidth = max(widths),
            fullHeight = max(heights),
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight,
            arrangements = [],
            // pad the vertical scrolling to try to deal with
            // sticky headers, 250 is an arbitrary size
            scrollPad = 200,
            yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
            xDelta = windowWidth,
            yPos = fullHeight - windowHeight,
            xPos,
            numArrangements;

        // During zooming, there can be weird off-by-1 types of things...
        if (fullWidth <= xDelta + 1) {
            fullWidth = xDelta;
        }

        // Disable all scrollbars. We'll restore the scrollbar state when we're done
        // taking the screenshots.
        document.documentElement.style.overflow = 'hidden';

        while (yPos > -yDelta) {
            xPos = 0;
            while (xPos < fullWidth) {
                arrangements.push([xPos, yPos]);
                xPos += xDelta;
            }
            yPos -= yDelta;
        }

        numArrangements = arrangements.length;

        function cleanUp() {
            document.documentElement.style.overflow = originalOverflowStyle;
            if (body) {
                body.style.overflowY = originalBodyOverflowYStyle;
            }
            window.scrollTo(originalX, originalY);
        }

        (function processArrangements() {
            if (!arrangements.length) {
                cleanUp();
                if (callback) {
                    callback();
                }
                return;
            }

            let next = arrangements.shift(),
                x = next[0], y = next[1];

            window.scrollTo(x, y);

            let data = {
                type: MSG_TYPE.PAGE_CAPTURE_CAPTURE,
                x: window.scrollX,
                y: window.scrollY,
                complete: (numArrangements - arrangements.length) / numArrangements,
                windowWidth: windowWidth,
                totalWidth: fullWidth,
                totalHeight: fullHeight,
                devicePixelRatio: window.devicePixelRatio
            };

            // Need to wait for things to settle
            window.setTimeout(function () {
                // In case the below callback never returns, cleanup
                let cleanUpTimeout = window.setTimeout(cleanUp, 1250);

                chrome.runtime.sendMessage(data, function (captured) {
                    window.clearTimeout(cleanUpTimeout);

                    if (captured) {
                        processArrangements();
                    } else {
                        cleanUp();
                    }
                });

            }, 150);
        })();
    }

    return {
        scroll: getPositions
    }

})();