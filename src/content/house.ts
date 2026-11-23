/** Level 4 – furniture, rooms, mine / yours / his / hers, Which…? */
import { A, L, type Line } from './lines'
import { HOME, word, at } from './vocab'
import type { ChoiceRound, SceneItem } from './types'
import type { Room } from '../assets/manifest'
import type { Owner } from './toys'

export const ROOM_TR: Record<Room, string> = { purple: 'Mor', turquoise: 'Turkuaz', yellow: 'Sarı', pink: 'Pembe' }
export const ROOMS: Room[] = ['purple', 'turquoise', 'yellow', 'pink']

export const H = {
  intro: [L('This is your dream house! It is empty.', 'Bu senin rüya evin! İçi boş.'), L("Let's put things in the rooms!", 'Hadi odalara eşya koyalım!')],
  titles: { words: L('Things at Home', 'Evdeki Eşyalar'), put: L('Put It in the Room', 'Odaya Koy'), shoes: L('Whose Shoes?', 'Kimin Ayakkabıları?'), which: L('Which Ones?', 'Hangileri?'), phone: L('Hello, Teacher!', 'Alo, Öğretmenim!'), decor: L('My Dream House', 'Benim Rüya Evim') },
  wordsLead: L('Tap the things. Then repeat after me!', 'Eşyalara dokun. Sonra benden sonra tekrar et!'),
  putHint: L('Find the thing, then look at the colour of the room.', 'Eşyayı bul, sonra odanın rengine bak.'),
  shoesLead: L('Listen to Alya. Give the shoes to the right person!', 'Alya’yı dinle. Ayakkabıları doğru kişiye ver!'),
  shoesHint: L('Mine is Alya. Yours is Teacher. His is Leo. Hers is Mia.', '[[mine]] benim, [[yours]] senin, [[his]] onun, Leo için. [[hers]] onun, Mia için.'),
  phoneLead: L('Hello! I am on the phone. I cannot see your house. Answer my questions!', 'Alo! Telefondayım. Evini göremiyorum. Sorularımı cevapla!'),
  decorLead: L('Make your dream house! Drag the things into the rooms.', 'Rüya evini yap! Eşyaları odalara sürükle.'),
  decorDone: L('Your house is beautiful!', 'Evin çok güzel!'),
  decorMore: L('Put three or more things in your house first.', 'Önce evine en az üç eşya koy.'),
}

const plan: [string, Room][] = [['sofa', 'yellow'], ['lamp', 'purple'], ['mirror', 'turquoise'], ['clock', 'pink'], ['mat', 'purple'], ['phone', 'yellow']]
export const putRounds = plan.map(([id, room]) => ({
  id, room,
  line: L(`Put the ${word(id).en} in the ${room} room!`, `${word(id).tr[0].toLocaleUpperCase('tr') + word(id).tr.slice(1)}: ${ROOM_TR[room].toLocaleLowerCase('tr')} odaya koy!`),
  say: A(`The ${word(id).en} is in the ${room} room.`),
}))

// ---------------------------------------------------------------- mine / yours / his / hers (Alya speaks)
export type Pron = 'mine' | 'yours' | 'his' | 'hers'
export const PRON: Record<Pron, { tr: string; owner: Owner; colour: string; trColour: string }> = {
  mine: { tr: 'benim', owner: 'alya', colour: 'turquoise', trColour: 'Turkuaz' },
  yours: { tr: 'senin', owner: 'teacher', colour: 'lilac', trColour: 'Lila' },
  his: { tr: 'onun (erkek)', owner: 'leo', colour: 'grey', trColour: 'Gri' },
  hers: { tr: 'onun (kız)', owner: 'mia', colour: 'yellow', trColour: 'Sarı' },
}
const trWho: Record<Pron, string> = { mine: 'benim', yours: 'senin', his: 'Leo’nun', hers: 'Mia’nın' }
export const pronTeach: Record<Pron, Line> = {
  mine: L('mine', 'benim'),
  yours: L('yours', 'senin'),
  his: L('his', 'onun. Erkekler için.'),
  hers: L('hers', 'onun. Kızlar için.'),
}
export const shoeRounds = (Object.keys(PRON) as Pron[]).map((p) => ({
  id: p, pic: `obj/shoes-${PRON[p].colour}`, owner: PRON[p].owner, say: A(`The ${PRON[p].colour} ones are ${p}.`),
  line: { en: `The ${PRON[p].colour} ones are ${p}.`, tr: L(`The ${PRON[p].colour} ones are ${p}.`, `${PRON[p].trColour} olanlar ${trWho[p]}.`).tr } as Line,
}))
function which(p: Pron, wrong: Pron[]): ChoiceRound {
  const s = (x: Pron) => A(`The ${PRON[x].colour} ones are ${p}.`)
  const qs: Record<Pron, Line> = {
    mine: L('Which shoes are yours, Alya?', 'Hangi ayakkabılar senin, Alya?'),
    yours: L('Which shoes are mine? I am your teacher.', 'Hangi ayakkabılar benim? Ben senin öğretmeninim.'),
    his: L("Which shoes are Leo's?", 'Hangi ayakkabılar Leo’nun?'),
    hers: L("Which shoes are Mia's?", 'Hangi ayakkabılar Mia’nın?'),
  }
  const people = (['mine', 'yours', 'his', 'hers'] as Pron[]).flatMap((x, i): SceneItem[] => [at(`${PRON[x].owner}/idle`, 140 + i * 240, 350, 410, { glow: x === p }), at(`obj/shoes-${PRON[x].colour}`, 140 + i * 240, 130, 580)])
  return {
    id: p, topic: 'mine-yours', skill: 'speaking', prompt: qs[p], visual: { type: 'scene', items: people },
    options: [p, ...wrong].map((x) => ({ id: x, label: s(x), correct: x === p, say: s(x) })), hint: L('Look at the shoes and the person. What colour?', 'Ayakkabılara ve kişiye bak. Ne renk?'),
    speak: { accept: [`the ${PRON[p].colour} ones are ${p}`, ...(p === 'yours' ? ['the purple ones are yours'] : [])], rivals: wrong.map((x) => PRON[x].colour) }, layout: 'sentences',
  }
}
export const whichRounds = [which('his', ['hers', 'mine']), which('hers', ['his', 'yours']), which('mine', ['his', 'hers']), which('yours', ['mine', 'hers'])]

// ---------------------------------------------------------------- phone call
/** positions in the 1000 x 563 dolls' house picture */
const X: Record<Room, number> = { purple: 290, turquoise: 712, yellow: 290, pink: 712 }
const Y: Record<Room, number> = { purple: 302, turquoise: 302, yellow: 528, pink: 528 }
const inRoom = (id: string, r: Room, dx: number, h: number, dy = 0) => at('obj/' + id, X[r] + dx, h, Y[r] - dy)
export const phoneHouse: SceneItem[] = [inRoom('bed', 'purple', 20, 120), inRoom('lamp', 'purple', 150, 95), inRoom('mirror', 'turquoise', -60, 125), inRoom('mat', 'turquoise', 60, 36), inRoom('sofa', 'yellow', 20, 105), inRoom('clock', 'yellow', 60, 62, 135), inRoom('table', 'pink', -20, 88), inRoom('phone', 'pink', -20, 55, 72)]
const YES = A('Yes, there is.'), NO = A("No, there isn't.")
function yn(id: string, room: Room, yes: boolean): ChoiceRound {
  const t = word(id)
  return {
    id: `call-${id}`, topic: 'there-is', skill: 'speaking', prompt: L(`Is there a ${t.en} in the ${room} room?`, `${ROOM_TR[room]} odada ${t.tr} var mı?`), visual: { type: 'scene', items: phoneHouse, bg: 'house' },
    options: [{ id: 'y', label: YES, correct: yes, say: YES }, { id: 'n', label: NO, correct: !yes, say: NO }], hint: L(`Look at the ${room} room.`, `${ROOM_TR[room]} odaya bak.`),
    speak: { accept: yes ? ['yes there is'] : ['no there is not'], rivals: [yes ? 'no' : 'yes'] }, layout: 'sentences',
  }
}
export const inThe = (r: Room) => A(`It's in the ${r} room.`)
export function whereRound(id: string, room: Room, visual: ChoiceRound['visual']): ChoiceRound {
  const t = word(id)
  return {
    id: `where-${id}`, topic: 'house-where', skill: 'speaking', prompt: WHERE[id], visual,
    options: [room, ...ROOMS.filter((r) => r !== room).slice(0, 2)].map((r) => ({ id: r, label: inThe(r), correct: r === room, say: inThe(r) })), hint: L('Look at the colour of the room.', 'Odanın rengine bak.'),
    speak: { accept: [`it's in the ${room} room`, `in the ${room} room`, `the ${t.en} is in the ${room} room`], keyword: room, rivals: ROOMS.filter((r) => r !== room) }, layout: 'sentences',
  }
}
const WHERE: Record<string, Line> = Object.fromEntries(HOME.map((t) => [t.id, L(`Where's the ${t.en}?`, `${t.tr[0].toLocaleUpperCase('tr') + t.tr.slice(1)} nerede?`)]))
ROOMS.forEach(inThe)
const call: ChoiceRound['visual'] = { type: 'scene', items: phoneHouse, bg: 'house' }
export const phoneRounds: ChoiceRound[] = [yn('lamp', 'purple', true), yn('sofa', 'pink', false), whereRound('mirror', 'turquoise', call), yn('clock', 'yellow', true), whereRound('phone', 'pink', call), yn('mat', 'purple', false)]

export const DECOR: { id: string; h: number }[] = [
  { id: 'bed', h: 150 }, { id: 'sofa', h: 125 }, { id: 'table', h: 115 }, { id: 'chair', h: 120 }, { id: 'lamp', h: 115 }, { id: 'mirror', h: 145 }, { id: 'mat', h: 50 },
  { id: 'clock', h: 72 }, { id: 'phone', h: 62 }, { id: 'plant', h: 105 }, { id: 'vase', h: 95 }, { id: 'cushion', h: 60 }, { id: 'frame', h: 78 }, { id: 'lights', h: 52 },
]
