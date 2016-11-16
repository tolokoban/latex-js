"use strict";

var FS = require("fs");
var Path = require("path");


var Snippet = function(fd, content, dirname, output) {
    this._fd = fd;
    this._content = content;
    this._dirname = dirname;
    this._output = output;
    this._ctx = {
        flush: function( content ) {
            FS.writeSync( fd, content );
        }
    };
};


/**
 * @return void
 */
Snippet.prototype.exec = function(item) {
    var module = loadModule( item.name, this._dirname );
    if( typeof module !== 'function' ) {
        throw "Snippet " + JSON.stringify( item.name )
            + " must be a `function`!\n\n"
            + "module.exports = function() { ... };";
    }

    try {
        module.call( this._ctx );
    }
    catch( ex ) {
        console.error( "=========================================" );
        console.error( "An exception has been thrown from snippet\n" + JSON.stringify(  item, null, '  ' ) );
        console.error( "-----------------------------------------" );
        console.error( ex );
        console.error( "-----------------------------------------" );
    }
};


function loadModule(name, dirname) {
    try {
        var filename = Path.join( dirname, name );
        return require(filename);
    }
    catch( ex ) {
        throw "Unable to load snippet " + JSON.stringify( name )
            + " from directory " + JSON.stringify( dirname ) + "!\n"
            + "require('" + filename + "')\n\n" + ex;
    }
}

module.exports = Snippet;
