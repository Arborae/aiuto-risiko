// Logica pura dell'aiuto partita: nessun accesso alla pagina, si prova con node (test.js).
(function (radice) {
  'use strict';

  const TOTALE_TERRITORI = 42;
  const DOTAZIONE = { 3: 35, 4: 30, 5: 25, 6: 20 };

  const CONTINENTI = [
    { id: 'asia', nome: 'Asia', bonus: 7, territori: 12 },
    { id: 'europa', nome: 'Europa', bonus: 5, territori: 7 },
    { id: 'nordamerica', nome: 'Nord America', bonus: 5, territori: 9 },
    { id: 'africa', nome: 'Africa', bonus: 3, territori: 6 },
    { id: 'sudamerica', nome: 'Sud America', bonus: 2, territori: 4 },
    { id: 'oceania', nome: 'Oceania', bonus: 2, territori: 4 }
  ];

  const TRIS = [
    { id: 'cannoni', nome: '3 cannoni', armate: 4 },
    { id: 'fanti', nome: '3 fanti', armate: 6 },
    { id: 'cavalieri', nome: '3 cavalieri', armate: 8 },
    { id: 'misto', nome: 'fante + cannone + cavaliere', armate: 10 },
    { id: 'jolly', nome: 'jolly + 2 carte uguali', armate: 12 }
  ];

  // L'ordine di gioco è in senso orario e il primo è il mazziere.
  // Le carte partono dal giocatore alla destra del mazziere (l'ultimo dell'ordine)
  // e girano in senso antiorario, quindi l'ordine di gioco al contrario.
  function ordineDistribuzione(n, mazziere) {
    const m = mazziere || 0;
    const giro = [];
    for (let k = 0; k < n; k++) giro.push(((m - 1 - k) % n + n) % n);
    return giro;
  }

  // Quanti territori tocca a ogni giocatore (indici nell'ordine di gioco).
  function territoriPerGiocatore(n, mazziere) {
    if (n < 3 || n > 6) throw new Error('Servono da 3 a 6 giocatori');
    const conti = new Array(n).fill(0);
    const giro = ordineDistribuzione(n, mazziere);
    for (let c = 0; c < TOTALE_TERRITORI; c++) conti[giro[c % n]]++;
    return conti;
  }

  function dotazione(n) {
    return DOTAZIONE[n];
  }

  // Armate ancora da piazzare dopo averne messa una su ogni territorio.
  function armateDaPiazzare(n, mazziere) {
    return territoriPerGiocatore(n, mazziere).map(t => DOTAZIONE[n] - t);
  }

  // Prossimo giocatore (dall'indice "da", compreso) che ha ancora armate; -1 se finite.
  function prossimoConArmate(restanti, da) {
    const n = restanti.length;
    for (let k = 0; k < n; k++) {
      const i = (da + k) % n;
      if (restanti[i] > 0) return i;
    }
    return -1;
  }

  // Un giro di piazzamento: chi è di turno mette fino a 3 armate.
  function piazza(restanti, turno) {
    const r = restanti.slice();
    const messe = Math.min(3, r[turno]);
    r[turno] -= messe;
    return { restanti: r, messe, turno: prossimoConArmate(r, (turno + 1) % r.length) };
  }

  function valoreTris(id) {
    const t = TRIS.find(x => x.id === id);
    return t ? t.armate : 0;
  }

  // territori: numero · continenti: elenco di id · tris: id o '' · carteMie: 0-3
  function rinforzi(territori, continenti, tris, carteMie) {
    const base = Math.floor(Math.max(0, territori || 0) / 3);
    const cont = (continenti || []).reduce((s, id) => {
      const c = CONTINENTI.find(x => x.id === id);
      return s + (c ? c.bonus : 0);
    }, 0);
    const carte = tris ? valoreTris(tris) + 2 * Math.min(3, Math.max(0, carteMie || 0)) : 0;
    return { base, continenti: cont, carte, totale: base + cont + carte };
  }

  function dadiMassimiAttacco(armate) {
    return Math.max(0, Math.min(3, (armate || 0) - 1));
  }

  function dadiMassimiDifesa(armate) {
    return Math.max(0, Math.min(3, armate || 0));
  }

  // Confronto dal più alto al più basso; a parità vince chi difende.
  function confronta(attacco, difesa) {
    const a = attacco.slice().sort((x, y) => y - x);
    const d = difesa.slice().sort((x, y) => y - x);
    const coppie = Math.min(a.length, d.length);
    let persiAttacco = 0, persiDifesa = 0;
    const dettagli = [];
    for (let i = 0; i < coppie; i++) {
      const vinceAttacco = a[i] > d[i];
      if (vinceAttacco) persiDifesa++; else persiAttacco++;
      dettagli.push({ attacco: a[i], difesa: d[i], vinceAttacco });
    }
    return { attacco: a, difesa: d, persiAttacco, persiDifesa, dettagli };
  }

  function lancia(quanti, caso) {
    const r = caso || Math.random;
    const dadi = [];
    for (let i = 0; i < quanti; i++) dadi.push(1 + Math.floor(r() * 6));
    return dadi;
  }

  const api = {
    TOTALE_TERRITORI, DOTAZIONE, CONTINENTI, TRIS,
    ordineDistribuzione, territoriPerGiocatore, dotazione, armateDaPiazzare,
    prossimoConArmate, piazza, valoreTris, rinforzi,
    dadiMassimiAttacco, dadiMassimiDifesa, confronta, lancia
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else radice.Logica = api;
})(this);
