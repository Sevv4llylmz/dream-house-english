/** Level 1 – in / on / under. */
import { A, L, type Line } from './lines'
import { spot, type Spot } from './vocab'
import type { ChoiceRound, SceneItem } from './types'

export const SPOTS: Record<string, { en: string; tr: string; trTo: string }> = {
  'on-table': { en: 'on the table', tr: 'masanın üstünde', trTo: 'masanın üstüne' },
  'under-table': { en: 'under the table', tr: 'masanın altında', trTo: 'masanın altına' },
  'in-box': { en: 'in the box', tr: 'kutunun içinde', trTo: 'kutunun içine' },
  'on-chair': { en: 'on the chair', tr: 'sandalyenin üstünde', trTo: 'sandalyenin üstüne' },
  'under-chair': { en: 'under the chair', tr: 'sandalyenin altında', trTo: 'sandalyenin altına' },
  'on-sofa': { en: 'on the sofa', tr: 'kanepenin üstünde', trTo: 'kanepenin üstüne' },
  'on-bed': { en: 'on the bed', tr: 'yatağın üstünde', trTo: 'yatağın üstüne' },
}
const trCap = (s: string) => s[0].toLocaleUpperCase('tr') + s.slice(1)
export const itIs = (s: string) => A(`It's ${SPOTS[s].en}.`)

/** the cat pose that fits a place */
export function catAt(s: Spot, x = 500, scale = 1): SceneItem[] {
  const under = s.startsWith('under')
  return spot(s, under ? { k: 'cat/crouch', h: (s === 'under-chair' ? 105 : 170) * scale } : s === 'in-box' ? { k: 'cat/sit', h: 270 * scale } : { k: s === 'on-sofa' || s === 'on-bed' ? 'cat/sleep' : 'cat/sit', h: (s === 'on-sofa' || s === 'on-bed' ? 130 : 200) * scale }, x, scale)
}

export const G = {
  intro: [L('The cat is hiding! Can you find him?', 'Kedi saklanıyor! Onu bulabilir misin?'), L('Use in, on and under.', '[[in]], [[on]] ve [[under]] kullan.')],
  titles: { learn: L('In, On, Under', 'İçinde, Üstünde, Altında'), find: L("Where's the Cat?", 'Kedi Nerede?'), hide: L('Hide the Cat', 'Kediyi Sakla'), ask: L('You Ask!', 'Sen Sor!') },
  hideLead: L("Let's hide the cat. Listen to me!", 'Hadi kediyi saklayalım. Beni dinle!'),
  hideHint: L('Drag the cat to the right place.', 'Kediyi doğru yere sürükle.'),
  askLead: L("It's your turn. Ask me a question!", 'Sıra sende. Bana bir soru sor!'),
  askHint: L('Start with Where.', '[[Where]] ile başla.'),
}

export const PREPS: { id: string; tr: string; line: Line; word: Line; spot: Spot; say: string }[] = [
  { id: 'in', tr: 'içinde', word: L('in', 'içinde'), line: L("The cat is in the box.", 'Kedi kutunun içinde.'), spot: 'in-box', say: A('in') },
  { id: 'on', tr: 'üstünde', word: L('on', 'üstünde'), line: L('The cat is on the table.', 'Kedi masanın üstünde.'), spot: 'on-table', say: A('on') },
  { id: 'under', tr: 'altında', word: L('under', 'altında'), line: L('The cat is under the table.', 'Kedi masanın altında.'), spot: 'under-table', say: A('under') },
]

const whereCat = L("Where's the cat?", 'Kedi nerede?')
function find(s: Spot, wrong: Spot[]): ChoiceRound {
  const prep = s.split('-')[0]
  return {
    id: s, topic: 'prepositions', skill: 'speaking', prompt: whereCat, visual: { type: 'scene', items: catAt(s) },
    options: [s, ...wrong].map((x) => ({ id: x, label: itIs(x), correct: x === s, say: itIs(x) })),
    hint: L(`Look at the cat. Is it in, on or under?`, 'Kediye bak. İçinde mi, üstünde mi, altında mı?'),
    speak: { accept: [`It's ${SPOTS[s].en}`, SPOTS[s].en, `the cat is ${SPOTS[s].en}`], rivals: ['in', 'on', 'under'].filter((p) => p !== prep) },
    layout: 'sentences',
  }
}
export const findRounds: ChoiceRound[] = [
  find('under-table', ['on-table', 'in-box']),
  find('in-box', ['under-table', 'on-chair']),
  find('on-chair', ['under-chair', 'on-table']),
  find('under-chair', ['on-chair', 'in-box']),
  find('on-sofa', ['under-table', 'on-bed']),
]

const put = (s: string) => L(`Put the cat ${SPOTS[s].en}!`, `Kediyi ${SPOTS[s].trTo} koy!`)
export const hideRounds: { spot: Spot; line: Line }[] = (['under-table', 'in-box', 'on-chair', 'on-table', 'under-chair'] as Spot[]).map((s) => ({ spot: s, line: put(s) }))

export const askItems: { words: string[]; say: string; reply: Line; spot: Spot }[] = (['on-bed', 'under-chair', 'in-box'] as Spot[]).map((s) => ({
  words: ['Where', 'is', 'the', 'cat', '?'],
  say: A('Where is the cat?'),
  reply: L(`It's ${SPOTS[s].en}!`, `${trCap(SPOTS[s].tr)}!`),
  spot: s,
}))
