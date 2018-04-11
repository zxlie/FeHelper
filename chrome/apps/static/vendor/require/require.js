//
// This file is part of //\ Tarp.
//
// Copyright (C) 2013-2018 Torben Haase <https://pixelsvsbytes.com>
//
// Tarp is free software: you can redistribute it and/or modify it under the
// terms of the GNU Lesser General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// Tarp is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
// details.You should have received a copy of the GNU Lesser General Public
// License along with Tarp.  If not, see <http://www.gnu.org/licenses/>.
//
////////////////////////////////////////////////////////////////////////////////

// NOTE The load parameter points to the function, which prepares the
//      environment for each module and runs its code. Scroll down to the end of
//      the file to see the function definition.
(function () {
    "use strict";

    var cache, root;
    cache = Object.create(null);

    function getRoot() {
        var config = (self.Tarp && self.Tarp.require && self.Tarp.require.config) || {};
        root = {
            children: [],
            paths: config.paths || [(new URL("./node_modules/", location.href)).href],
            uri: config.uri || location.href
        };
        return root;
    }

    function load(id, pwd, asyn) {
        var matches, href, cached, request;
        // NOTE resolve href from id
        matches = id.match(/^((\.)?.*\/|)(.[^.]*|)(\..*|)$/);
        href = (new URL(
            matches[1] + matches[3] + (matches[3] && (matches[4] || ".js")),
            matches[2] ? pwd : root.paths[0] // TODO Can we get rid of this check with more intelligent pwd setting in the engine?
        )).href;

        // NOTE create cache item if required
        cached = cache[href] = cache[href] || {
            e: undefined, // error
            m: undefined, // module
            p: undefined, // promise
            r: undefined, // request
            s: undefined, // source
            t: undefined, // type
            u: href, // url
        };
        if (!cached.p) {
            cached.p = new Promise(function (res, rej) {
                request = cached.r = new XMLHttpRequest();
                request.onload = request.onerror = request.ontimeout = function () {
                    var tmp, done, pattern, match, loading = 0;
                    // `request` might have been changed by line 60ff
                    if (request = cached.r) {
                        cached.r = null;
                        if ((request.status > 99) && ((href = request.responseURL) != cached.u)) {
                            if (cache[href]) {
                                cached = cache[cached.u] = cache[href];
                                cached.p.then(res, rej);
                                // NOTE Replace pending request of actual module with the already completed request and abort the
                                //      pending request.
                                if (cached.r) {
                                    tmp = cached.r;
                                    cached.r = request;
                                    tmp.abort();
                                    tmp.onload();
                                }
                                return;
                            }
                            else {
                                cache[href] = cached;
                            }
                        }
                        if ((request.status > 99) && (request.status < 400)) {
                            cached.s = request.responseText;
                            cached.t = request.getResponseHeader("Content-Type");
                            done = function () {
                                if (--loading < 0) res(cached);
                            };
                            // NOTE Pre-load submodules if the request is asynchronous (timeout > 0).
                            if (request.timeout) {
                                // TODO Write a real parser that returns all modules that are preloadable
                                pattern = /require(?:\.resolve)?\((?:"((?:[^"\\]|\\.)+)"|'((?:[^'\\]|\\.)+)')\)/g;
                                while ((match = pattern.exec(cached.s)) !== null) {
                                    // NOTE Only add modules to the loading-queue that are still pending
                                    if ((tmp = load(match[1] || match[2], href, true)).r) {
                                        loading++;
                                        tmp.p.then(done, done);
                                    }
                                }
                            }
                            done();
                        }
                        else {
                            rej(cached.e = new Error(href + " " + request.status));
                        }
                    }
                };
            });
        }
        // NOTE `request` is only defined if the module is requested for the first time.
        if (request = request || (!asyn && cached.r)) {
            try {
                request.abort();
                request.timeout = asyn ? 10000 : 0;
                request.open("GET", href, asyn);
                request.send();
            }
            catch (e) {
                request.onerror();
            }
        }
        if (cached.e)
            throw cached.e;
        return cached;
    }

    function evaluate(cached, parent) {
        var module;
        if (!cached.m) {
            module = cached.m = {
                children: new Array(),
                exports: Object.create(null),
                filename: cached.u,
                id: cached.u,
                loaded: false,
                parent: parent,
                paths: parent.paths.slice(),
                require: undefined,
                uri: cached.u
            },
                module.require = factory(module);
            parent.children.push(module);
            if (cached.t == "application/json")
                module.exports = JSON.parse(cached.s);
            else
                (new Function(
                    "exports,require,module,__filename,__dirname",
                    cached.s + "\n//# sourceURL=" + module.uri
                ))(module.exports, module.require, module, module.uri, module.uri.match(/.*\//)[0]);
            module.loaded = true;
        }
        return cached.m;
    }

    function factory(parent) {
        function requireEngine(mode, id, asyn) {

            parent = parent === -1 ? getRoot() : parent;

            function afterLoad(cached) {
                var regex = /package\.json$/;
                if (regex.test(cached.u) && !regex.test(id)) {
                    parent = evaluate(cached, parent);
                    return requireEngine(mode, parent.exports.main, asyn);
                }
                else if (mode === 1)
                    return cached.u;
                else if (mode === 2)
                    return [id[0] === "." ? parent.uri.match(/.*\//)[0] : root.uri]; // TODO Can this be cleaned up?
                else
                    return evaluate(cached, parent).exports;
            }

            return asyn ?
                new Promise(function (res, rej) {
                    load(id, parent.uri, asyn).p.then(afterLoad).then(res, rej);
                }) :
                afterLoad(load(id, parent.uri, asyn));
        }

        var require = requireEngine.bind(undefined, 0);
        require.resolve = requireEngine.bind(require, 1);
        require.resolve.paths = requireEngine.bind(require.resolve, 2);
        return require;
    }

    (self.Tarp = self.Tarp || {}).require = factory(-1);
})();
