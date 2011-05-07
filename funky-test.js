var Funky = require("./funky");

var DIVIDER = Array(41).join("=");

var tests = [];
[0,1,2,Infinity].forEach(function(backlog) {
    [0,1,2,Infinity].forEach(function(parallel) {
        tests.push({ backlog : backlog, parallel : parallel });
    });
});

var runTest = Funky.timeout(2000, function(test, done) {
    console.log(DIVIDER, test);
    var serialSetTimeout = Funky.serial(test.backlog, test.parallel, setTimeout, 0);
    [0,1,2,3,4].forEach(function(m) {
        serialSetTimeout(function() {
            console.log("  backlog=" + test.backlog + ", parallel=" + test.parallel + " => " + m);
        }, 200);
    });
});

Funky.forEach(tests, Funky.serial(function(test, done) {
    runTest(test, done);
}), function() {
    console.log("done");
});
