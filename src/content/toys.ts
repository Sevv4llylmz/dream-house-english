/** Level 3 – toys, this / that / these / those, Whose…? */
import { A, L, shuffle, type Line } from './lines'
import { TOYS, word, at } from './vocab'
import type { ChoiceRound, SceneItem } from './types'
import type { BalloonRound } from './school'

export const TY = {
  intro: [L('Oh no! The toys are lost.', 'Eyvah! Oyuncaklar kayıp.'), L('Find the toys and their owners!', 'Oyuncakları ve sahiplerini bul!')],
  titles: { words: L('Toy Names', 'Oyuncak İsimleri'), sounds: L('Sound Balloons', 'Ses Balonları'), photo: L('Photo Time', 'Fotoğraf Zamanı'), choose: L('This, That, These, Those', 'Bu, Şu, Bunlar, Şunlar'), owner: L('Whose Is It?', 'Bu Kimin?'), whose: L('Answer Me', 'Bana Cevap Ver'), memory: L('Memory Cards', 'Hafıza Kartları') },
  wordsLead: L('Tap a toy. Then repeat after me!', 'Bir oyuncağa dokun. Sonra benden sonra tekrar et!'),
  photoLead: L('Listen to me and take a photo!', 'Beni dinle ve fotoğraf çek!'),
  ownerLead: L('Listen. Give the toys to my friends!', 'Dinle. Oyuncakları sahiplerine ver!'),
  ownerHint: L('Drag the toy to the right person.', 'Oyuncağı doğru kişiye sürükle.'),
  memoryLead: L('Find the pairs!', 'Eşleri bul!'),
}

// ---------------------------------------------------------------- photo time
export type Dem = 'this' | 'that' | 'these' | 'those'
export const demLine = (d: Dem, id: string) => DEM[`${d}-${id}`]
const PHOTO_IDS = ['robot', 'kite', 'camera', 'teddy-bear', 'alien', 'tablet']
const DEM: Record<string, { line: Line; say: string; tr: string }> = {}
for (const id of PHOTO_IDS) {
  const t = word(id)
  DEM[`this-${id}`] = { line: L(`This is ${t.art} ${t.en}. Take a photo!`, `Bu bir ${t.tr}. Fotoğrafını çek!`), say: A(`This is ${t.art} ${t.en}.`), tr: `Bu bir ${t.tr}.` }
  DEM[`that-${id}`] = { line: L(`That is ${t.art} ${t.en}. Take a photo!`, `Şu bir ${t.tr}. Fotoğrafını çek!`), say: A(`That is ${t.art} ${t.en}.`), tr: `Şu bir ${t.tr}.` }
  DEM[`these-${id}`] = { line: L(`These are ${t.pl}. Take a photo!`, `Bunlar ${t.tr}. Fotoğraflarını çek!`), say: A(`These are ${t.pl}.`), tr: `Bunlar ${t.tr}.` }
  DEM[`those-${id}`] = { line: L(`Those are ${t.pl}. Take a photo!`, `Şunlar ${t.tr}. Fotoğraflarını çek!`), say: A(`Those are ${t.pl}.`), tr: `Şunlar ${t.tr}.` }
}
/** why this word? (after a wrong photo) */
export const demWhy: Record<Dem, Line> = {
  this: L('This: near, only one.', '[[this]], yakında ve bir tane olan şey. Yani bu.'),
  these: L('These: near, two or more.', '[[these]], yakında ve birden fazla olan şeyler. Yani bunlar.'),
  that: L('That: far away, only one.', '[[that]], uzakta ve bir tane olan şey. Yani şu.'),
  those: L('Those: far away, two or more.', '[[those]], uzakta ve birden fazla olan şeyler. Yani şunlar.'),
}
/** the lesson before photo time: one idea on every page, explained in Turkish */
export interface DemPage {
  d?: Dem
  line: Line
  /** spoken after the English and written on the page */
  rule: Line
}
const rule = (tr: string): Line => L('', tr)
const demPage = (d: Dem, tr: string, r: string): DemPage => ({ d, line: L(DEM[`${d}-robot`].say, tr), rule: rule(r) })
export const DEM_WORD: Record<Dem, string> = { this: 'bu', these: 'bunlar', that: 'şu', those: 'şunlar' }
export const demPages: DemPage[] = [
  { line: L('Is it near or far?', 'Yakın mı, uzak mı?'), rule: rule('Önce nerede olduğuna bakarız. Elini uzatınca dokunabiliyorsan yakın. Dokunamıyorsan uzak.') },
  demPage('this', 'Bu bir robot.', 'Robot yakınımda ve bir tane. Ona dokunabilirim. O zaman [[this]] derim.'),
  demPage('these', 'Bunlar robot.', 'Robotlar yine yakınımda ama birden fazla. O zaman [[these]] derim. Çok oldukları için [[is]] değil, [[are]] kullanırım.'),
  demPage('that', 'Şu bir robot.', 'Robot uzakta ve bir tane. Ona dokunamam, parmağımla gösteririm. O zaman [[that]] derim.'),
  demPage('those', 'Şunlar robot.', 'Robotlar uzakta ve birden fazla. O zaman [[those]] derim. Çok oldukları için yine [[are]] kullanırım.'),
  { line: L("Let's remember!", 'Hadi hatırlayalım!'), rule: rule('Kendine iki soru sor. Bir: Yakın mı, uzak mı? İki: Bir tane mi, birden fazla mı?') },
]

export function photoRounds(): { id: string; dem: Dem }[] {
  const ds = shuffle<Dem>(['this', 'that', 'these', 'those']).concat(shuffle<Dem>(['these', 'those', 'that']).slice(0, 2))
  const ids = shuffle(PHOTO_IDS)
  return ds.map((d, i) => ({ id: ids[i % ids.length], dem: d }))
}

// ---------------------------------------------------------------- choose this/that/these/those
function dem(id: string, d: Dem): ChoiceRound {
  const t = word(id)
  const far = d === 'that' || d === 'those'
  const many = d === 'these' || d === 'those'
  const h = far ? 92 : 205
  const xs = many ? (far ? [400, 500, 600] : [290, 500, 710]) : [500]
  const items: SceneItem[] = xs.map((x) => at(t.pic, x, many && !far ? 180 : h, far ? 205 : 448, { glow: true }))
  const rest = many ? `are ${t.pl}` : `is ${t.art} ${t.en}`
  const full = A(`${d[0].toUpperCase() + d.slice(1)} ${rest}.`)
  return {
    id: `${d}-${id}`, topic: 'this-that', skill: 'speaking', prompt: L('Near or far? One or many? Choose the word!', 'Yakın mı, uzak mı? Bir tane mi, birden fazla mı? Kelimeyi seç!'), visual: { type: 'scene', items, bg: 'toyRoom', caption: `____ ${rest}.`, captionDone: full, captionTr: `${{ this: 'Bu bir', that: 'Şu bir', these: 'Bunlar', those: 'Şunlar' }[d]} ${t.tr}.` },
    options: (['This', 'That', 'These', 'Those'] as const).map((x) => ({ id: x, label: x, correct: x.toLowerCase() === d, say: x.toLowerCase() === d ? full : undefined })),
    hint: far ? L('It is far away. Is it one or many? That or those?', 'Uzakta. Bir taneyse [[that]], birden fazlaysa [[those]].') : L('It is near. Is it one or many? This or these?', 'Yakında. Bir taneyse [[this]], birden fazlaysa [[these]].'),
    speak: { accept: [`${d} ${rest}`], rivals: (['this', 'that', 'these', 'those'] as const).filter((x) => x !== d && !(d === 'these' && x === 'this')) }, layout: 'numbers',
  }
}
export const demRounds = [dem('robot', 'this'), dem('kite', 'those'), dem('camera', 'that'), dem('teddy-bear', 'these'), dem('watch', 'this'), dem('alien', 'those')]

// ---------------------------------------------------------------- whose
export type Owner = 'alya' | 'mia' | 'leo' | 'teacher'
export const OWNER: Record<Owner, { en: string; poss: string; trPoss: string }> = {
  alya: { en: 'Alya', poss: "Alya's", trPoss: 'Alya’nın' },
  mia: { en: 'Mia', poss: "Mia's", trPoss: 'Mia’nın' },
  leo: { en: 'Leo', poss: "Leo's", trPoss: 'Leo’nun' },
  teacher: { en: 'Teacher', poss: "Teacher's", trPoss: 'Öğretmenin' },
}
const belongs: [string, Owner][] = [['kite', 'mia'], ['robot', 'leo'], ['teddy-bear', 'alya'], ['camera', 'teacher'], ['lorry', 'leo'], ['watch', 'mia']]
export const ownerRounds = belongs.map(([id, o]) => ({
  id, pic: word(id).pic, owner: o, say: A(`It's ${OWNER[o].poss}.`),
  line: L(`Whose is this ${word(id).en}? It's ${OWNER[o].poss}. Give it to ${o === 'teacher' ? 'me' : OWNER[o].en}!`, `Bu ${word(id).tr} kimin? ${OWNER[o].trPoss}. Ona ver!`),
}))
function whose(id: string, o: Owner, wrong: Owner[], plural = false): ChoiceRound {
  const t = word(id)
  const s = (x: Owner) => A(`${plural ? "They're" : "It's"} ${OWNER[x].poss}.`)
  const items: SceneItem[] = [at(`${o}/idle`, 320, 500, 590), ...(plural ? [at(t.pic, 600, 190, 540), at(t.pic, 800, 190, 540)] : [at(t.pic, 680, 250, 540)])]
  return {
    id: `whose-${id}`, topic: 'whose', skill: 'speaking', prompt: plural ? L(`Whose are these ${t.pl}?`, `Bunlar kimin?`) : L(`Whose is this ${t.en}?`, `Bu ${t.tr} kimin?`), visual: { type: 'scene', items },
    options: [o, ...wrong].map((x) => ({ id: x, label: s(x), correct: x === o, say: s(x) })), hint: L('Who is in the picture?', 'Resimde kim var?'),
    speak: { accept: [`${plural ? 'they are' : 'it is'} ${OWNER[o].poss}`], keyword: OWNER[o].poss, rivals: wrong.map((x) => OWNER[x].poss) }, layout: 'sentences',
  }
}
export const whoseRounds = [whose('kite', 'mia', ['leo', 'alya']), whose('robot', 'leo', ['mia', 'teacher']), whose('teddy-bear', 'alya', ['leo', 'mia']), whose('book', 'teacher', ['alya', 'leo'], true), whose('tablet', 'mia', ['teacher', 'alya'], true)]

// ---------------------------------------------------------------- sounds of the book: wh, ee, i-e, -se
const snd: [string, string, string, string][] = [
  ['whale', 'obj/whale', 'wh', 'balina'],
  ['bee', 'obj/bee', 'ee', 'arı'],
  ['kite', 'obj/kite', 'i-e', 'uçurtma'],
  ['nose', 'obj/nose', '-se', 'burun'],
]
/** the word, with the letters of the sound in pink */
export const SOUND_TILES: Record<string, [string, boolean][]> = { whale: [['wh', true], ['ale', false]], bee: [['b', false], ['ee', true]], kite: [['k', false], ['i', true], ['t', false], ['e', true]], nose: [['no', false], ['se', true]] }
const sndLines = snd.map(([en, , , tr]) => ({ find: L(`Find the ${en}!`, `${tr[0].toLocaleUpperCase('tr') + tr.slice(1)} nerede? Onu bul!`), after: L(`${en[0].toUpperCase() + en.slice(1)}. Repeat after me: ${en}!`, `Benden sonra tekrar et: [[${en}!]]`) }))
export function soundRounds(): BalloonRound[] {
  return shuffle(snd.map((_, i) => i)).map((i) => ({ id: snd[i][0], topic: 'sounds', line: sndLines[i].find, after: sndLines[i].after, options: shuffle(snd).map(([en, pic]) => ({ id: en, pic })) }))
}
export { TOYS }
