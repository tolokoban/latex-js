/**
 * @param {nombre} total - Somme totale à régler.
 * @param {tableau} coins - Tableau des valeurs des différentes pièces,
 *                          rangées par ordre décroissant.
 */
function money( total, coins ) {
   var result = [];
   var index = 0;
   while( total > 0 ) {
      while( index < coins.length && coins[index] > total ) index++;
      if( index >= coins.length ) break;
      result.push( coins[index] );
      total -= coins[index];        
   }
   return result;
}
