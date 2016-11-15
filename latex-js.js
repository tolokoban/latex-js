"use strict";

var FS = require("fs");
var Path = require("path");

var Compiler = require("./lib/compiler");


if( process.argv.length < 4 ) {
    console.error("===========================================");
    console.error(" Usage: node latex-js input.tex output.tex ");
    console.error("===========================================");
} else {
    var input = process.argv[2];
    if( !FS.existsSync( input ) ) {
        console.error("File not found: " + JSON.stringify( input ) );
    } else {
        var output = process.argv[3];
        FS.readFile(input, function( error, stream ) {
            if( error ) {
                console.error( "Unable to read file " + JSON.stringify( input ) + "!");
                console.error( error );
            } else {
                var content = stream.toString();
                Compiler( content, Path.dirname( input ), output, function() {
                    console.log( "Done!" );
                });
            }
        });
    }
}
