// Prove della logica: node test.js
'use strict';
const assert = require('assert');
const L = require('./logica.js');

for (let n = 3; n <= 6; n++) {
  for (let m = 0; m < n; m++) {
    const t = L.territoriPerGiocatore(n, m);
    assert.strictEqual(t.reduce((a, b) => a + b, 0), 42, `totale con ${n}`);
    assert.ok(Math.max(...t) - Math.min(...t) <= 1, `equilibrio con ${n}`);
  }
}

// Esempio: ordine Maria, B, Anthony, Anna; Maria mazziera.
const nomi = ['Maria', 'B', 'Anthony', 'Anna'];
const t4 = L.territoriPerGiocatore(4, 0);
const per = Object.fromEntries(nomi.map((x, i) => [x, t4[i]]));
assert.deepStrictEqual(per, { Maria: 10, B: 10, Anthony: 11, Anna: 11 });
assert.deepStrictEqual(L.ordineDistribuzione(4, 0).map(i => nomi[i]), ['Anna', 'Anthony', 'B', 'Maria']);

// 3 giocatori: 14 a testa; 5: 9,9,8,8,8 a partire da destra; 6: 7 a testa.
assert.deepStrictEqual(L.territoriPerGiocatore(3, 0), [14, 14, 14]);
assert.deepStrictEqual(L.territoriPerGiocatore(5, 0), [8, 8, 8, 9, 9]);
assert.deepStrictEqual(L.territoriPerGiocatore(6, 0), [7, 7, 7, 7, 7, 7]);

// Armate
assert.deepStrictEqual([3, 4, 5, 6].map(L.dotazione), [35, 30, 25, 20]);
assert.deepStrictEqual(L.armateDaPiazzare(4, 0), [20, 20, 19, 19]);
for (let n = 3; n <= 6; n++) {
  let r = L.armateDaPiazzare(n, 0), turno = 0, messe = 0, giri = 0;
  while (turno !== -1) { const p = L.piazza(r, turno); messe += p.messe; r = p.restanti; turno = p.turno; giri++; }
  assert.strictEqual(messe, n * L.dotazione(n) - 42);
  assert.ok(r.every(x => x === 0));
}
// Primo giro in 4: Maria mette 3, poi tocca a B
let p = L.piazza([20, 20, 19, 19], 0);
assert.deepStrictEqual(p.restanti, [17, 20, 19, 19]); assert.strictEqual(p.turno, 1);
p = L.piazza([0, 1, 0, 2], 1);
assert.deepStrictEqual(p.restanti, [0, 0, 0, 2]); assert.strictEqual(p.messe, 1); assert.strictEqual(p.turno, 3);

// Rinforzi
assert.strictEqual(L.rinforzi(11, [], '', 0).totale, 3);
assert.strictEqual(L.rinforzi(14, ['asia', 'oceania'], '', 0).totale, 4 + 9);
assert.strictEqual(L.rinforzi(9, [], 'misto', 2).totale, 3 + 10 + 4);
assert.strictEqual(L.rinforzi(2, [], 'jolly', 0).totale, 12);
assert.strictEqual(L.rinforzi(2, [], '', 3).totale, 0);

// Dadi
assert.strictEqual(L.dadiMassimiAttacco(1), 0);
assert.strictEqual(L.dadiMassimiAttacco(3), 2);
assert.strictEqual(L.dadiMassimiAttacco(10), 3);
assert.strictEqual(L.dadiMassimiDifesa(2), 2);
let c = L.confronta([6, 3, 4], [4, 4]);
assert.deepStrictEqual([c.persiAttacco, c.persiDifesa], [1, 1]); // 6>4, 4=4 difensore
c = L.confronta([2], [6, 1, 1]);
assert.deepStrictEqual([c.persiAttacco, c.persiDifesa], [1, 0]);
c = L.confronta([5, 5, 5], [5, 4, 4]);
assert.deepStrictEqual([c.persiAttacco, c.persiDifesa], [1, 2]);
assert.ok(L.lancia(3).every(d => d >= 1 && d <= 6));

console.log('Tutte le prove passano.');
