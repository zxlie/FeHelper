/**
 * JSON排序处理
 * @author zhaoxianlie
 */
window.JsonABC = (function () {

    // Is a value an array?
    function isArray(val) {
        return Object.prototype.toString.call(val) === '[object Array]';
    }

    // Is a value an Object?
    function isPlainObject(val) {
        return Object.prototype.toString.call(val) === '[object Object]';
    }

    /**
     * 排序算法
     * @param un 需要排序的JSON
     * @param asc 是否正序
     * @param noarray 不包括数组，默认false
     * @returns {{}}
     */
    function sortObj(un, asc, noarray) {
        asc = asc !== -1 ? 1 : -1;
        noarray = noarray || false;

        let or = {};

        // 如果是BigInt的对象，则不参与排序
        if (typeof JSON.BigNumber === 'function' && un instanceof JSON.BigNumber) {
            return un;
        }

        if (isArray(un)) {
            // Sort or don't sort arrays
            if (noarray) {
                or = un;
            } else {
                or = un.sort();
            }

            or.forEach(function (v, i) {
                or[i] = sortObj(v, asc, noarray);
            });

            if (!noarray) {
                or = or.sort(function (a, b) {
                    a = (typeof a === 'object') ? JSON.stringify(a) : a;
                    b = (typeof b === 'object') ? JSON.stringify(b) : b;
                    return a < b ? -1 * asc : (a > b ? 1 * asc : 0);
                });
            }
        } else if (isPlainObject(un)) {
            or = {};
            Object.keys(un).sort(function (a, b) {
                if (a.toLowerCase() < b.toLowerCase()) return -1 * asc;
                if (a.toLowerCase() > b.toLowerCase()) return 1 * asc;
                return 0;
            }).forEach(function (key) {
                or[key] = sortObj(un[key], asc, noarray);
            });
        } else {
            or = un;
        }

        return or;
    }

    return {
        sortObj: sortObj
    };

})();
