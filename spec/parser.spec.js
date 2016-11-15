var Parser = require("../lib/parser");

describe('Module `parser`', function() {
    function chk( cases ) {
        cases.forEach(function (itm, idx) {
            if( !Array.isArray( itm ) ) itm = [itm, itm];
            var a = itm[0], b = itm.slice( 1 );
            expect( Parser(a) ).toEqual( b );
        });
    }

    it('should parse text without snippets in it', function() {
        chk([
            'Hello world!',
            '\section{Titre}',
            ['A comment % not very useful...',
             'A comment '],
            ['Multi line % hum...\ncomment.',
             'Multi line ', '\ncomment.'],
            ['Not a {{}} snippet',
             'Not a ', '{{', '}} snippet']
        ]);
    });
    
    it('should parse snippets without argument', function() {
        chk([
            ['My {{brother}} is here',
             'My ', {name: 'brother'}, ' is here'],
            ['My {{  brother}} is here',
             'My ', '{{', '  brother}} is here']
        ]);
    });

});
