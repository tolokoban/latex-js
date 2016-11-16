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

    it('should parse snippets\' argument with simple type', function() {
        [
            ['{{x "tomate"}}', 'tomate'],
            ['{{x A}}', 'A'],
            ['{{x "P"}}', 'P'],
            ['{{x "toma\\tte"}}', 'toma\tte'],
            ['{{x "toma\\\"te"}}', 'toma"te'],
            ["{{x 'singlequote'}}", 'singlequote'],
            ['{{x y}}', 'y'],
            ['{{x Albert_le_fou!!}}', 'Albert_le_fou!!'],
            ['{{x 3}}', 3],
            ['{{x 666}}', 666],
            ['{{x 3.14}}', 3.14],
            ['{{x 27.11}}', 27.11],
            ['{{x .27}}', .27],
            ['{{x -3}}', -3],
            ['{{x -666}}', -666],
            ['{{x -3.14}}', -3.14],
            ['{{x -27.11}}', -27.11],
            ['{{x -.27}}', -.27],
            ['{{x true}}', true],
            ['{{x false}}', false],
            ['{{x null}}', null]
        ].forEach(function (itm) {
            var code = itm[0];
            var expected = itm[1];
            var result = Parser( code ).filter(function(x) {
                return typeof x !== 'string';
            }).map(function(x) { return x.arg; })[0];

            expect( result ).toBe( expected );
        });
    });

    it('should parse snippets\' argument with arrays', function() {
        [
            ['{{x [0]}}', [0]],
            ['{{x [[0,1],[2,[3]]]}}', [[0,1],[2,[3]]]],
            ['{{x ["A",2,"B",5]}}', ['A',2,'B',5]],
            ['{{x [A]}}', ['A']],
            ['{{x [0,1,2,3,4]}}', [0,1,2,3,4]],
            ['{{x []}}', []],
            ['{{x [ ]}}', []]
        ].forEach(function (itm) {
            var code = itm[0];
            var expected = itm[1];
            var result = Parser( code ).filter(function(x) {
                return typeof x !== 'string';
            }).map(function(x) { return x.arg; })[0];
            expect( result ).toEqual( expected );
        });
    });

    it('should parse snippets\' argument with object', function() {
        [
            ['{{x {a:5, b:[1,2,3]}}}', {a:5, b:[1,2,3]}],
            ['{{x {a:5}}}', {a:5}],
            ['{{x { bou :{x:5}}}}', {bou:{x:5}}],
            ['{{x {}}}', {}]
        ].forEach(function (itm) {
            var code = itm[0];
            var expected = itm[1];
            var result = Parser( code ).filter(function(x) {
                return typeof x !== 'string';
            }).map(function(x) { return x.arg; })[0];
            expect( result ).toEqual( expected );
        });
    });

});
