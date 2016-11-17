"use strict";

var FS = require("fs");
var Path = require("path");

var ESCAPE = "&%$#_{}~^\\";

var Snippet = function(fd, content, dirname, output) {
    var that = this;

    this._fd = fd;
    this._content = content;
    this._dirname = dirname;
    this._output = output;
    this._buff = '';
    this._ctx = {
        flush: function() {
            var i, arg;
            for (i = 0 ; i < arguments.length ; i++) {
                arg = arguments[i];
                that._buff += '' + arg;
            }
        },
        fatal: function( msg ) {
            throw Error( msg );
        },
        newline: function() {
            that._buff += "\\\\\n";
        },
        begin: function( env ) {
            that._buff += "\\begin{" + env + "}";
            var i, arg;
            for (i = 1 ; i < arguments.length ; i++) {
                arg = arguments[i];
                that._buff += arg;
            }
        },
        end: function( env ) {
            that._buff += "\\end{" + env + "}";
        },
        mul: function( txt, times ) {
            var out = '';
            while( times --> 0 ) {
                out += txt;
            }
            return out;
        },
        escape: function( verbatim ) {
            var out = '';
            var pos = 0;
            var idx = 0;
            var chr;
            while( idx < verbatim.length ) {
                chr = verbatim.charAt( idx );
                if( ESCAPE.indexOf( chr ) != -1 ) {
                    out += verbatim.substr( pos, idx - pos ) + "\\" + chr;
                    out = idx + 1;
                }
                idx++;
            }
            out += verbatim.substr( pos );
            return out;
        }
    };
};


/**
 * @return void
 */
Snippet.prototype.exec = function(item) {
    try {
        var module = loadModule( item.name, this._dirname );
        if( typeof module !== 'function' ) {
            throw "Snippet " + JSON.stringify( item.name )
                + " must be a `function`!\n\n"
                + "module.exports = function() { ... };";
        }
        this._ctx.pos = item.pos;
        this._ctx.arg = item.arg;
        module.call( this._ctx );
        FS.writeSync( this._fd, this._buff );
    }
    catch( ex ) {
        var err = "=========================================\n"
                + "An exception has been thrown from snippet\n"
                + JSON.stringify(  item, null, '  ' ) + "\n"
                + "-----------------------------------------\n"
                + ex.toString() + "\n"
                + "-----------------------------------------\n"
                + ex.stack + "\n"
                + "-----------------------------------------\n";
        console.error( err );
        FS.writeSync( this._fd, "\n\n\\begin{verbatim}" + err + "\\end{verbatim}\n\n" );
    }
    this._buff = '';
};


function loadModule(name, dirname) {
    try {
        var filename = Path.join( dirname, name );
        return require(filename);
    }
    catch( ex ) {
        throw "Unable to load snippet " + JSON.stringify( name )
            + " from directory " + JSON.stringify( dirname ) + "!\n"
            + "require('" + filename + "')\n\n" + ex.stack;
    }
}

module.exports = Snippet;
