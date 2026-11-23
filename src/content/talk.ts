/** Teacher Talk: the sentences the teacher says in lessons, with Turkish. Add a sentence = one line in PHRASES. */
import { A, L, shuffle, type Line } from './lines'
import type { ChoiceRound } from './types'

export interface Phrase {
  id: string
  line: Line
  icon: string // lucide icon name, see Talk.tsx
}
const ph = (id: string, en: string, tr: string, icon: string): Phrase => ({ id, line: L(en, tr), icon })

export const PHRASES: Phrase[] = [
  ph('listen', 'Listen to me, please.', 'Beni dinle lütfen.', 'ear'),
  ph('repeat', 'Repeat after me.', 'Benden sonra tekrar et.', 'repeat'),
  ph('read', 'Read, please.', 'Oku lütfen.', 'book'),
  ph('mean', 'What does that mean?', 'Bu ne demek?', 'help'),
  ph('look', 'Look at the picture.', 'Resme bak.', 'eye'),
  ph('answer', 'Answer the question.', 'Soruyu cevapla.', 'message'),
  ph('ask', 'Ask me a question.', 'Bana bir soru sor.', 'hand'),
  ph('again', 'Say it again, please.', 'Tekrar söyle lütfen.', 'rotate'),
  ph('louder', 'Speak louder, please.', 'Daha yüksek sesle konuş lütfen.', 'megaphone'),
  ph('write', 'Write it down, please.', 'Yaz lütfen.', 'pencil'),
  ph('understand', 'Do you understand?', 'Anladın mı?', 'bulb'),
  ph('ready', 'Are you ready?', 'Hazır mısın?', 'star'),
  ph('turn', "It's your turn.", 'Sıra sende.', 'user'),
  ph('english', 'How do you say it in English?', 'Bunu İngilizce nasıl söylersin?', 'languages'),
]
const tr = (id: string) => PHRASES.find((p) => p.id === id)!.line.tr!

export const TALK = {
  intro: [L('These are my sentences in our lessons.', 'Bunlar derste söylediğim cümleler.'), L('Listen, understand and answer me!', 'Dinle, anla ve bana cevap ver!')],
  titles: {
    learn: L('My Sentences', 'Cümlelerim'),
    mean: L('What Does That Mean?', 'Bu Ne Demek?'),
    act: L('Lesson Time', 'Ders Zamanı'),
  },
  learnLead: L('Tap a card. Listen, then repeat after me!', 'Bir karta dokun. Dinle, sonra benden sonra tekrar et!'),
  meanLead: L('Listen to me. What does that mean?', 'Beni dinle. Bu ne demek?'),
  actLead: L("It's lesson time! Do what I say.", 'Ders zamanı! Söylediğimi yap.'),
}

export function meanRounds(): ChoiceRound[] {
  return shuffle(PHRASES)
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      topic: 'teacher-talk',
      skill: 'listening',
      prompt: L(p.line.en),
      hideText: true,
      visual: { type: 'listen' },
      options: [p, ...shuffle(PHRASES.filter((x) => x.id !== p.id)).slice(0, 2)].map((x) => ({ id: x.id, label: x.line.tr!, correct: x.id === p.id })),
      hint: L('Listen again carefully.', 'Tekrar dikkatle dinle.'),
      layout: 'sentences',
    }))
}

const yes = A('Yes, I do.')
const dont = A("I don't understand.")
const rep = A('Can you repeat, please?')
const ready = A("Yes, I'm ready!")
const lamp = A('lamp')
const whereCat = A('Where is the cat?')
const sofa = A("It's a sofa.")
const sentence = A('The lamp is on the table.')
const its = A("It's a pencil.")

/** The teacher says a sentence; the child shows that she understood by doing the right thing. */
export const actRounds: ChoiceRound[] = [
  {
    id: 'ready', topic: 'teacher-talk', skill: 'speaking', prompt: L('Are you ready?', tr('ready')), visual: { type: 'person', who: 'teacher', pose: 'talk' },
    options: [{ id: 'y', label: ready, correct: true, say: ready }, { id: 'n', label: its, correct: false }], hint: L("Say: Yes, I'm ready!", 'Şöyle de: [[Yes, I’m ready!]]'),
    speak: { accept: ['yes i am ready', "i'm ready", 'yes i am'], pattern: /\bready\b/ }, layout: 'sentences',
  },
  {
    id: 'repeat', topic: 'teacher-talk', skill: 'speaking', prompt: L('Repeat after me: lamp!', 'Benden sonra tekrar et: [[lamp!]]'), visual: { type: 'object', pic: 'obj/lamp' },
    options: [{ id: 'l', label: lamp, correct: true, say: lamp }, { id: 's', label: A('sofa'), correct: false }, { id: 'm', label: A('mirror'), correct: false }], hint: L('Say the same word!', 'Aynı kelimeyi söyle!'),
    speak: { accept: ['lamp'], rivals: ['sofa', 'mirror'] }, layout: 'sentences',
  },
  {
    id: 'mean', topic: 'teacher-talk', skill: 'vocabulary', prompt: L('Mirror. What does that mean?', '[[Mirror.]] Bu ne demek?'), visual: { type: 'text', text: 'mirror' },
    options: [{ id: 'a', label: 'ayna', correct: true }, { id: 's', label: 'saat', correct: false }, { id: 'k', label: 'kanepe', correct: false }], hint: L('Tell me the Turkish word.', 'Türkçesini söyle.'), layout: 'sentences',
  },
  {
    id: 'read', topic: 'teacher-talk', skill: 'speaking', prompt: L('Read, please.', tr('read')), visual: { type: 'text', text: sentence },
    options: [{ id: 'r', label: sentence, correct: true, say: sentence }, { id: 'w', label: A('The lamp is under the table.'), correct: false }], hint: L('Read the sentence aloud.', 'Cümleyi sesli oku.'),
    speak: { accept: ['the lamp is on the table'], rivals: ['under'] }, layout: 'sentences',
  },
  {
    id: 'look', topic: 'teacher-talk', skill: 'speaking', prompt: L("Look at the picture. What's this?", 'Resme bak. Bu ne?'), visual: { type: 'object', pic: 'obj/sofa' },
    options: [{ id: 's', label: sofa, correct: true, say: sofa }, { id: 'c', label: A("It's a clock."), correct: false }, { id: 'p', label: A("It's a phone."), correct: false }], hint: L("Say: It's a ...", 'Şöyle de: [[It’s a]] ...'),
    speak: { accept: ["it's a sofa"], keyword: 'sofa', rivals: ['clock', 'phone'] }, layout: 'sentences',
  },
  {
    id: 'ask', topic: 'teacher-talk', skill: 'speaking', prompt: L('Ask me a question.', tr('ask')), visual: { type: 'person', who: 'teacher', pose: 'idle' },
    options: [{ id: 'q', label: whereCat, correct: true, say: whereCat }, { id: 'a', label: A('It is under the table.'), correct: false }, { id: 'y', label: A('Yes, it is.'), correct: false }], hint: L('A question asks something. Look for the question mark.', 'Soru bir şey sorar. Soru işaretini ara.'),
    after: L('Good question! The cat is on the sofa.', 'Güzel soru! Kedi kanepenin üstünde.'), speak: { accept: ['where is the cat'], pattern: /^(where|what|who|whose|how many|which|is there|are there|can|do|are|is)\b/ }, layout: 'sentences',
  },
  {
    id: 'english', topic: 'teacher-talk', skill: 'vocabulary', prompt: L('How do you say it in English?', tr('english')), visual: { type: 'object', pic: 'cat/sit' },
    options: [{ id: 'c', label: A('cat'), correct: true, say: 'cat' }, { id: 'd', label: A('desk'), correct: false }, { id: 'k', label: A('kite'), correct: false }], hint: L('Look at the picture.', tr('look')), speak: { accept: ['cat', "it's a cat", 'a cat'], rivals: ['desk', 'kite'] }, layout: 'sentences',
  },
  {
    id: 'understand', topic: 'teacher-talk', skill: 'speaking', prompt: L('Do you understand?', tr('understand')), visual: { type: 'person', who: 'teacher', pose: 'think' },
    options: [{ id: 'y', label: yes, correct: true, say: yes }, { id: 'n', label: dont, correct: true, say: dont }, { id: 'r', label: rep, correct: true, say: rep }, { id: 'x', label: its, correct: false }],
    hint: L("You can say: Yes, I do. Or: I don't understand.", 'Anladıysan: [[Yes, I do.]] Anlamadıysan: [[I don’t understand.]]'), after: L('Thank you for telling me!', 'Söylediğin için teşekkürler!'),
    speak: { accept: ['yes i do', "i don't understand", 'can you repeat please', 'yes'], pattern: /understand|repeat|yes/ }, layout: 'sentences',
  },
]
