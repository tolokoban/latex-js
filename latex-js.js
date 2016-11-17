"use strict";

var FS = require("fs");
var Path = require("path");
var Exec = require("child_process").exec;
var Timers = require("timers");

var Compiler = require("./lib/compiler");

                    /*
                    var cmd = "xelatex -synctex=1 -interaction=nonstopmode "
                            + "-output-directory=" + Path.dirname( texfilename )
                            + " \"" + texfilename + "\"";
                     */
var PREDEFINED_COMMANDS = {
    //xelatex: 'xelatex -synctex=1 -interaction=nonstopmode -output-directory={{DIR}} {{FILE}}'
    xelatex: 'xelatex -synctex=1 -interaction=nonstopmode {{FILE}}'
};

function usage() {
    console.error( "===============================================" );
    console.error( "Usage:" );
    console.error( " > node latex-js file.tex" );
    console.error( " > node latex-js file1.tex file2.tex -ext out" );
    console.error( " > node latex-js *.tex -ext final" );
    console.error( " > node latex-js file.tex -w" );
    console.error();
    console.error( "Options:" );
    console.error( " -ext     : Extension for the output file. Default is \"ready\"." );
    console.error( " -watch   : Watch mode. Recompile as soon as a file changed." );
    console.error( " -post    : Command to execute after templating is done." );
    console.error( " -xelatex : Execute xelatex after templating is done." );
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
var extension = 'ready';
var watchmode = false;
var post;
var arg;
var filename;

for( var argIdx = 2 ; argIdx < process.argv.length ; argIdx++ ) {
    arg = process.argv[argIdx];
    if( arg.charAt(0) == '-' ) {
        if( arg == '-ext' ) {
            argIdx++;
            extension = process.argv[argIdx];
        } else if( arg == '-post' ) {
            argIdx++;
            post = process.argv[argIdx];
        } else if( arg == '-w' || arg == '-watch' ) {
            watchmode = true;
        } else {
            post = PREDEFINED_COMMANDS[arg.substr( 1 )];
            if( typeof post === 'undefined' )
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

/**
 * @param {string} input - Input filename.
 * @param {string} post - Command to execute after the templating.
 */
function compile( post, input ) {
    FS.readFile(input, function( error, stream ) {
        if( error ) {
            console.error( "Unable to read file " + JSON.stringify( input ) + "!");
            console.error( error );
        } else {
            var content = stream.toString();
            var filepathinfo = Path.parse( Path.resolve( input ) );
            filepathinfo.ext = "." + extension;
            delete filepathinfo.base;
            // `output` is `input` with antother extension.
            var output = Path.format( filepathinfo );
            if( input == output ) {
                fatal( "Input and output files have the same extension!" );
            }
            
            Compiler(
                content,
                Path.dirname( Path.resolve( input ) ),
                output,
                function(texfilename) {
                    console.log( "Done." );
                    if( !post ) return;
                    
                    var local = Path.resolve( '.' );
                    var cmd = '' + post;
                    cmd = cmd.replace(
                            /{{DIR}}/g,
                        JSON.stringify( Path.resolve( Path.dirname( texfilename ) ) )
                    ).replace( /{{FILE}}/g, JSON.stringify( Path.basename( texfilename ) ) );
                    console.log( "> " + cmd );
                    Exec( cmd, (error, stdout, stderr) => {
                        if( error ) {
                            console.error( "### " + error );
                            console.error( error.stack );
                            var filepathinfo = Path.parse( Path.resolve( input ) );
                            filepathinfo.ext = ".log";
                            delete filepathinfo.base;
                            var logfilename = Path.format( filepathinfo );
                            console.error( "See log file for more info: " + logfilename);
                            //console.error( FS.readFileSync( logfilename).toString() );
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

inputs.forEach( compile.bind( null, post ) );

if( watchmode ) {
    var jobs = [];

    function processNextJob() {
        while( jobs.length > 0 ) {
            var input = jobs.shift();
            compile( true, input );
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
