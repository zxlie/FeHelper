window.Tracker = window.Tracker || {};
/**
 * Tracker.Promise
 */
Tracker.Promise = function () {
    var concat = [].concat;

    var promise = function () {
        var list;

        list = this.list = arguments.length ?
            concat.apply([], arguments[0]) : null;
        this.resolves = [];
        this.rejects = [];
        this.resolveValues = [];
        this.rejectValues = [];
        this.parents = [];
        this.state = "pending";
        this.fired = false;

        if (list)
            for (var i = 0, l = list.length; i < l; i++)
                list[i].parents.push(this);
    };

    promise.prototype = {
        resolve: function (arg) {
            if (this.state == "pending")
                this.state = "resolved",
                    this.resolveValues = concat.apply([], arguments)
            this.fire();
        },

        reject: function (arg) {
            if (this.state == "pending")
                this.state = "rejected",
                    this.rejectValues = concat.apply([], arguments)
            this.fire();
        },

        then: function (resolved, rejected) {
            if (resolved)
                this.resolves.push(resolved);

            if (rejected)
                this.rejects.push(rejected);

            if (this.fired)
                switch (this.state) {
                    case "resolved":
                        resolved &&
                        resolved.apply(null, this.resolveValues);
                        break;
                    case "rejected":
                        rejected &&
                        rejected.apply(null, this.rejectValues);
                }
            else
                this.fire();

            return this;
        },

        fire: function () {
            var callbacks, values, list = this.list, allResolved = true,
                allResolveValues, parents;

            if (this.fired)
                return;

            if (list && this.state == "pending") {
                allResolveValues = [];

                for (var i = 0, l = list.length; i < l; i++) {
                    switch (list[i].state) {
                        case "pending":
                            allResolved = false;
                            break;
                        case "resolved":
                            allResolveValues[i] =
                                list[i].resolveValues[0];
                            break;
                        case "rejected":
                            return this.reject(list[i].rejectValues[0]);
                    }
                }
                if (allResolved)
                    return this.resolve(allResolveValues);
            }

            if (this.state == "pending")
                return;

            if (this.state == "resolved")
                callbacks = this.resolves,
                    values = this.resolveValues;
            else if (this.state == "rejected")
                callbacks = this.rejects,
                    values = this.rejectValues;

            for (var i = 0, l = callbacks.length; i < l; i++)
                callbacks[i].apply(null, values);

            this.fired = true;

            parents = this.parents;
            for (var i = 0, l = parents.length; i < l; i++)
                parents[i].fire();
        }
    };

    promise.when = function () {
        return new promise(arguments);
    };

    promise.fuze = function () {
        var queue = [], fn, infire, args;

        fn = function (process) {
            infire ? process() : queue.push(process);
        };

        fn.fire = function () {
            while (queue.length)
                queue.shift().apply(null, arguments);
            fn.fired = infire = true;
        };

        return fn;
    };

    return promise;
}();