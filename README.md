# latex-js
Produce PDF from LaTeX enhanced with snippets written in Javascript.

Snippets are added into your LaTeX file with the double curly syntax.

## Install
```
npm install -g latex-js
```

You need to have a LaTeX distribution installed with, at least, `xelatex`.

## Usage
This command will show you what arguments and options are expected.
```
latex-js
```

## Simple case
Here is an example of file written in __latex-js__:
```latex
\section{Example}
Hell world! My name is {{add-signature}}.
```

This is the simplest case. __latex-js__ will look for a module called `add.signature.js` in the same directory where the LaTeX file lies. It could look like this:

```javascript
module.exports = function() {
  this.flush("{\\Large Mister T.}");
};
```

And the result will obviously be:

```latex
\section{Example}
Hell world! My name is {\Large Mister T.}.
```

## Passing arguments
You can pass only one argument, but it is written in a JSON-like format, so you are free to pass any kind of structured data.

### Example 1
```latex
\section{Module tables}
{{mod-table 4}}
{{mod-table 7}}
```

```javascript
module.exports = function() {
    if( typeof this.arg !== 'number' ) {
        this.fatal( "A number is expected as argument!" );
    }

    var i, j;
    this.flush( "\begin{tabular}{|" );
    i = this.arg;
    while( i --> 0 ) this.flush( "c|" );
    this.flush( "}\n" );
    for( j=0 ; j<this.arg ; j++ ) {
        this.flush( "\\hline " );
        for( i=0 ; i<this.arg ; i++ ) {
            if( i>0 ) this.flush( " & " );
            this.flush( (i + j) % this.arg );
        }
        this.flush( "\\\\\n" );
    }
    this.flush( "\end{tabular}\n" );
};
```
### Example 2
```latex
\section{Module tables}
{{permutation [1, two, "three"]}}
```
> As you can see here, the only difference betwee real JSON and the JSON-like used in argument is that strings made by only chars and underscores can be used without quotes.

```javascript
module.exports = function() {
    var arr = this.arg;
    if( !Array.isArray( arr ) || arr.length != 3 ) {
        this.fatal( "An array of length 3 is expected as argument!" );
    }
    this.begin( "tabular", "{|c|c|c|}" );
    this.flush( "\\hline ", arr[0], "&", arr[1], "&", arr[2], "\\\n" );
    this.flush( "\\hline ", arr[0], "&", arr[2], "&", arr[1], "\\\n" );
    this.flush( "\\hline ", arr[1], "&", arr[0], "&", arr[2], "\\\n" );
    this.flush( "\\hline ", arr[2], "&", arr[0], "&", arr[1], "\\\n" );
    this.flush( "\\hline ", arr[1], "&", arr[2], "&", arr[0], "\\\n" );
    this.flush( "\\hline ", arr[2], "&", arr[1], "&", arr[0], "\\\n" );
    this.flush( "\\hline" );
    this.end( "itemize" );
};
```

## API
Snippets can access the __latex-js__ API through the `this` variable.

### flush( ... )
Write all the given arguments to the output file.

### fatal( msg : string )
Stop the snippet processing and displays `msg` as an error message.
If stuff has already been flushed to the output, it will __not__ be rollbacked.

### begin( env, ... )
This is equivalent to `this.flush( '\\begin{' + env + '}', ... );`.

### end( env )
This is equivalent to `this.flush( '\\end{' + env + '}' );`.

### escape( text ) : string
Return `text` with the following chars escaped: `& % $ # _ { } ~ ^ \`.
