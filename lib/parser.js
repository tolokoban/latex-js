"use strict";

var RX_NAME = /^([a-z0-9_\/.-]+)[ \t\n\r]*/i;
var RX_NUMBER = /^-?(\.[0-9]+|[0-9]+(\.[0-9]+)?)+/;
var RX_FREE_STR = /^[^0-9"'\[\],}{:-][^\]:,} \t\n\r]*/i;

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
        } else if( typeof pattern.exec === 'function' ) {
            var match = pattern.exec( this.source.substr( this.pos ) );
            if( match ) {
                return match[0];
            }
        }
        return false;
    };
    ctx.skipSpaces = function() {
        var spaces = " \t\n\r";
        while( this.pos < this.source.length && spaces.indexOf( this.source.charAt( this.pos ) ) > -1 ) {
            this.pos++;
        }
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
    this.skipSpaces();
    if( this.match( '}}' )) {
        delete this.snippet.start;  // Cleanup.
        this.output.push( this.snippet );
        this.pos += 2;
        return "main";
    }

    try {
        this.snippet.arg = parseValue.call( this );
        if( typeof this.snippet.arg === 'undefined' ) {
            // There is a bug in
            this.pos = this.snippet.start;
            return "main";
        }
        this.skipSpaces();
        if( !this.match( '}}' ) ) {
            this.pos = this.snippet.start;
        } else {
            delete this.snippet.start;  // Cleanup.
            this.output.push( this.snippet );
            this.pos += 2;
        }
    }
    catch( ex ) {
        this.pos = this.snippet.start;
    }
    return "main";
}

function parseValue() {
    this.skipSpaces();
    if( this.match( 'true' ) ) {
        this.pos += 4;
        return true;
    }
    if( this.match( 'false' ) ) {
        this.pos += 5;
        return false;
    }
    if( this.match( 'null' ) ) {
        this.pos += 4;
        return null;
    }
    var item = this.match( RX_NUMBER );
    if( item ) {
        this.pos += item.length;
        return parseFloat( item );
    }
    item = this.match( RX_FREE_STR );
    if( item ) {
        this.pos += item.length;
        return item;
    }
    item = this.next();
    switch( item ) {
    case '"':
    case "'":
        return parseString.call( this, item );
    case '[': return parseArray.call( this );
    case '{': return parseObject.call( this );
    }

    return undefined;
}

function parseArray() {
    this.skipSpaces();
    var out = [];
    if( this.match( ']' ) ) {
        this.next();
        return out;
    }
    var item;
    var char;
    for(;;) {
        item = parseValue.call( this );
        if( typeof item === 'undefined') return undefined;
        out.push( item );
        this.skipSpaces();
        char = this.next();
        if( char == ']' ) return out;
        if( char != ',' ) break;
    }
    return undefined;
}

function parseObject() {
    this.skipSpaces();
    var out = {};
    if( this.match( '}' ) ) {
        this.next();
        return out;
    }
    var key, val;
    var char;
    for(;;) {
        key = parseValue.call( this );
        if( typeof key === 'undefined') return undefined;
        this.skipSpaces();
        char = this.next();
        if( char != ':' ) break;
        val = parseValue.call( this );
        out[key] = val;
        this.skipSpaces();
        char = this.next();
        if( char == '}' ) return out;
        if( char != ',' ) break;
    }
    return undefined;
}

function parseString( quote ) {
    var out = '';
    var char;
    while(null != (char = this.next() ) ) {
        if( char == quote ) return out;
        if( char == '\\' ) {
            char = this.next();
            switch( char ) {
            case 'n': out += "\n"; break;
            case 't': out += "\t"; break;
            case 'r': out += "\r"; break;
            default: out += char;
            }
        } else {
            out += char;
        }
    }
    return undefined;
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
