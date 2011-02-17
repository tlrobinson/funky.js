var Funky = require("./funky");

[0,1,2,Infinity].forEach(function(backlog, n) {
    setTimeout(function() {
        console.log("==== backlog: " + backlog + " ====");
        var serialSetTimeout = Funky.serial(backlog, setTimeout, 0);
        [0,1,2,3,4].forEach(function(m) {
            // console.log("asdf")
            serialSetTimeout(function() { console.log(backlog + ":" + m); }, 500);
        });
    }, n*2000)
});
