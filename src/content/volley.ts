/** Level 5 – volleyball: every point = pass (listen), set (build a sentence), spike (say it). */
import { A, L, N, shuffle, type Line } from './lines'
import { ALL_WORDS, type Word } from './vocab'
import type { ChoiceRound } from './types'
import { findRounds } from './garden'
import { isThereRounds, manyRounds } from './school'
import { demRounds, whoseRounds } from './toys'
import { whichRounds, phoneRounds } from './house'

export const V = {
  intro: [L('Alya and Mia play against me!', 'Alya ve Mia bana karşı oynuyor!'), L('Pass: listen. Set: make a sentence. Spike: say it!', 'Pas: dinle. Set: cümle kur. Smaç: söyle!')],
  serve: L('Are you ready? Here comes the ball!', 'Hazır mısın? Top geliyor!'),
  passText: L('Which picture is it?', 'Hangi resim? Sarı hoparlöre dokunup kelimeyi tekrar dinleyebilirsin.'),
  set: L('Set! Make a sentence.', 'Set! Cümle kur.'),
  spike: L('Spike! Say it!', 'Smaç! Söyle!'),
  ohNo: L('Oh no!', 'Eyvah!'),
  mine: L("My point! Don't worry, let's play!", 'Benim sayım! Merak etme, oynayalım!'),
  keep: L("Don't worry, let's play!", 'Merak etme, oynayalım!'),
  point: [L('One point for you!', 'Sana bir sayı!'), L('Two points!', 'İki sayı!'), L('Three points!', 'Üç sayı!'), L('Four points! One more!', 'Dört sayı! Bir tane daha!'), L('Five points! You win!', 'Beş sayı! Kazandın!')],
  win: L('YOU DID IT! Volleyball Champion!', 'BAŞARDIN! Voleybol Şampiyonu!'),
  congrats: N('Congratulations, {name}! I am so proud of you!', 'Tebrikler, {name}! Seninle gurur duyuyorum!'),
}
export const WIN = 5

const FIND: Record<string, Line> = Object.fromEntries(ALL_WORDS.map((w) => [w.id, L(`${w.en[0].toUpperCase() + w.en.slice(1)}!`)]))
export function passRound(w: Word): ChoiceRound {
  return {
    id: w.id, topic: w.set + '-words', skill: 'listening', prompt: FIND[w.id], hideText: true, visual: { type: 'listen' },
    options: shuffle([w, ...shuffle(ALL_WORDS.filter((x) => x.set === w.set && x.id !== w.id && !x.en.includes(w.en) && !w.en.includes(x.en))).slice(0, 2)]).map((x) => ({ id: x.id, pic: x.pic, correct: x.id === w.id })),
    hint: L('Listen again carefully.', 'Tekrar dikkatle dinle.'), layout: 'pictures',
  }
}
const set = (s: string, tr: string) => ({ words: s.replace(/([.?])$/, ' $1').split(' '), say: A(s), line: L('Make this sentence!', tr) })
export const SETS = [
  set("Where's the cat?", 'Kedi nerede?'),
  set("It's under the table.", 'Masanın altında.'),
  set('How many desks are there?', 'Kaç tane sıra var?'),
  set('There are twelve pens.', 'On iki kalem var.'),
  set('Is there a ruler?', 'Cetvel var mı?'),
  set('These are kites.', 'Bunlar uçurtma.'),
  set('Whose is this robot?', 'Bu robot kimin?'),
  set("It's Leo's lorry.", 'Leo’nun kamyonu.'),
  set('The grey ones are his.', 'Gri olanlar onun.'),
  set('Which shoes are yours?', 'Hangi ayakkabılar senin?'),
]
export type SetItem = (typeof SETS)[number]
export const spikes = () => shuffle([...findRounds, ...manyRounds.slice(0, 2), ...isThereRounds.slice(0, 4), ...demRounds.slice(0, 4), ...whoseRounds, ...whichRounds, ...phoneRounds])
