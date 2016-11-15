# latex-js
LaTeX enhanced with snippets written in Javascript.

Snippets are added into your LaTeX file with the double curly syntax:

```latex
\section{Example}
Hell world! My name is {{add-signature}}.
```

This is the simplest case. `latex-js` will look for a module called `add.signature.js` in the same directory where the LaTeX file lies. It could look like this:

```javascript
module.exports = function() {
  this.flush("{\Large Mister T.}");
};
```

