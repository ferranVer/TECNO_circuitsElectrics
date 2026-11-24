# Circuits elèctrics · Sèrie i paral·lel

Tutorial interactiu pas a pas (en valencià) sobre circuits elèctrics en sèrie, en paral·lel i mixtos, pensat per a l'ESO.

## Què inclou

- **Tutorial de 10 passos**, amb el panell de teoria i pràctica fix a l'esquerra i el circuit animat a la dreta:
  1. Què és un circuit (interruptor que es pot clicar)
  2. Voltatge, intensitat i resistència (controls lliscants)
  3. Llei d'Ohm (pràctica)
  4. Circuit en sèrie (bombetes que es poden fondre)
  5. Pràctica de sèrie
  6. Circuit en paral·lel (bombetes que es poden fondre)
  7. Pràctica de paral·lel
  8. Potència: sèrie vs paral·lel (pràctica)
  9. Circuits mixtos amb reducció pas a pas (pràctica)
  10. Resum de fórmules
- **Taller** amb 5 plantilles de circuits mixtos (A–E), de menys a més dificultat:
  - A: `R1 + (R2 ∥ R3)`
  - B: `(R1 + R2) ∥ R3`
  - C: `R1 + (R2 ∥ R3) + R4`
  - D: `(R1 ∥ R2) + (R3 ∥ R4)`
  - E: `R1 ∥ (R2 + R3 ∥ R4)` (repte)
- **Valors aleatoris amb codi**: cada circuit es genera a partir d'un codi numèric (`#/taller/A/4821`). Amb el mateix codi, tota la classe té els mateixos valors.
- **Autocorrecció**: s'accepta coma o punt decimal, amb una tolerància d'1,5 %. Hi ha pistes, avís d'unitats i d'arrodoniment, i la solució es pot veure després de 2 intents. Quan acabes, també pots veure la resolució pas a pas.
- **Animació**: la velocitat dels punts de corrent és proporcional a la intensitat de cada branca, i el color de les resistències indica la calor que dissipen.
- El progrés es guarda al navegador (`localStorage`).

## Desenvolupament

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

Tecnologies: [Vite](https://vite.dev), JavaScript sense framework, [KaTeX](https://katex.org) per a les fórmules, [canvas-confetti](https://github.com/catdad/canvas-confetti) i la font Inter.

## Desplegament a Vercel

Importa el repositori a Vercel. Detecta Vite automàticament:

- Build command: `npm run build`
- Output directory: `dist`

No cal cap configuració addicional, perquè la navegació funciona amb `#hash`.

## Estructura

```
src/
  main.js                 navegació, progrés i estructura de la pàgina
  style.css               estil (fosc i violeta, inspirat en reflect.app)
  circuit/svg.js          dibuix de símbols i cables en SVG
  circuit/animator.js     animació del corrent
  circuit/layouts.js      disposicions en sèrie i en paral·lel
  tutorial/steps.js       els 10 passos del tutorial
  workshop/templates.js   plantilles A–E: generació de valors, resolució, preguntes i dibuix
  workshop/view.js        vista del taller
  ui/quiz.js              preguntes amb autocorrecció
  ui/stage.js             panell del circuit, mesures i tooltip
```
