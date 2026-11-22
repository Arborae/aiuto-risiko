// Interfaccia dell'aiuto partita. Lo stato sta in localStorage; "Nuova partita" lo azzera.
(function () {
  'use strict';
  const L = window.Logica;
  const CHIAVE = 'aiuto-risiko-v1';
  const COLORI = [
    { id: 'giallo', nome: 'Giallo' }, { id: 'rosso', nome: 'Rosso' }, { id: 'nero', nome: 'Nero' },
    { id: 'viola', nome: 'Viola' }, { id: 'blu', nome: 'Blu' }, { id: 'verde', nome: 'Verde' }
  ];
  const PASSI = ['Le carte', 'Gli obiettivi', 'I territori', 'Le armate', 'Il mazzo'];
  const FASI = [
    'Rinforzi: calcola e piazza le armate nuove',
    'Attacchi: quanti vuoi, verso territori confinanti',
    'Spostamento: uno solo, facoltativo',
    'Pesca una carta, se hai conquistato almeno un territorio'
  ];

  const app = document.getElementById('app');
  let stato = carica() || nuovoStato();

  function nuovoStato() {
    return {
      fase: 'giocatori',
      giocatori: [
        { nome: '', colore: 'giallo' }, { nome: '', colore: 'rosso' }, { nome: '', colore: 'blu' }
      ],
      passo: 0,
      piazz: null,
      partita: null
    };
  }
  function carica() {
    try { const s = JSON.parse(localStorage.getItem(CHIAVE)); return s && s.giocatori ? s : null; }
    catch (e) { return null; }
  }
  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(stato)); } catch (e) { /* senza memoria si gioca lo stesso */ }
  }

  // --- utilità
  function el(tag, attr, ...figli) {
    const e = document.createElement(tag);
    for (const k in (attr || {})) {
      const v = attr[k];
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const f of figli.flat()) if (f != null && f !== false) e.append(f.nodeType ? f : String(f));
    return e;
  }
  const nomeDi = (i) => stato.giocatori[i].nome.trim() || `Giocatore ${i + 1}`;
  const pallino = (i) => el('span', { class: 'pallino', style: `background:var(--${stato.giocatori[i].colore})`, 'aria-hidden': 'true' });
  const n = () => stato.giocatori.length;
  function vai(cambia, inCima) { cambia(); salva(); disegna(); if (inCima) window.scrollTo({ top: 0 }); }

  function disegna() {
    app.replaceChildren();
    if (stato.fase === 'giocatori') app.append(...schermoGiocatori());
    else if (stato.fase === 'prep') app.append(...schermoPreparazione());
    else app.append(...schermoPartita());
  }

  // --- 1. giocatori
  function schermoGiocatori() {
    const g = stato.giocatori;
    const righe = g.map((p, i) => {
      const usati = g.filter((_, j) => j !== i).map(x => x.colore);
      return el('div', { class: 'giocatore' },
        el('div', { class: 'ordine' },
          el('button', { type: 'button', class: 'btn secondario', 'aria-label': `Sposta su ${nomeDi(i)}`, disabled: i === 0,
            onclick: () => vai(() => { [g[i - 1], g[i]] = [g[i], g[i - 1]]; }) }, '▲'),
          el('button', { type: 'button', class: 'btn secondario', 'aria-label': `Sposta giù ${nomeDi(i)}`, disabled: i === g.length - 1,
            onclick: () => vai(() => { [g[i + 1], g[i]] = [g[i], g[i + 1]]; }) }, '▼')
        ),
        el('div', { class: 'campi' },
          el('div', { class: 'fila' },
            el('input', { type: 'text', value: p.nome, placeholder: `Giocatore ${i + 1}`, maxlength: 20,
              'aria-label': `Nome del giocatore ${i + 1}`,
              oninput: (e) => { p.nome = e.target.value; salva(); } }),
            i === 0 ? el('span', { class: 'etichetta' }, 'mazziere') : null
          ),
          el('div', { class: 'colori', role: 'group', 'aria-label': 'Colore' },
            COLORI.map(c => el('button', {
              type: 'button', class: 'colore', style: `background:var(--${c.id})`, title: c.nome, 'aria-label': c.nome,
              'aria-pressed': p.colore === c.id ? 'true' : 'false', disabled: usati.includes(c.id),
              onclick: () => vai(() => { p.colore = c.id; })
            }))
          )
        ),
        el('button', { type: 'button', class: 'btn secondario btn-icona', 'aria-label': `Togli ${nomeDi(i)}`, disabled: g.length <= 3,
          onclick: () => vai(() => { g.splice(i, 1); }) }, '×')
      );
    });
    const liberi = COLORI.filter(c => !g.some(p => p.colore === c.id));
    return [
      el('section', { class: 'scheda' },
        el('h2', {}, 'Chi gioca'),
        el('p', { class: 'nota' }, 'Da 3 a 6 giocatori. Mettili nell\'ordine in cui siedono, girando in senso orario: si gioca in quest\'ordine e il primo fa da mazziere.'),
        righe,
        el('div', { class: 'fila', style: 'margin-top:10px' },
          el('button', { type: 'button', class: 'btn secondario largo', disabled: g.length >= 6,
            onclick: () => vai(() => { g.push({ nome: '', colore: liberi[0].id }); }) }, '+ Aggiungi giocatore')
        )
      ),
      el('button', { type: 'button', class: 'btn largo',
        onclick: () => vai(() => { stato.fase = 'prep'; stato.passo = 0; stato.piazz = null; }, true) }, 'Prepara la partita')
    ];
  }

  // --- 2. preparazione
  function schermoPreparazione() {
    const passo = stato.passo;
    const barra = el('div', { class: 'barra', 'aria-hidden': 'true' }, PASSI.map((_, i) => el('span', { class: i <= passo ? 'fatto' : '' })));
    const corpo = [contenutoPasso(passo)].flat();
    const puoAvanzare = passo !== 3 || (stato.piazz && stato.piazz.turno === -1);
    const ultimo = passo === PASSI.length - 1;
    return [
      el('section', { class: 'scheda' },
        el('div', { class: 'passo-numero' }, `Preparazione · passo ${passo + 1} di ${PASSI.length}`),
        barra,
        el('h2', {}, PASSI[passo]),
        corpo,
        el('div', { class: 'navigazione' },
          el('button', { type: 'button', class: 'btn secondario',
            onclick: () => vai(() => { if (passo === 0) stato.fase = 'giocatori'; else stato.passo--; }, true) }, 'Indietro'),
          el('button', { type: 'button', class: 'btn', disabled: !puoAvanzare,
            onclick: () => vai(() => {
              if (ultimo) iniziaPartita(); else stato.passo++;
            }, true) }, ultimo ? 'Si parte!' : 'Avanti')
        )
      )
    ];
  }

  function contenutoPasso(p) {
    const m = nomeDi(0);
    if (p === 0) return [
      el('p', {}, 'Dividi le carte della scatola in tre mazzi: Territori (con i 2 jolly), Obiettivi e Torneo.'),
      el('p', {}, 'Le carte Torneo rimettile nella scatola: in una partita normale non servono.'),
      el('p', {}, `Ognuno prende le armate del suo colore. Mazziere: `, el('strong', {}, m), '.')
    ];
    if (p === 1) return [
      el('p', {}, el('strong', {}, m), ' mischia gli Obiettivi e ne dà uno coperto a ciascuno.'),
      el('p', {}, 'Ognuno lo guarda senza farlo vedere: è la sua missione per vincere. Gli Obiettivi avanzati tornano nella scatola senza guardarli.')
    ];
    if (p === 2) {
      const conti = L.territoriPerGiocatore(n(), 0);
      const giro = L.ordineDistribuzione(n(), 0);
      return [
        el('p', {}, el('strong', {}, m), ' toglie i 2 jolly dal mazzo Territori, mischia le 42 carte e le dà una alla volta, partendo da chi gli siede a ', el('strong', {}, 'destra'), ' e girando in senso ', el('strong', {}, 'antiorario'), '.'),
        el('p', { class: 'nota' }, 'Giro delle carte: ' + giro.map(nomeDi).join(' → ')),
        el('ul', { class: 'elenco' }, giro.map(i => el('li', {}, pallino(i), el('span', { class: 'nome' }, nomeDi(i)),
          el('span', { class: 'numero' }, conti[i]), el('span', { class: 'nota' }, 'territori')))),
        el('p', { class: 'nota' }, `Totale ${conti.reduce((a, b) => a + b, 0)} carte. Ognuno tiene le sue scoperte davanti a sé: sono i territori che occupa.`)
      ];
    }
    if (p === 3) return passoArmate();
    return [
      el('p', {}, el('strong', {}, m), ' raccoglie tutte le carte Territori, ci rimette i 2 jolly e mischia bene.'),
      el('p', {}, 'Il mazzo va al centro, coperto: da qui si pesca una carta a fine turno, quando si è conquistato almeno un territorio.'),
      el('p', {}, 'Comincia ', el('strong', {}, nomeDi(0)), ', poi si va in senso orario.')
    ];
  }

  function passoArmate() {
    const dot = L.dotazione(n());
    if (!stato.piazz) stato.piazz = { primaArmata: false, restanti: L.armateDaPiazzare(n(), 0), turno: 0, storia: [] };
    const pz = stato.piazz;
    const conti = L.territoriPerGiocatore(n(), 0);
    const out = [
      el('p', {}, `In ${n()} giocatori ognuno ha `, el('strong', {}, `${dot} armate`), '.'),
      el('ul', { class: 'spunte' }, el('li', {}, el('label', {},
        el('input', { type: 'checkbox', checked: pz.primaArmata, onchange: (e) => vai(() => { pz.primaArmata = e.target.checked; }) }),
        el('span', {}, 'Tutti hanno messo un\'armata su ognuno dei propri territori.')
      )))
    ];
    if (!pz.primaArmata) {
      out.push(el('p', { class: 'nota' }, 'Dopo restano: ' + stato.giocatori.map((_, i) => `${nomeDi(i)} ${dot - conti[i]}`).join(' · ')));
      return out;
    }
    out.push(el('p', {}, 'Adesso a turno, in senso orario partendo da ', el('strong', {}, nomeDi(0)), ', 3 armate alla volta sui propri territori, finché non sono finite.'));
    out.push(el('ul', { class: 'elenco' }, stato.giocatori.map((_, i) => el('li', { class: i === pz.turno ? 'attivo' : (pz.restanti[i] === 0 ? 'spento' : '') },
      pallino(i), el('span', { class: 'nome' }, nomeDi(i), i === pz.turno ? el('span', { class: 'nota' }, ' · tocca a te') : null),
      el('span', { class: 'numero' }, pz.restanti[i]), el('span', { class: 'nota' }, 'da mettere')))));
    if (pz.turno === -1) {
      out.push(el('div', { class: 'avvisi' }, 'Tutte le armate sono sul tavolo. Avanti!'));
    } else {
      const quante = Math.min(3, pz.restanti[pz.turno]);
      out.push(el('button', { type: 'button', class: 'btn largo',
        onclick: () => vai(() => { pz.storia.push({ restanti: pz.restanti, turno: pz.turno }); const r = L.piazza(pz.restanti, pz.turno); pz.restanti = r.restanti; pz.turno = r.turno; }) },
        `${nomeDi(pz.turno)}: +${quante} piazzate`));
    }
    if (pz.storia.length) out.push(el('button', { type: 'button', class: 'btn secondario largo', style: 'margin-top:8px',
      onclick: () => vai(() => { const s = pz.storia.pop(); pz.restanti = s.restanti; pz.turno = s.turno; }) }, 'Annulla l\'ultimo'));
    return out;
  }

  function iniziaPartita() {
    stato.fase = 'partita';
    stato.partita = { turno: 0, giro: 1, spunte: [false, false, false, false], eliminati: [], conquista: false,
      rinforzi: { territori: L.territoriPerGiocatore(n(), 0)[0], continenti: [], tris: '', mie: 0 },
      dadi: { att: 3, dif: 2, nAtt: 2, nDif: 2, ultimo: null } };
  }

  // --- 3. partita
  function attivi() { return stato.giocatori.map((_, i) => i).filter(i => !stato.partita.eliminati.includes(i)); }

  function fineTurno() {
    const pt = stato.partita;
    let i = pt.turno;
    do { i = (i + 1) % n(); } while (pt.eliminati.includes(i));
    if (i <= pt.turno) pt.giro++;
    pt.turno = i;
    pt.spunte = [false, false, false, false];
    pt.conquista = false;
    pt.rinforzi = { territori: pt.rinforzi.territori, continenti: [], tris: '', mie: 0 };
    pt.dadi.ultimo = null;
  }

  function schermoPartita() {
    const pt = stato.partita;
    if (attivi().length === 1) {
      return [el('section', { class: 'scheda' }, el('h2', {}, 'Partita finita'),
        el('div', { class: 'turno-grande' }, pallino(attivi()[0]), el('span', { class: 'chi' }, nomeDi(attivi()[0]))),
        el('p', {}, 'È rimasto un solo esercito sul tavolo.'))];
    }
    const t = pt.turno;
    const turno = el('section', { class: 'scheda' },
      el('div', { class: 'fila spazio' }, el('span', { class: 'passo-numero' }, `Giro ${pt.giro}`), el('span', { class: 'etichetta' }, `${attivi().length} in gioco`)),
      el('div', { class: 'turno-grande', style: 'margin-top:6px' }, pallino(t), el('span', { class: 'chi' }, nomeDi(t))),
      el('ul', { class: 'spunte' }, FASI.map((f, k) => el('li', {}, el('label', {},
        el('input', { type: 'checkbox', checked: pt.spunte[k], onchange: (e) => { pt.spunte[k] = e.target.checked; salva(); } }),
        el('span', {}, `${k + 1}. ${f}`))))),
      el('button', { type: 'button', class: 'btn largo', style: 'margin-top:10px', onclick: () => vai(fineTurno, true) },
        'Fine turno → ' + nomeDi(prossimo()))
    );
    return [turno, schedaRinforzi(), schedaCombattimento(), schedaSpostamento(), schedaGiocatori()];
  }

  function prossimo() {
    let i = stato.partita.turno;
    do { i = (i + 1) % n(); } while (stato.partita.eliminati.includes(i));
    return i;
  }

  function contatore(valore, min, max, cambia, etichetta) {
    const inp = el('input', { type: 'number', inputmode: 'numeric', min, max, value: valore, 'aria-label': etichetta,
      onchange: (e) => { const v = Math.max(min, Math.min(max, parseInt(e.target.value, 10) || min)); cambia(v); } });
    return el('div', { class: 'contatore' },
      el('button', { type: 'button', class: 'btn secondario', 'aria-label': `Meno ${etichetta}`, onclick: () => cambia(Math.max(min, valore - 1)) }, '−'),
      inp,
      el('button', { type: 'button', class: 'btn secondario', 'aria-label': `Più ${etichetta}`, onclick: () => cambia(Math.min(max, valore + 1)) }, '+'));
  }

  function aperta(id) { return (stato.aperte || {})[id] ? true : false; }
  function sezione(id, titolo, ...corpo) {
    return el('details', { class: 'scheda', open: aperta(id),
      ontoggle: (e) => { stato.aperte = stato.aperte || {}; stato.aperte[id] = e.target.open; salva(); } },
      el('summary', { onclick: (e) => { stato.aperte = stato.aperte || {}; stato.aperte[id] = !e.currentTarget.parentNode.open; salva(); } }, titolo), el('div', { class: 'corpo' }, ...corpo));
  }
  function ridisegna(cambia) { cambia(); salva(); disegna(); }

  function schedaRinforzi() {
    const r = stato.partita.rinforzi;
    const calc = L.rinforzi(r.territori, r.continenti, r.tris, r.mie);
    return sezione('rinforzi', 'Calcola i rinforzi',
      el('label', {}, 'Territori che occupi'),
      contatore(r.territori, 0, 42, (v) => ridisegna(() => { r.territori = v; }), 'territori'),
      el('label', { style: 'margin-top:12px' }, 'Continenti interi'),
      el('div', { class: 'caselle' }, L.CONTINENTI.map(c => el('label', { class: 'casella' },
        el('input', { type: 'checkbox', checked: r.continenti.includes(c.id),
          onchange: (e) => ridisegna(() => { r.continenti = e.target.checked ? r.continenti.concat(c.id) : r.continenti.filter(x => x !== c.id); }) }),
        el('span', {}, `${c.nome} +${c.bonus}`)))),
      el('label', { style: 'margin-top:12px' }, 'Tris giocato'),
      el('select', { onchange: (e) => ridisegna(() => { r.tris = e.target.value; if (!r.tris) r.mie = 0; }) },
        el('option', { value: '', selected: r.tris === '' }, 'Nessun tris'),
        L.TRIS.map(x => el('option', { value: x.id, selected: r.tris === x.id }, `${x.nome}: ${x.armate}`))),
      r.tris ? [el('label', { style: 'margin-top:12px' }, 'Carte del tris con un territorio tuo (+2 l\'una, da mettere lì)'),
        contatore(r.mie, 0, 3, (v) => ridisegna(() => { r.mie = v; }), 'carte con territorio tuo')] : null,
      el('div', { class: 'totale' },
        el('span', { class: 'nota' }, `${calc.base} dai territori + ${calc.continenti} dai continenti + ${calc.carte} dalle carte`),
        el('strong', {}, calc.totale))
    );
  }

  function schedaCombattimento() {
    const d = stato.partita.dadi;
    const maxA = L.dadiMassimiAttacco(d.att), maxD = L.dadiMassimiDifesa(d.dif);
    d.nAtt = Math.min(Math.max(1, d.nAtt), Math.max(1, maxA));
    d.nDif = Math.min(Math.max(1, d.nDif), Math.max(1, maxD));
    const esito = d.ultimo;
    const puo = maxA > 0 && maxD > 0;
    const scelta = (quanti, max, cambia, chi) => el('div', { class: 'fila', role: 'group', 'aria-label': `Dadi ${chi}` },
      [1, 2, 3].map(k => el('button', { type: 'button', class: k === quanti ? 'btn piccolo' : 'btn piccolo secondario', disabled: k > max,
        'aria-pressed': k === quanti ? 'true' : 'false', onclick: () => ridisegna(() => cambia(k)) }, k)));
    let risultato = null;
    if (esito) {
      const fila = (dadi, cls, perdeIdx) => el('div', { class: 'dadi' }, dadi.map((v, i) => el('span', { class: `dado ${cls}${perdeIdx(i) ? ' perde' : ''}` }, v)));
      risultato = [
        el('p', { class: 'nota', style: 'margin-top:12px' }, 'Attacco'),
        fila(esito.attacco, 'att', (i) => i < esito.dettagli.length && !esito.dettagli[i].vinceAttacco),
        el('p', { class: 'nota' }, 'Difesa'),
        fila(esito.difesa, 'dif', (i) => i < esito.dettagli.length && esito.dettagli[i].vinceAttacco),
        el('p', { class: 'esito' }, `L'attacco perde ${esito.persiAttacco}, la difesa perde ${esito.persiDifesa}.`),
        esito.conquista ? el('div', { class: 'avvisi' }, `Territorio conquistato! Entra con almeno ${esito.attacco.length} armat${esito.attacco.length === 1 ? 'a' : 'e'} (i dadi dell'ultimo lancio); puoi portarne altre lasciandone almeno una dietro. Non conta come spostamento.`) : null
      ];
    }
    return sezione('combattimento', 'Combattimento e dadi',
      el('ul', {},
        el('li', {}, 'Chi attacca: fino a 3 dadi, sempre almeno un\'armata a casa.'),
        el('li', {}, 'Chi difende dichiara quanti dadi (fino a 3) prima del lancio.'),
        el('li', {}, 'Si confrontano dal più alto al più basso; ', el('strong', {}, 'a parità vince la difesa'), '.')),
      el('div', { class: 'griglia2' },
        el('div', {}, el('label', {}, 'Armate in attacco'), contatore(d.att, 1, 99, (v) => ridisegna(() => { d.att = v; d.ultimo = null; }), 'armate in attacco')),
        el('div', {}, el('label', {}, 'Armate in difesa'), contatore(d.dif, 0, 99, (v) => ridisegna(() => { d.dif = v; d.ultimo = null; }), 'armate in difesa'))),
      el('div', { class: 'griglia2', style: 'margin-top:10px' },
        el('div', {}, el('label', {}, `Dadi attacco (max ${maxA})`), scelta(d.nAtt, maxA, (k) => { d.nAtt = k; }, 'attacco')),
        el('div', {}, el('label', {}, `Dadi difesa (max ${maxD})`), scelta(d.nDif, maxD, (k) => { d.nDif = k; }, 'difesa'))),
      !puo ? el('p', { class: 'nota' }, maxA === 0 ? 'Con una sola armata non si può attaccare.' : 'Il territorio è vuoto: è già conquistato.') : null,
      el('button', { type: 'button', class: 'btn largo', style: 'margin-top:12px', disabled: !puo,
        onclick: () => ridisegna(() => {
          const c = L.confronta(L.lancia(d.nAtt), L.lancia(d.nDif));
          d.att -= c.persiAttacco; d.dif -= c.persiDifesa;
          c.conquista = d.dif === 0;
          d.ultimo = c;
        }) }, 'Lancia i dadi'),
      el('p', { class: 'nota' }, 'Il lanciadadi è facoltativo: toglie da solo le armate perse dai due numeri qui sopra. Puoi anche tirare i dadi veri e usare solo le regole.'),
      risultato
    );
  }

  function schedaSpostamento() {
    return sezione('spostamento', 'Spostamento, carte, eliminazione',
      el('h3', { style: 'margin-top:0' }, 'Spostamento'),
      el('p', {}, 'Uno solo per turno: da un tuo territorio a un altro tuo confinante, lasciando almeno un\'armata in quello da cui parti.'),
      el('h3', {}, 'Carte'),
      el('p', {}, 'A fine turno, se hai conquistato almeno un territorio, peschi una carta (una sola). I tris si giocano all\'inizio del turno, con i rinforzi.'),
      el('h3', {}, 'Eliminazione'),
      el('p', {}, 'Chi perde l\'ultimo territorio esce; chi l\'ha eliminato prende tutte le sue carte. Segnalo qui sotto in «Giocatori».'));
  }

  function schedaGiocatori() {
    const pt = stato.partita;
    return sezione('giocatori', 'Giocatori',
      el('ul', { class: 'elenco' }, stato.giocatori.map((_, i) => {
        const fuori = pt.eliminati.includes(i);
        return el('li', { class: i === pt.turno ? 'attivo' : (fuori ? 'spento' : '') },
          pallino(i), el('span', { class: 'nome' }, nomeDi(i), i === 0 ? el('span', { class: 'nota' }, ' · mazziere') : null),
          fuori
            ? el('button', { type: 'button', class: 'btn piccolo secondario', onclick: () => vai(() => { pt.eliminati = pt.eliminati.filter(x => x !== i); }) }, 'Rimetti')
            : el('button', { type: 'button', class: 'btn piccolo secondario', disabled: i === pt.turno,
              onclick: () => { if (confirm(`${nomeDi(i)} è stato eliminato? Le sue carte vanno a ${nomeDi(pt.turno)}.`)) vai(() => { pt.eliminati.push(i); }); } }, 'Eliminato'));
      })),
      el('p', { class: 'nota' }, 'Chi è di turno non si può segnare come eliminato: un giocatore esce solo per mano di un altro.'));
  }

  // --- regole e testata
  const dlg = document.getElementById('regole');
  document.getElementById('tab-continenti').append(...L.CONTINENTI.map(c => el('tr', {}, el('td', {}, c.nome), el('td', {}, c.territori), el('td', {}, '+' + c.bonus))));
  document.getElementById('tab-tris').append(...L.TRIS.map(t => el('tr', {}, el('td', {}, t.nome), el('td', {}, t.armate))));
  document.getElementById('apri-regole').addEventListener('click', () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  document.getElementById('chiudi-regole').addEventListener('click', () => dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.getElementById('nuova-partita').addEventListener('click', () => {
    if (stato.fase === 'giocatori' || confirm('Ricominciare da capo? I giocatori restano, la partita si azzera.')) {
      const g = stato.giocatori;
      vai(() => { stato = nuovoStato(); stato.giocatori = g; });
    }
  });

  disegna();
})();
