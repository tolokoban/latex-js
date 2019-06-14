
exports.changeExt = function( filename, newExtension ) {
    var pos = filename.lastIndexOf( '.' );
    if( pos == -1 ) return filename + "." + newExtension;
    return filename.substr( 0, pos ) + "." + newExtension;
};


var RX_PARAM = /{{([a-z]+)}}/gi;
exports.template = function( content, params ) {
    if( typeof params === 'undefined' ) return content;
    var match, value, out = '', index = 0;
    while( null != (match = RX_PARAM.exec( content )) ) {
        out += content.substr( index, match.index - index );
        value = params[match[1]];
        if( typeof value === 'undefined' ) value = match[0];
        out += value;
        index = match.index + match[0].length;
    }
    out += content.substr( index );
    return out;
};
