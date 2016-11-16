"use strict";

var FS = require("fs");
var Path = require("path");
var Exec = require("child_process").exec;
var Timers = require("timers");

var Compiler = require("./lib/compiler");


function usage() {
    console.error( "===============================================" );
    console.error( "Usage:" );
    console.error( " > node latex-js file1.tex file2.tex -o output/" );
    console.error( " > node latex-js *.tex -o output/" );
    console.error( " > node latex-js file.tex" );
    console.error( " > node latex-js file.tex -w" );
    console.error();
    console.error( "Options:" );
    console.error( " -o : Output folder." );
    console.error( " -w : Watch mode. Recompile as soon as a file changed." );
    console.error( "===============================================" );
    process.exit( 1 );
}

function fatal(msg) {
    console.error();
    console.error( "FATAL ERROR!" );
    console.error();
    console.error( msg );
    console.error();
    usage();
}


if( process.argv.length < 3 ) usage();

var inputs = [];
var output = Path.resolve( "./out" );
var watchmode = false;
var arg;
var filename;

for( var argIdx = 2 ; argIdx < process.argv.length ; argIdx++ ) {
    arg = process.argv[argIdx];
    if( arg.charAt(0) == '-' ) {
        if( arg == '-o' ) {
            argIdx++;
            filename = Path.resolve( process.argv[argIdx] );
            if( !FS.existsSync( filename ) ) {
                fatal( "Output folder not found: " + filename + "!" );
            }
            output = filename;
        } else if( arg == '-w' ) {
            watchmode = true;
        } else {
            fatal( "Unknown option: " + arg + "!" );
        }
    } else {
        filename = Path.resolve( arg );
        if( !FS.existsSync( filename ) ) {
            fatal( "File not found: " + filename + "!" );
        }
        inputs.push( filename );
    }
}

if( !FS.existsSync( output ) ) {
    fatal( "The output folder does not exist: \"" + output + "\"!\nPlease create it and try again." );
}

inputs.forEach(function (input) {
    if( Path.normalize( Path.dirname( input ) ) == Path.normalize( output ) ) {
        fatal( "Output folder MUST NOT be the same as input folder!" );
    }
});

function compile( input ) {
    FS.readFile(input, function( error, stream ) {
        if( error ) {
            console.error( "Unable to read file " + JSON.stringify( input ) + "!");
            console.error( error );
        } else {
            var content = stream.toString();
            Compiler(
                content,
                Path.dirname( Path.resolve( input ) ),
                Path.join( output, Path.basename( input ) ),
                function(texfilename) {
                    var local = Path.resolve( '.' );
                    texfilename = texfilename.substr( local.length + 1 );
                    texfilename = texfilename.replace( /\\/g, '/' );
                    var cmd = "xelatex "
                            + "-output-directory=" + Path.dirname( texfilename )
                            + " \"" + texfilename + "\"";
                    console.log( "> " + cmd );
                    Exec( cmd, (error, stdout, stderr) => {
                        if( error ) {
                            console.error( "### " + error );
                        } else {
                            if( stderr ) {
                                console.error( "### TeX file has errors!" );
                                console.error( "### " + texfilename );
                                console.error( stderr );
                            } else {
                                stdout.split( "\n" ).forEach(function (line) {
                                    if( line.substr( 0, 14 ) == "Output written" ) {
                                        console.log( line );
                                    }
                                });
                            }
                        }
                    });
                }
            );
        }
    });
}

inputs.forEach( compile );

if( watchmode ) {
    var jobs = [];

    function processNextJob() {
        while( jobs.length > 0 ) {
            var input = jobs.shift();
            compile( input );
        }
        // No more jobs: go to sleep.
        Timers.setTimeout( processNextJob, 100 );
    }
    
    console.log();
    // Watch mode: we loop for ever and compile as soon as a file has changed.
    inputs.forEach(function (input) {
        console.log( "Watching " + input + "...\n" );
        var watcher = FS.watch( input );
        //watcher.path = Path.dirname( input );
        watcher.on( 'change', () => {
            if( jobs.indexOf( input ) == -1 ) {
                jobs.push( input );
            }
        });
    });

    processNextJob();
}
