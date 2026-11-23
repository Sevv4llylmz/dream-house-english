# Alya's Dream House

Voice-guided English game for a 2nd grader (school book units 1-4, original activities and artwork supplied by the teacher).

```bash
npm install
npm run dev        # http://localhost:5190
npm run build      # static files in dist/
npx tsx scripts/test-speech.ts   # checks every spoken answer and every voice clip
```

| # | Place | Language | Activities |
|---|---|---|---|
| 1 | Garden | in / on / under, Where's…? | learn cards, find the cat, hide the cat (drag), ask the question |
| 2 | School | school words, 11-20, How many…?, Is/Are there…?, There isn't… | words, number balloons, counting, yes/no, find the differences |
| 3 | Toy shop | toys, this/that/these/those, Whose…?, sounds wh/ee/i-e/-se | words, sound balloons, photo time, choose the word, give to the owner, answer, memory |
| 4 | Dream house | furniture, rooms, mine/yours/his/hers, Which ones…? | words, put in the room, shoes, which ones, phone call, free decorating + questions about her own house |
| 5 | Volleyball | everything | pass (listen) → set (build) → spike (say); 3 right = 1 point, first to 5 |
| 6 | Teacher Talk | 14 sentences the teacher uses in lessons, with Turkish | cards, "What does that mean?", lesson time (react to the sentence) |

All levels are open. Volleyball: a wrong answer shows and says the right one and the Teacher gets the point (max 4); microphone problems never lose a point.

- **Add a teacher sentence:** one line in `src/content/talk.ts` (`PHRASES`), then `npm run voices`.
- **Add words / rounds:** `src/content/*.ts`, then `npm run voices` (needs internet and `pip install edge-tts`).
- **Turkish help:** write English pieces as `[[this]]`; they are spoken by the English voice.
- **Artwork:** `assets-src/` originals → `python tools/prepare_assets.py` → `public/assets/`. The map's basketball parts are covered there.
- **Privacy:** progress stays in this browser. Chrome/Edge send speech to their own service for recognition; a grown-up must allow it first. No audio is stored.
- **Teacher Mode:** small button on the menu, PIN 1234 (not real security).

Not tested: real microphone with a child's voice, real phone / iPad hardware, how the clips sound.
