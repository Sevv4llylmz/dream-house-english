/** Level 3 – toys, this / that / these / those, Whose…? */
import { A, L, shuffle, type Line } from './lines'
import { TOYS, word, at } from './vocab'
import type { ChoiceRound, SceneItem } from './types'
import type { BalloonRound } from './school'

export const TY = {
  intro: [L('Oh no! The toys are lost.', 'Eyvah! Oyuncaklar kayıp.'), L('Find the toys and their owners!', 'Oyuncakları ve sahiplerini bul!')],
  titles: { words: L('Toy Names', 'Oyuncak İsimleri'), sounds: L('Sound Balloons', 'Ses Balonları'), photo: L('Photo Time', 'Fotoğraf Zamanı'), choose: L('This, That, These, Those', 'Bu, Şu, Bunlar, Şunlar'), owner: L('Whose Is It?', 'Bu Kimin?'), whose: L('Answer Me', 'Bana Cevap Ver'), memory: L('Memory Cards', 'Hafıza Kartları') },
  wordsLead: L('Tap a toy. Then repeat after me!', 'Bir oyuncağa dokun. Sonra benden sonra tekrar et!'),
  photoTeach: [L('Near: this, these.', 'Yakında: [[this]] bu, [[these]] bunlar.'), L('Far away: that, those.', 'Uzakta: [[that]] şu, [[those]] şunlar.')],
  photoLead: L('Listen to me and take a photo!', 'Beni dinle ve fotoğraf çek!'),
  photoHint: L('Near or far? One or many?', 'Yakın mı, uzak mı? Bir tane mi, çok mu?'),
  ownerLead: L('Listen. Give the toys to my friends!', 'Dinle. Oyuncakları sahiplerine ver!'),
  ownerHint: L('Drag the toy to the right person.', 'Oyuncağı doğru kişiye sürükle.'),
  memoryLead: L('Find the pairs!', 'Eşleri bul!'),
}

// ---------------------------------------------------------------- photo time
export type Dem = 'this' | 'that' | 'these' | 'those'
export const demLine = (d: Dem, id: string) => DEM[`${d}-${id}`]
const PHOTO_IDS = ['robot', 'kite', 'camera', 'teddy-bear', 'alien', 'tablet']
const DEM: Record<string, { line: Line; say: string }> = {}
for (const id of PHOTO_IDS) {
  const t = word(id)
  DEM[`this-${id}`] = { line: L(`This is ${t.art} ${t.en}. Take a photo!`, `Bu bir ${t.tr}. Fotoğrafını çek!`), say: A(`This is ${t.art} ${t.en}.`) }
  DEM[`that-${id}`] = { line: L(`That is ${t.art} ${t.en}. Take a photo!`, `Şu bir ${t.tr}. Fotoğrafını çek!`), say: A(`That is ${t.art} ${t.en}.`) }
  DEM[`these-${id}`] = { line: L(`These are ${t.pl}. Take a photo!`, `Bunlar ${t.tr}. Fotoğraflarını çek!`), say: A(`These are ${t.pl}.`) }
  DEM[`those-${id}`] = { line: L(`Those are ${t.pl}. Take a photo!`, `Şunlar ${t.tr}. Fotoğraflarını çek!`), say: A(`Those are ${t.pl}.`) }
}
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
  const h = far ? 92 : 230
  const xs = many ? (far ? [400, 500, 600] : [290, 500, 710]) : [500]
  const items: SceneItem[] = xs.map((x) => at(t.pic, x, many && !far ? 190 : h, far ? 205 : 500, { glow: true }))
  const rest = many ? `are ${t.pl}` : `is ${t.art} ${t.en}`
  const full = A(`${d[0].toUpperCase() + d.slice(1)} ${rest}.`)
  return {
    id: `${d}-${id}`, topic: 'this-that', skill: 'speaking', prompt: L('Which word is right?', 'Hangi kelime doğru?'), visual: { type: 'scene', items, bg: 'toyRoom', caption: `____ ${rest}.` },
    options: (['This', 'That', 'These', 'Those'] as const).map((x) => ({ id: x, label: x, correct: x.toLowerCase() === d, say: x.toLowerCase() === d ? full : undefined })),
    hint: far ? L('Far away. That or those?', 'Uzakta. [[that]] mi, [[those]] mu?') : L('Near. This or these?', 'Yakında. [[this]] mi, [[these]] mi?'),
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
export const SOUND_TILES: Record<string, string> = { whale: 'wh·ale', bee: 'b·ee', kite: 'k·i·t·e', nose: 'no·se' }
const sndLines = snd.map(([en, , , tr]) => ({ find: L(`Find the ${en}!`, `${tr[0].toLocaleUpperCase('tr') + tr.slice(1)} nerede? Onu bul!`), after: L(`${en[0].toUpperCase() + en.slice(1)}. Repeat after me: ${en}!`, `Benden sonra tekrar et: [[${en}!]]`) }))
export function soundRounds(): BalloonRound[] {
  return shuffle(snd.map((_, i) => i)).map((i) => ({ id: snd[i][0], topic: 'sounds', line: sndLines[i].find, after: sndLines[i].after, options: shuffle(snd).map(([en, pic]) => ({ id: en, pic })) }))
}
export { TOYS }
