"use strict";

var FS = require("fs");

var Parser = require("./parser");
var Snippet = require("./snippet");


module.exports = function(content, dirname, output, callback) {
    console.log( "Compiling into " + output );
    
    if( typeof callback !== 'function') callback = function() {};
    
    var parsing = Parser( content );
    var index = 0;
    FS.open( output, 'w', function(error, fd) {
        if( error ) {
            console.error( "Unable to create output file " + JSON.stringify( output ) + "!");
            console.error( error );
            return;
        } 
        var snippet = new Snippet( fd, content, dirname, output );
        var idx, itm;
        for( idx=0 ; idx<parsing.length ; idx++) {
            itm = parsing[idx];
            if( typeof itm === 'string') {
                FS.writeSync( fd, itm );
            } else {
                snippet.exec( itm );
            }
        }
        // It's over.
        FS.close( fd, () => callback( output ) );
    });
};
