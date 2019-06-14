/**
 * On  attend  un tableau  de  nombres.  Le  premier  est la  somme  à
 * payer. Les autres sont les valeurs des pièces dont on dispose.
 */
module.exports = function() {
    var total = this.arg.shift();
    var coins = this.arg.slice();
    var result = { total: [], coins: [] };
    var index = 0;

    while( total > 0 ) {
        while( index < coins.length && coins[index] > total ) index++;
        if( index >= coins.length ) break;
        result.total.push( total );
        result.coins.push( coins[index] );
        total -= coins[index];        
    }
    this.flush( '\n\n\\vspace{2mm}' );
    this.flush( '\\noindent Pièces disponibles: ', coins.join(', '), '.\n\n\\noindent' );
    this.begin( 'tabular', '{|l' + this.mul( 'c', result.total.length ) + '|}' );
    this.flush( '\\hline ' );
    this.flush( 'Somme restante ' );
    result.total.forEach(function (value) {
        this.flush( '&', value );
    }, this);
    this.newline();
    this.flush( 'Pièce utilisée ' );
    result.coins.forEach(function (value) {
        this.flush( '&', value );
    }, this);
    this.newline();
    this.flush( '\\hline' );
    this.end( 'tabular' );
    this.flush( '\n\n\\vspace{2mm}' );
};
