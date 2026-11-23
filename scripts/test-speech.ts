// Every spoken question: the right sentence must be accepted, every wrong option must be refused,
// and every spoken line must have a recorded clip.  Run: npx tsx scripts/test-speech.ts
import { readFileSync } from 'node:fs'
import { matchSpeech } from '../src/speech/match'
import { findRounds } from '../src/content/garden'
import { isThereRounds, manyRounds } from '../src/content/school'
import { demRounds, whoseRounds } from '../src/content/toys'
import { phoneRounds, whichRounds } from '../src/content/house'
import { actRounds } from '../src/content/talk'
import { ALL_WORDS, itIsSpec } from '../src/content/vocab'
import { allLines } from '../src/content/lines'
import type { ChoiceRound } from '../src/content/types'

let ok = 0
const bad: string[] = []
const hear = (t: string, spec: Parameters<typeof matchSpeech>[1]) => matchSpeech([{ transcript: t, confidence: 0.9 }], spec).outcome
const plain = (t: string) => t.toLowerCase().replace(/[.,?!]/g, '')
for (const r of [...findRounds, ...manyRounds, ...isThereRounds, ...demRounds, ...whoseRounds, ...whichRounds, ...phoneRounds, ...actRounds] as ChoiceRound[]) {
  if (!r.speak) continue
  for (const o of r.options) {
    const text = plain(o.say ?? o.label ?? '')
    if (r.topic === 'this-that' && !o.say) continue
    const res = hear(text, r.speak)
    if ((res === 'correct') === o.correct) ok++
    else bad.push(`${r.topic}/${r.id}: "${text}" -> ${res}, expected ${o.correct ? 'correct' : 'refused'}`)
  }
}
for (const w of ALL_WORDS) {
  for (const t of [`it's ${w.art} ${w.en}`, `it is ${w.art} ${w.en}`]) hear(t, itIsSpec(w)) === 'correct' ? ok++ : bad.push('word ' + t)
  const other = ALL_WORDS.find((x) => x.set === w.set && x.id !== w.id && !w.en.includes(x.en) && !x.en.includes(w.en))!
  hear(`it's ${other.art} ${other.en}`, itIsSpec(w)) !== 'correct' ? ok++ : bad.push('accepts wrong ' + w.en)
}
const extra: [string, string[], boolean][] = [
  ["it's mia's", ["It's Mia's"], true], ['its leos', ["It's Leo's"], true], ['who is is this robot', ['Whose is this robot'], true], ["who's is this robot", ['Whose is this robot'], true],
  ['there are 12', ['there are twelve'], true], ['the gray ones are his', ['The grey ones are his.'], true], ['the gray ones are hers', ['The grey ones are his.'], false], ['no there isnt', ['no there is not'], true],
]
for (const [t, accept, want] of extra) (hear(t, { accept }) === 'correct') === want ? ok++ : bad.push(`extra "${t}"`)
const man = JSON.parse(readFileSync('public/audio/voice/manifest.json', 'utf8'))
const missing = allLines().filter((l) => !man[`${l.voice}|${l.text.trim()}`])
console.log('ok', ok, 'bad', bad.length, 'lines without clip', missing.length)
bad.forEach((b) => console.log(' -', b))
missing.slice(0, 5).forEach((m) => console.log(' ?', m.voice, m.text))
