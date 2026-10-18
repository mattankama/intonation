# Static TypeScript + React site, react-three-fiber for 3D, raw Web Audio for sound

Intonation is a static single-page site with no server: TypeScript, React and Vite, with three.js through react-three-fiber for the 3D scenes. Sound is generated directly with the browser's Web Audio API rather than an audio library, so that every frequency is set exactly to fractions of a cent and nothing rounds pitches to a 12-note grid. There are no accounts; state lives in the URL so any setup can be shared as a link. For now the site runs only on localhost.
