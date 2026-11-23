/**
 * Compare what the recogniser heard with the expected answers.
 * This checks WHAT was said (the words), not pronunciation quality – the game never
 * shows pronunciation scores.
 */
import type { RecAlternative } from './recognition'

const NUMBER_WORDS: Record<string, string> = {
  '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
  '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen', '20': 'twenty',
}

/** Common recogniser spellings -> canonical words. Kept deliberately small so wrong answers don't pass. */
const ALIASES: [RegExp, string][] = [
  [/\bgo[\s-]?(kart|karts|cart|carts|car t)\b/g, 'gokart'],
  [/\bcomputer games\b/g, 'computer game'],
  [/\bpencil cases\b/g, 'pencil case'],
  [/\beraser\b/g, 'rubber'],
  [/\bbicycle\b/g, 'bike'],
  [/\baeroplane|airplane\b/g, 'plane'],
  [/\bcolor\b/g, 'colour'],
  [/\bgray\b/g, 'grey'],
  [/\bone's\b/g, 'ones'],
  [/\btv\b/g, 'television'],
  [/\btelephone\b/g, 'phone'],
  [/\b(black|white) board\b/g, '$1board'],
]

export function normalize(raw: string) {
  let s = ' ' + raw.toLowerCase().replace(/[’`]/g, "'") + ' '
  s = s.replace(/[.,!?;:"]/g, ' ')
  s = s.replace(/\bit's\b|\bits\b/g, 'it is')
  s = s.replace(/\bisn't\b|\bisnt\b/g, 'is not')
  s = s.replace(/\bi'm\b|\bim\b/g, 'i am')
  s = s.replace(/\b(whose|who's|who is) (is|are)\b/g, 'whose').replace(/\bwho's\b|\bwho is\b/g, 'whose')
  s = s.replace(/\b(mia|leo|alya|teacher)(?:'s|s| is)\b/g, '$1s')
  s = s.replace(/\bthere's\b|\btheirs\b/g, 'there is').replace(/\baren't\b|\barent\b/g, 'are not')
  s = s.replace(/\bthey're\b/g, 'they are').replace(/\bwhere's\b|\bwheres\b/g, 'where is')
  s = s.replace(/\bwhat's\b/g, 'what is')
  s = s.replace(/\bthat's\b/g, 'that is')
  s = s.replace(/\bdon't\b/g, 'do not')
  s = s.replace(/\b(uh|um|erm|er|hmm)\b/g, ' ')
  s = s.replace(/\b(\d{1,2})\b/g, (m) => NUMBER_WORDS[m] ?? m)
  for (const [re, to] of ALIASES) s = s.replace(re, to)
  s = s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
  return s
}

export type MatchOutcome = 'correct' | 'partial' | 'other-answer' | 'unclear'

export interface SpeakSpec {
  /** Full sentences that count as correct, e.g. ["It's a kite.", "It is a kite."] */
  accept: string[]
  /** If set, saying just this word counts as an early "partial" success. */
  keyword?: string
  /** Words that, if heard instead of the keyword, mean a different (wrong) answer. */
  rivals?: string[]
  /** Free answers (name, age, likes): any transcript matching this passes. */
  pattern?: RegExp
}

export function matchSpeech(alts: RecAlternative[], spec: SpeakSpec): { outcome: MatchOutcome; heard: string } {
  const heard = alts[0]?.transcript ?? ''
  const accepts = spec.accept.map(normalize)
  const kw = spec.keyword ? normalize(spec.keyword) : null
  const rivals = (spec.rivals ?? []).map(normalize).filter((r) => r !== kw)
  let partial: string | null = null
  for (const a of alts) {
    const n = normalize(a.transcript)
    if (!n) continue
    if (spec.pattern && spec.pattern.test(n)) return { outcome: 'correct', heard: a.transcript }
    const hasRival = rivals.some((r) => new RegExp(`\\b${r}\\b`).test(n))
    if (!hasRival && accepts.some((x) => n === x || (` ${n} `).includes(` ${x} `))) return { outcome: 'correct', heard: a.transcript }
    if (kw && !hasRival && new RegExp(`\\b${kw}\\b`).test(n) && !partial) partial = a.transcript
  }
  if (partial) return { outcome: 'partial', heard: partial }
  const top = normalize(heard)
  const conf = alts[0]?.confidence ?? 0
  const mentionsRival = rivals.some((r) => new RegExp(`\\b${r}\\b`).test(top))
  // A clear, different answer ("It's a car" for a kite) is "other-answer"; mumbles are "unclear".
  if (mentionsRival || (top.split(' ').length >= 2 && conf >= 0.6)) return { outcome: 'other-answer', heard }
  return { outcome: 'unclear', heard }
}
