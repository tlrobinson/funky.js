// Copyright 2011 Thomas Robinson. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
//    1. Redistributions of source code must retain the above copyright notice, this list of
//       conditions and the following disclaimer.
//
//    2. Redistributions in binary form must reproduce the above copyright notice, this list
//       of conditions and the following disclaimer in the documentation and/or other materials
//       provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THOMAS ROBINSON ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THOMAS ROBINSON OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of Thomas Robinson.

(function(Funky) {

// Alias for converting arugments objects to arrays.
var toArray = Array.prototype.slice;

// Default parsing behavior:
/// Funky.foo([custom args, ...,] funk [, arg]);
function parseArgs(args) {
    var options = { args : toArray.call(args) };

    if (typeof options.args[options.args.length - 1] === "number")
        options.arg = options.args.pop();

    if (typeof options.args[options.args.length - 1] === "function")
        options.funk = options.args.pop();
    else
        throw new Error("Invalid Funky arguments: " + toArray.call(args))

    if (typeof options.arg !== "number")
        options.arg = options.funk.length - 1;

    return options;
}

// Ensures mutual exclusion of a single asynchronous function. Configurable callback and backlog.
Funky.serial = function() {
    var opts = parseArgs(arguments);
    opts.backlog = opts.args.length > 0 ? opts.args.shift() : Infinity;

    var pending = [];
    var running = false;
    function runNext() {
        if (pending.length === 0 || running) {
            return;
        }
        running = true;

        var next = pending.shift();
        var oldCallback = next.ARGS[opts.arg];
        next.ARGS[opts.arg] = newCallback;

        return opts.funk.apply(next.THIS, next.ARGS);

        function newCallback() {
            var result;
            if (typeof oldCallback === "function") {
                result = oldCallback.apply(this, arguments);
            }
            running = false;
            setTimeout(runNext, 0);
            return result;
        }
    }

    return function() {
        // check the length is less than the backlock, or there is none in progress
        if (pending.length < opts.backlog || !running) {
            pending.push({ THIS : this, ARGS : toArray.call(arguments) });
        } else {
            // console.warn("DROPPED!");
        }
        runNext();
    };
}
//
// Funky.throttle = function() {
//     var opts = parseArgs(arguments);
//     opts.delay = opts.args.length > 0 ? opts.args.shift() : 0;
//
//     var limit = new Date();
//     return function() {
//         var now = new Date();
//         console.log(limit, now)
//         if (now >= limit) {
//             limit = new Date(now.getTime() + opts.delay);
//             opts.funk.apply(this, arguments);
//         } else {
//             // TODO: is this the desired behavoir?
//             console.log("dropping");
//             var callback = arguments[opts.arg];
//             callback && callback();
//         }
//     };
// }

Funky.delayInvocation = function() {
    var opts = parseArgs(arguments);
    opts.delay = opts.args.length > 0 ? opts.args.shift() : 0;

    return function() {
        setTimeout(opts.funk.bind.apply([this].concat(arguments)), opts.delay);
    };
}

Funky.delayCompletion = function() {
    var opts = parseArgs(arguments);
    opts.delay = opts.args.length > 0 ? opts.args.shift() : 0;

    return function() {
        var args = toArray.call(arguments);

        var oldCallback = args[opts.arg];
        args[opts.arg] = newCallback;

        return opts.funk.apply(this, args);

        function newCallback() {
            setTimeout(function() {
                if (typeof oldCallback === "function") {
                    return oldCallback.apply(this, arguments);
                }
            }, opts.delay);
        }
    }
}

Funky.timeout = function() {
    var opts = parseArgs(arguments);
    opts.timeout = opts.args.length > 0 ? opts.args.shift() : 0;

    return function() {
        var args = toArray.call(arguments);

        var oldCallback = args[opts.arg];
        args[opts.arg] = newCallback;

        var hasFired = false;
        var timerID = setTimeout(newCallback, opts.timeout);

        return opts.funk.apply(this, args);

        function newCallback() {
            var result;
            if (!hasFired && typeof oldCallback === "function") {
                result = oldCallback.apply(this, arguments);
            }
            clearTimeout(timerID);
            hasFired = true;
            return result;
        }
    }
}

Funky.forEach = Funky.map = function(/* array[, callback], funk[, arg] */) {
    var opts = parseArgs(arguments);
    var array = toArray.call(opts.args.shift());
    var callback = opts.args.length > 0 ? opts.args.shift() : null;

    var result = [];

    if (array.length === 0) {
        callback && callback(result);;
        return;
    }

    var count = 0;
    array.forEach(function(item, index) {
        ++count;
        opts.funk(item, checkCompletion.bind(null, index))
    });

    function checkCompletion(index, value) {
        result[index] = value;
        if (--count) {
            callback && callback(result);;
        }
    };
}

// Funky.template = function() {
//     var opts = parseArgs(arguments);
//
//     return function() {
//         var args = toArray.call(arguments);
//         args[opts.arg]
//         return opts.funk.apply(this, args);
//     }
// }

})(typeof exports !== "undefined" ? exports : (Funky = {}));
