"use strict";

/**
 * @param {string} source - Enhanced LaTeX source code.
 * @return {array} Items of this array can be __strings__ or __objects__.
 * __strings__ are for verbatim LaTeX that will be flushed to the output without any transformation. __objects__ provide the following attributes (only __name__ is mandatory):
 * * __name__: Name of the snippet.
 * * __arg__: The argument.
 * * __content__: An array coming from an Enhanced LaTeX parsing.
 */
module.exports = function( source ) {
    if( typeof source !== 'string') return [];
    
    var ctx = { source: source, pos: 0, output: [] };
    ctx.next = function() {
        if( this.pos < this.source.length ) {
            return this.source.charAt( this.pos++ );
        }
        return null;
    };
    ctx.match = function( pattern ) {
        if( typeof pattern === 'string') {
            return this.source.substr( this.pos, pattern.length ) == pattern;
        }
        return false;
    };
    var parsers = {
        arg: parseArg.bind( ctx ),
        main: parseMain.bind( ctx ),
        snippet: parseSnippet.bind( ctx ),
        comment: parseComment.bind( ctx )
    };
    var parserId = "main";
    var nextParser;
    var parser = parsers.main;
    var lastPos;
    var fusible = 1000;

    try {
        while( ctx.pos < source.length ) {
            lastPos = ctx.pos;
            nextParser = parser();
            if( lastPos >= ctx.pos ) {
                fusible--;
                if( fusible < 0 ) throw "Infinite loop risk!";
            }
            if( typeof nextParser === 'string' ) {
                if( nextParser !== parserId ) {
                    parserId = nextParser;
                    parser = parsers[parserId];
                }
            }
        }
    }
    catch( ex ) {
        /*
        ex = makeException( ctx, ex );
        console.error( JSON.stringify( ex, null, '  ' ) );
*/
        throw ex;
    }
    return ctx.output;
};


function parseMain() {
    var start = this.pos;
    var char;
    for( ;; ) {
        if( this.match( '{{' ) ) {
            // Is it the beginning of a snippet?
            this.output.push( this.source.substr( start, this.pos - start ) );
            this.pos += 2;
            return "snippet";
        }
        if( this.pos >= this.source.length ) break;
        switch( this.next() ) {
        case '\\':
            // Escape char.
            this.next();
            break;
        case '%':
            // Comments are skipped because LaTeX doesn't need to parse them.
            this.output.push( this.source.substr( start, this.pos - start - 1 ) );
            return "comment";
        }
    }
    this.output.push( this.source.substr( start ) );
    return null;
}

/**
 * Slip until end of line.
 */
function parseComment() {
    var char;
    while( null !== ( char = this.next() ) ) {
        if( char == '\n' ) {
            this.pos--;
            break;
        }
    }
    return "main";
}

var RX_NAME = /^([a-z0-9_\/.-]+)[ \t\n\r]*/i;

function parseSnippet() {
    var start = this.pos;
    var match = RX_NAME.exec( this.source.substr( this.pos ) );
    if( !match ) {
        // A snippet should start with '{{' followed by its name!
        this.pos = start;
        this.output.push( '{{' );
        return "main";
    }
    this.pos += match[0].length;
    this.snippet = {
        name: match[1].trim(),
        start: start
    };

    return "arg";
}

function parseArg() {
    if( this.match( '}}' )) {
        delete this.snippet.start;  // Cleanup.
        this.output.push( this.snippet );
        this.pos += 2;
        return "main";
    }

    this.pos = this.snippet.start;
    return "main";
}

/**
 * Make en enriched exception by adding the line number in it.
 */
function makeException( ctx, ex ) {
    var lineNumber = 1;
    var linePos = 0;     // Position relative to the current line.
    var pos = 0;         // Absolute position in the whole source.
    while( pos < ctx.pos ) {
        if( ctx.source.charAt( pos ) == '\n' ) {
            lineNumber++;
            linePos = pos;
        }
        pos++;
    }
    return {
        message: ex,
        source: ctx.source,
        line: lineNumber,
        pos: pos - linePos
    };
}
