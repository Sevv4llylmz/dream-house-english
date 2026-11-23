/** Level metadata: names, places, rewards. */
import { L, type Line } from './lines'

export type LevelKey = 'talk' | 'garden' | 'school' | 'toys' | 'house' | 'volley'
export interface LevelMeta {
  id: LevelKey
  num: number
  title: string
  place: string
  name: Line
  reward: string
  rewardLine: Line
  icon: 'talk' | 'cat' | 'school' | 'toy' | 'home' | 'trophy'
  colour: string
}
const key = (n: string, tr: string) => L(`You won the ${n}!`, `${tr} kazandın!`)

export const LEVELS: LevelMeta[] = [
  { id: 'garden', num: 1, title: 'Hide and Seek', place: 'Garden', name: L('Hide and Seek! Where is the cat?', 'Saklambaç! Kedi nerede?'), reward: 'Garden Key', rewardLine: key('Garden Key', 'Bahçe anahtarını'), icon: 'cat', colour: '#4fa86a' },
  { id: 'school', num: 2, title: 'Class Detective', place: 'School', name: L('Class Detective! Look and count.', 'Sınıf Dedektifi! Bak ve say.'), reward: 'School Key', rewardLine: key('School Key', 'Okul anahtarını'), icon: 'school', colour: '#8a6cc9' },
  { id: 'toys', num: 3, title: 'Lost Toys', place: 'Toy Shop', name: L('Lost Toys! Whose toy is this?', 'Kayıp Oyuncaklar! Bu oyuncak kimin?'), reward: 'Toy Key', rewardLine: key('Toy Key', 'Oyuncak anahtarını'), icon: 'toy', colour: '#e58fb0' },
  { id: 'house', num: 4, title: 'Dream House', place: 'My House', name: L("Dream House! Let's make a beautiful house.", 'Rüya Evi! Hadi güzel bir ev yapalım.'), reward: 'House Key', rewardLine: key('House Key', 'Ev anahtarını'), icon: 'home', colour: '#1f9c9c' },
  { id: 'volley', num: 5, title: 'Volleyball Cup', place: 'Sports Hall', name: L('The Volleyball Cup! Pass, set and spike!', 'Voleybol Kupası! Pas, set ve smaç!'), reward: 'Volleyball Cup', rewardLine: L('You won the Volleyball Cup!', 'Voleybol kupasını kazandın!'), icon: 'trophy', colour: '#e0a72e' },
  { id: 'talk', num: 6, title: 'Teacher Talk', place: 'Lesson time', name: L('Teacher Talk! Let’s learn what I say in our lessons.', 'Öğretmen Cümleleri! Derste söylediklerimi öğrenelim.'), reward: 'Super Student Star', rewardLine: L('You won the Super Student Star!', 'Süper Öğrenci yıldızını kazandın!'), icon: 'talk', colour: '#d9739a' },
]
export const levelMeta = (id: LevelKey) => LEVELS.find((l) => l.id === id)!
