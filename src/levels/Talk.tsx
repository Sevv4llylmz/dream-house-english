import { useMemo, useState } from 'react'
import { BookOpen, CircleHelp, Ear, Eye, Hand, Languages, Lightbulb, Megaphone, MessageCircle, Pencil, Repeat, RotateCcw, Star, UserRound, Volume2, X } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, SayItPill } from '../components/ChoiceActivity'
import { NextButton } from '../components/Activities'
import { Guide, TrButton, sayLine } from '../components/Guide'
import { Character } from '../components/Character'
import { MicButton } from '../components/Mic'
import { useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { PHRASES, TALK, actRounds, meanRounds, type Phrase } from '../content/talk'
import { sfx } from '../audio/sfx'

const ICON: Record<string, typeof Ear> = { ear: Ear, repeat: Repeat, book: BookOpen, help: CircleHelp, eye: Eye, message: MessageCircle, hand: Hand, rotate: RotateCcw, megaphone: Megaphone, pencil: Pencil, bulb: Lightbulb, star: Star, user: UserRound, languages: Languages }

export function Talk() {
  const mean = useMemo(meanRounds, [])
  return (
    <LevelShell
      level="talk"
      bg="classroom"
      intro={TALK.intro}
      activities={[
        { key: 'learn', title: TALK.titles.learn, render: (d) => <Cards onDone={d} /> },
        { key: 'mean', title: TALK.titles.mean, render: (d) => <ChoiceActivity rounds={mean} level="talk" activity="what-does-that-mean" lead={TALK.meanLead} onDone={d} /> },
        { key: 'act', title: TALK.titles.act, render: (d) => <ChoiceActivity rounds={actRounds} level="talk" activity="lesson-time" lead={TALK.actLead} requeue={false} onDone={d} /> },
      ]}
    />
  )
}

/** All teacher sentences as cards: English voice, Turkish text + voice, repeat with the microphone. */
function Cards({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const assist = useGame((s) => s.settings.assist)
  const [seen, setSeen] = useState<string[]>([])
  const [cur, setCur] = useState<Phrase | null>(null)
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,245,255,0.4)' }}>
      <Guide line={TALK.learnLead} auto={!cur} />
      <div style={{ position: 'absolute', left: P ? 24 : 130, right: P ? 24 : 40, top: P ? 285 : 170, display: 'grid', gridTemplateColumns: P ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16 }}>
        {PHRASES.map((p) => {
          const I = ICON[p.icon]
          const ok = seen.includes(p.id)
          return (
            <button
              key={p.id}
              className="card"
              onClick={() => {
                sfx.pop()
                setCur(p)
                setSeen((s) => (s.includes(p.id) ? s : [...s, p.id]))
                sayLine(p.line)
              }}
              style={{ height: P ? 142 : 150, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', borderColor: ok ? '#8fe0dc' : '#fff' }}
            >
              <span style={{ width: 62, height: 62, borderRadius: 20, background: ok ? '#1f9c9c' : '#b79be0', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <I size={36} color="#fff" />
              </span>
              <span className="title-font" style={{ fontSize: 28, fontWeight: 600, color: '#4a3a7a', lineHeight: 1.12 }}>{p.line.en}</span>
            </button>
          )
        })}
        {seen.length >= PHRASES.length && !cur && (
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <NextButton onClick={onDone} />
          </div>
        )}
      </div>
      <div className="title-font" style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center', fontSize: 30, fontWeight: 700, color: '#4a3a7a' }}>
        <span className="panel" style={{ padding: '4px 22px' }}>{seen.length} / {PHRASES.length}</span>
      </div>
      {cur && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(74,58,122,0.45)', zIndex: 40, display: 'grid', placeItems: 'center' }} onClick={() => setCur(null)}>
          <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: P ? 820 : 1060, padding: P ? '40px 30px' : '34px 40px 34px 330px', position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <button className="btn btn-cream" aria-label="Close" onClick={() => setCur(null)} style={{ position: 'absolute', top: 14, right: 14, width: 60, height: 60, display: 'grid', placeItems: 'center' }}>
              <X size={32} />
            </button>
            {!P && <Character who="teacher" pose="talk" height={400} style={{ left: 40, bottom: 14 }} />}
            <div className="title-font" style={{ fontSize: 56, fontWeight: 700, color: '#1f9c9c', lineHeight: 1.1, padding: '0 60px' }}>{cur.line.en}</div>
            {assist && <div style={{ fontSize: 40, fontWeight: 800, color: '#e0709b' }}>{cur.line.tr}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <button className="btn btn-sun title-font" style={{ fontSize: 30, padding: '12px 26px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => sayLine(cur.line)}>
                <Volume2 size={30} /> Listen
              </button>
              <TrButton lines={[cur.line]} style={{ width: 110, height: 64, fontSize: 28 }} />
              <SayItPill label="Repeat!">
                <MicButton key={cur.id} spec={{ accept: [cur.line.en.replace(', please', ''), cur.line.en] }} level="talk" item={cur.id} size={84} label="" repeat={cur.line.en} repeatVoice="teacher" />
              </SayItPill>
            </div>
            <NextButton
              label="Next"
              onClick={() => {
                const k = PHRASES.findIndex((x) => x.id === cur.id)
                const n = PHRASES.slice(k + 1).concat(PHRASES).find((x) => !seen.includes(x.id))
                if (!n) return setCur(null)
                setCur(n)
                setSeen((s) => [...s, n.id])
                sayLine(n.line)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
