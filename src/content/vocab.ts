/** Core vocabulary (2nd grade, units 1-4) and little scene builders. Add a word = one line + a sprite. */
import { A, L, type Line } from './lines'
import type { SceneItem } from './types'

export interface Word {
  id: string
  en: string
  pl: string
  tr: string
  art: 'a' | 'an'
  set: 'school' | 'toys' | 'home'
  pic: string
  itIs: string
  intro: Line
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const trCap = (s: string) => s[0].toLocaleUpperCase('tr') + s.slice(1)

function w(id: string, en: string, pl: string, tr: string, set: Word['set'], pic = 'obj/' + id): Word {
  const art = /^[aeiou]/.test(en) ? 'an' : 'a'
  return { id, en, pl, tr, art, set, pic, itIs: A(`It's ${art} ${en}.`), intro: L(`${cap(en)}! It's ${art} ${en}.`, `${trCap(tr)}! Bu bir ${tr}.`) }
}

export const SCHOOL = [
  w('bookcase', 'bookcase', 'bookcases', 'kitaplık', 'school'),
  w('board', 'board', 'boards', 'tahta', 'school'),
  w('cupboard', 'cupboard', 'cupboards', 'dolap', 'school'),
  w('computer', 'computer', 'computers', 'bilgisayar', 'school'),
  w('desk', 'desk', 'desks', 'sıra', 'school'),
  w('ruler', 'ruler', 'rulers', 'cetvel', 'school'),
  w('teacher', 'teacher', 'teachers', 'öğretmen', 'school', 'teacher/idle'),
  w('television', 'television', 'televisions', 'televizyon', 'school'),
  w('whiteboard', 'whiteboard', 'whiteboards', 'beyaz tahta', 'school'),
]
export const TOYS = [
  w('alien', 'alien', 'aliens', 'uzaylı', 'toys'),
  w('camera', 'camera', 'cameras', 'fotoğraf makinesi', 'toys'),
  w('board-game', 'board game', 'board games', 'kutu oyunu', 'toys'),
  w('kite', 'kite', 'kites', 'uçurtma', 'toys'),
  w('lorry', 'lorry', 'lorries', 'kamyon', 'toys'),
  w('robot', 'robot', 'robots', 'robot', 'toys'),
  w('tablet', 'tablet', 'tablets', 'tablet', 'toys'),
  w('watch', 'watch', 'watches', 'kol saati', 'toys'),
  w('teddy-bear', 'teddy bear', 'teddy bears', 'oyuncak ayı', 'toys'),
]
export const HOME = [
  w('clock', 'clock', 'clocks', 'duvar saati', 'home'),
  w('lamp', 'lamp', 'lamps', 'lamba', 'home'),
  w('mat', 'mat', 'mats', 'paspas', 'home'),
  w('mirror', 'mirror', 'mirrors', 'ayna', 'home'),
  w('phone', 'phone', 'phones', 'telefon', 'home'),
  w('sofa', 'sofa', 'sofas', 'kanepe', 'home'),
]
/** helper words that are used in pictures and sentences but are not target words */
export const EXTRA = [w('pen', 'pen', 'pens', 'kalem', 'school'), w('book', 'book', 'books', 'kitap', 'school')]
export const ALL_WORDS = [...SCHOOL, ...TOYS, ...HOME]
export function word(id: string): Word {
  const x = [...ALL_WORDS, ...EXTRA].find((v) => v.id === id)
  if (!x) throw new Error('unknown word ' + id)
  return x
}
export function itIsSpec(wd: Word) {
  return {
    accept: [`It's ${wd.art} ${wd.en}`, `${wd.art} ${wd.en}`].slice(0, 1),
    keyword: wd.en,
    rivals: ALL_WORDS.filter((x) => x.set === wd.set && x.id !== wd.id && !wd.en.includes(x.en)).map((x) => x.en),
  }
}

export const NUM: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty' }
export const NUM_TR: Record<number, string> = { 11: 'on bir', 12: 'on iki', 13: 'on üç', 14: 'on dört', 15: 'on beş', 16: 'on altı', 17: 'on yedi', 18: 'on sekiz', 19: 'on dokuz', 20: 'yirmi' }

// ---------------------------------------------------------------- scenes (1000 x 600, floor at y = 560)
const F = 560
export const at = (k: string, x: number, h: number, y = F, o: Partial<SceneItem> = {}): SceneItem => ({ k, x, y, h, ...o })
export type Spot = 'on-table' | 'under-table' | 'in-box' | 'on-chair' | 'under-chair' | 'on-sofa' | 'on-mat' | 'on-bed'
/** Furniture + a thing placed in / on / under it, drawn in the right order. */
export function spot(s: Spot, thing: { k: string; h: number }, x = 500, scale = 1): SceneItem[] {
  const [prep, f] = s.split('-') as ['in' | 'on' | 'under', string]
  const H = { table: 330, box: 260, chair: 340, sofa: 310, mat: 170, bed: 380 }[f as 'table']! * scale
  const top = { table: 0.79, box: 0.5, chair: 0.47, sofa: 0.4, mat: 0.45, bed: 0.4 }[f as 'table']!
  const base = at('obj/' + f, x, H)
  if (prep === 'on') return [base, at(thing.k, x, thing.h, F - H * top)]
  if (prep === 'under') return [at(thing.k, x, thing.h, F - 8), { ...base, y: F }]
  return [base, at(thing.k, x, thing.h, F - H * 0.28), { ...base, front: 0.4 }]
}
/** n copies in neat rows */
export function rows(k: string, n: number, perRow: number, h: number): SceneItem[] {
  const r = Math.ceil(n / perRow)
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / perRow)
    const inRow = Math.min(perRow, n - row * perRow)
    return at(k, 500 + ((i % perRow) - (inRow - 1) / 2) * (900 / perRow), h, 590 - (r - 1 - row) * (570 / r))
  })
}
