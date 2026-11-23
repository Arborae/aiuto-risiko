# Aiuto partita · per RisiKo!

Una pagina web, pensata per il telefono, che accompagna un gruppo di amici dalla scatola aperta al primo turno e poi aiuta durante la partita.

**Apri:** https://arborae.github.io/aiuto-risiko/

## Cosa fa
- **Giocatori**: da 3 a 6, con nome, colore e ordine al tavolo; il primo fa da mazziere.
- **Preparazione guidata**, un passo alla volta: i mazzi di carte, gli obiettivi, quanti territori tocca a ciascuno (con il giro di distribuzione), le armate iniziali con il conto di chi deve piazzare e quante ne restano, il mazzo per la partita.
- **Durante la partita**: di chi è il turno e a che giro siete, le fasi da spuntare, il calcolo dei rinforzi (territori, continenti, tris), un promemoria sul combattimento con un lanciadadi facoltativo che fa il confronto da solo, spostamento ed eliminazione.
- **Regole in breve**, sempre a portata di mano, con le tabelle di continenti e tris.

Tutto resta nel browser (localStorage): nessun server, nessun account. «Nuova partita» azzera.

## Sviluppo
HTML, CSS e JavaScript senza dipendenze. La logica sta in `logica.js` e si prova con:

```
node test.js
```

## Avvertenza
Strumento non ufficiale, non collegato a Editrice Giochi. RisiKo! è un marchio dei rispettivi proprietari. Serve la scatola originale per giocare. I promemoria delle regole sono scritti da zero e non sostituiscono il regolamento ufficiale; nessuna immagine o grafica del gioco è usata.

## Licenza
[PolyForm Noncommercial License 1.0.0](LICENSE), solo per il codice di questo repository: uso libero per scopi non commerciali. Per un uso commerciale si contatta l'organizzazione Arborae nelle [GitHub Discussions](https://github.com/orgs/arborae/discussions).
