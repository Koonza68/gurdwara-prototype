# Gurdwara Discovery — Prototype V0.2

A mobile-first static web prototype for an educational Sikh gurdwara identification game.

## Included
- 20 prototype gurdwara records
- 10-round randomized photo challenge
- 4-answer multiple choice
- score + streak bonus
- local "discovered" collection saved in the browser
- post-answer educational card with:
  - historical period / established
  - significance to the Sikh faith
  - the story
  - stories & traditions
  - did you know?
  - associated Gurus
  - Sikh values tags
- Wikipedia image loading when available
- source link on each result card

## Run locally
Because the prototype fetches images from Wikipedia, run it through a small local web server instead of double-clicking index.html.

### Windows / Mac / Linux if Python is installed
Open a terminal in this folder and run:

    python -m http.server 8080

Then visit:

    http://localhost:8080

Python is **not** part of the app; this command is only a convenient local web server. Netlify, GitHub Pages, Vercel, or any static host can serve the files directly.

## Important content note
The historical text is prototype content assembled for UI/gameplay testing. Before a public release, each record should be reviewed against authoritative Sikh historical sources, spelling conventions, dates, image licensing, and any areas where documented history differs from oral tradition.


## V0.2 changes
- Three attempts per question
- Progressive hints after incorrect guesses
- Second hint reveals location
- Declining points: 100 / 75 / 50
- Answer buttons no longer reveal city/country
- First-try streak tracking
