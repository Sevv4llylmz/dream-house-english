/** Level 2 – school things, numbers 11-20, There is / There are, How many…? */
import { A, L, shuffle, type Line } from './lines'
import { at, rows, word, NUM, NUM_TR, spot } from './vocab'
import type { ChoiceRound, SceneItem } from './types'

export const SC = {
  intro: [L('Welcome to the classroom, detective!', 'Sınıfa hoş geldin dedektif!'), L('Look, count and tell me.', 'Bak, say ve bana söyle.')],
  titles: { words: L('In the Classroom', 'Sınıfta'), nums: L('Number Balloons', 'Sayı Balonları'), many: L('How Many?', 'Kaç Tane?'), isThere: L('Is There...?', 'Var mı?'), diff: L('Find the Differences', 'Farkları Bul') },
  wordsLead: L('Tap the things. Then repeat after me!', 'Eşyalara dokun. Sonra benden sonra tekrar et!'),
  diffLead: L('Look at the pictures. What is not in picture two?', 'Resimlere bak. İkinci resimde ne yok?'),
  diffNo: L('Look again. It is in picture two.', 'Tekrar bak. O, ikinci resimde var.'),
}

export interface Balloon {
  id: string
  label?: string
  pic?: string
}
export interface BalloonRound {
  id: string
  topic: string
  line: Line
  after?: Line
  options: Balloon[]
}
export function numberRounds(): BalloonRound[] {
  const all = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  return shuffle(all).map((n) => ({
    id: String(n), topic: 'numbers', line: POP[n],
    options: shuffle([n, ...shuffle(all.filter((x) => x !== n)).slice(0, 4)]).map((x) => ({ id: String(x), label: String(x) })),
  }))
}
const POP: Record<number, Line> = Object.fromEntries(Object.entries(NUM_TR).map(([n, tr]) => [n, L(`Pop number ${NUM[+n]}!`, `${tr} numaralı balonu patlat!`)]))

function many(id: string, n: number, per: number, h: number, opts: number[]): ChoiceRound {
  const wd = word(id)
  const s = (k: number) => A(k === 1 ? `There is one ${wd.en}.` : `There are ${NUM[k]}.`)
  return {
    id: `${id}-${n}`, topic: 'how-many', skill: 'speaking', prompt: L(`How many ${wd.pl} are there?`, `Kaç tane ${wd.tr} var?`), visual: { type: 'scene', items: rows(wd.pic, n, per, h) },
    options: opts.map((k) => ({ id: String(k), label: s(k), correct: k === n, say: s(k) })), hint: L("Let's count together. Slowly!", 'Birlikte sayalım. Yavaş yavaş!'),
    speak: { accept: [`there are ${NUM[n]}`, `there are ${NUM[n]} ${wd.pl}`, `there is ${NUM[n]} ${wd.en}`], keyword: NUM[n], rivals: opts.filter((k) => k !== n).map((k) => NUM[k]) }, layout: 'sentences',
  }
}
export const manyRounds: ChoiceRound[] = [many('pen', 11, 6, 190, [11, 12, 13]), many('ruler', 13, 5, 130, [12, 13, 15]), many('desk', 12, 4, 170, [11, 12, 20]), many('book', 15, 5, 140, [14, 15, 16]), many('computer', 1, 1, 420, [1, 2, 11])]

const room: SceneItem[] = [at('obj/board', 300, 220, 270), at('obj/bookcase', 110, 330), at('obj/desk', 520, 250), at('obj/television', 820, 260), at('obj/ruler', 520, 60, 345)]
const YES = A('Yes, there is.'), NO = A("No, there isn't."), YESP = A('Yes, there are.'), NOP = A("No, there aren't.")
function isThere(id: string, q: string, tr: string, yes: boolean, plural: boolean, items: SceneItem[], explain: [string, string]): ChoiceRound {
  const [Y, N] = plural ? [YESP, NOP] : [YES, NO]
  return {
    id, topic: 'there-is', skill: 'speaking', prompt: L(q, tr), visual: { type: 'scene', items, bg: 'classroom' },
    options: [{ id: 'y', label: Y, correct: yes, say: Y }, { id: 'n', label: N, correct: !yes, say: N }], hint: L(...explain),
    speak: { accept: yes ? (plural ? ['yes there are'] : ['yes there is']) : plural ? ['no there are not'] : ['no there is not'], rivals: [yes ? 'no' : 'yes'] }, layout: 'sentences',
  }
}
const look: [string, string] = ['Look at the picture carefully.', 'Resme dikkatli bak.']
const pens = (n: number): SceneItem[] => [at('obj/desk', 500, 640, 740), ...Array.from({ length: n }, (_, i) => at('obj/pen', i < 7 ? 320 + i * 62 : 262 + (i - 7) * 62, 70, i < 7 ? 268 : 330))]
export const isThereRounds: ChoiceRound[] = [
  isThere('ruler', 'Is there a ruler on the desk?', 'Sıranın üstünde cetvel var mı?', true, false, room, look),
  isThere('whiteboard', 'Is there a whiteboard?', 'Beyaz tahta var mı?', false, false, room, ['A whiteboard is white. Can you see it?', 'Beyaz tahtanın rengi beyaz. Onu görüyor musun?']),
  isThere('computer', 'Is there a computer on the desk?', 'Sıranın üstünde bilgisayar var mı?', false, false, room, look),
  isThere('pens', 'Are there fifteen pens on the desk?', 'Sıranın üstünde on beş kalem var mı?', true, true, pens(15), ['Count the pens.', 'Kalemleri say.']),
  isThere('books', 'Are there books under the chair?', 'Sandalyenin altında kitap var mı?', false, true, spot('on-chair', { k: 'obj/book', h: 110 }), ['Look at the book. Is it on or under the chair?', 'Kitaba bak. Sandalyenin üstünde mi, altında mı?']),
]

/** Picture 1 has everything; `missing` is not in picture 2. */
export const DIFF_ITEMS: { id: string; pic: string; x: number; y: number; h: number }[] = [
  { id: 'board', pic: 'obj/board', x: 560, y: 260, h: 190 },
  { id: 'bookcase', pic: 'obj/bookcase', x: 110, y: 520, h: 330 },
  { id: 'cupboard', pic: 'obj/cupboard', x: 890, y: 520, h: 290 },
  { id: 'desk', pic: 'obj/desk', x: 400, y: 570, h: 240 },
  { id: 'computer', pic: 'obj/computer', x: 400, y: 372, h: 110 },
  { id: 'television', pic: 'obj/television', x: 680, y: 560, h: 220 },
]
export const DIFF_ROUNDS = [['television', 'board'], ['computer', 'bookcase'], ['cupboard', 'desk']]
export const diffLines: Record<string, Line> = Object.fromEntries(DIFF_ITEMS.map((d) => [d.id, L(`There isn't a ${d.id} in picture two.`, `İkinci resimde ${word(d.id).tr} yok.`)]))
export const diffSay: Record<string, string> = Object.fromEntries(DIFF_ITEMS.map((d) => [d.id, A(`There isn't a ${d.id}.`)]))
