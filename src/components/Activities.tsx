import { useMemo, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, Star, Volume2 } from 'lucide-react'
import { Guide, TrButton, sayLine } from './Guide'
import { Pic, Scene } from './Pic'
import { Character } from './Character'
import { MicButton } from './Mic'
import { DragArea, Draggable, DropZone } from './Drag'
import { SentenceBuilder } from './SentenceBuilder'
import { SayItPill, outcomeFor } from './ChoiceActivity'
import { Confetti, StarBurst } from './Effects'
import { useStage } from './Stage'
import { useGame, type LevelId, type Skill } from '../store/gameStore'
import { PRAISE, TRY, pick, shuffle, type Line } from '../content/lines'
import { EXPLORE_DONE, REPEAT } from '../content/ui'
import { itIsSpec, word, type Word } from '../content/vocab'
import type { SceneItem } from '../content/types'
import type { BalloonRound } from '../content/school'
import type { Who } from '../assets/manifest'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
export const NextButton = ({ onClick, style, label = 'Next' }: { onClick: () => void; style?: React.CSSProperties; label?: string }) => (
  <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} className="btn btn-teal title-font pulse-glow" style={{ fontSize: 36, padding: '12px 40px', ...style }} onClick={onClick}>
    {label} <ArrowRight size={32} style={{ display: 'inline', verticalAlign: 'middle' }} />
  </motion.button>
)
/** praise / try again lines, spoken and shown */
export function useFeedback() {
  const [guide, setGuide] = useState<Line | null>(null)
  return {
    guide,
    setGuide,
    async praise(line?: Line) {
      const p = line ?? pick(PRAISE)
      setGuide(p)
      await sayLine(p)
    },
    async tryAgain(then: Line) {
      const t = pick(TRY)
      setGuide(t)
      await sayLine(t)
      setGuide(then)
    },
  }
}
function useRecord(level: LevelId) {
  const recordAttempt = useGame((s) => s.recordAttempt)
  return (activity: string, topic: string, skill: Skill, item: string, misses: number) => recordAttempt({ level, activity, skill, topic, item, outcome: outcomeFor(misses, false), misses })
}

// ------------------------------------------------------------------ explore words
export function Explore({ words, level, lead, onDone }: { words: Word[]; level: LevelId; lead: Line; onDone: () => void }) {
  const { portrait: P } = useStage()
  const [seen, setSeen] = useState<string[]>([])
  const [cur, setCur] = useState<Word | null>(null)
  const [guide, setGuide] = useState<Line>(lead)
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,245,255,0.35)' }}>
      <Guide line={guide} />
      <div style={{ position: 'absolute', left: P ? 24 : 60, top: P ? 290 : 160, width: P ? 852 : 1080, height: P ? 830 : 700, display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: P ? 18 : 20 }}>
        {words.map((w) => (
          <motion.button
            key={w.id}
            className={'card' + (cur?.id === w.id ? ' is-selected' : '')}
            aria-label={w.en}
            animate={cur?.id === w.id ? { y: [0, -18, 0], rotate: [0, -3, 3, 0] } : {}}
            onClick={() => {
              sfx.pop()
              setCur(w)
              setSeen((s) => (s.includes(w.id) ? s : [...s, w.id]))
              setGuide({ ...w.intro })
            }}
            style={{ width: P ? 262 : 250, height: P ? 250 : 210, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <Pic pic={w.pic} size={P ? 160 : 132} />
            <span className="title-font" style={{ fontSize: 30, fontWeight: 600, color: seen.includes(w.id) ? '#1f9c9c' : '#c9bfe0' }}>{seen.includes(w.id) ? w.en : '?'}</span>
          </motion.button>
        ))}
      </div>
      <div style={{ position: 'absolute', left: P ? 24 : 1170, top: P ? 1130 : 190, width: P ? 852 : 390, display: 'flex', flexDirection: P ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div className="panel title-font" style={{ padding: '8px 24px', fontSize: 30, fontWeight: 700, color: '#4a3a7a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={30} color="#e0a72e" fill="#f7d77b" /> {seen.length} / {words.length}
        </div>
        {cur && (
          <div className="panel" style={{ width: P ? 800 : 390, padding: 18, display: 'flex', flexDirection: P ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 14, position: 'relative' }}>
            <button className="btn btn-sun title-font" style={{ fontSize: 28, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => say(cur.itIs, 'alya')}>
              <Volume2 size={26} /> {cur.itIs}
            </button>
            <TrButton lines={[cur.intro]} />
            <MicButton
              key={cur.id}
              spec={itIsSpec(cur)}
              level={level}
              item={cur.id}
              size={92}
              label="Repeat!"
              onOutcome={(o) => {
                if (o.kind === 'correct' || o.kind === 'partial') {
                  sfx.correct()
                  sayLine(pick(PRAISE))
                } else if (o.kind === 'other-answer') sayLine(REPEAT)
              }}
            />
          </div>
        )}
        {seen.length === words.length && (
          <NextButton
            onClick={async () => {
              setGuide(EXPLORE_DONE)
              await sayLine(EXPLORE_DONE)
              onDone()
            }}
          />
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ balloons
const BCOL = ['#c08be0', '#40c9c6', '#f5a6c3', '#f7cf5e', '#8fb4f0']
export function Balloons({ rounds, level, activity, tiles, onDone }: { rounds: BalloonRound[]; level: LevelId; activity: string; tiles?: Record<string, string>; onDone: () => void }) {
  const { portrait: P, W, H } = useStage()
  const rec = useRecord(level)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [popped, setPopped] = useState<string | null>(null)
  const [gone, setGone] = useState<string[]>([])
  const busy = useRef(false)
  const r = rounds[i]
  async function tap(id: string) {
    if (busy.current) return
    if (id === r.id) {
      busy.current = true
      setPopped(id)
      sfx.pop()
      sfx.correct()
      rec(activity, r.topic, 'listening', r.id, misses)
      if (tiles) await say(r.id, 'alya')
      await fb.praise(r.after)
      if (r.after) await wait(1200)
      busy.current = false
      if (i + 1 >= rounds.length) return onDone()
      setPopped(null)
      setGone([])
      setMisses(0)
      fb.setGuide(null)
      setI(i + 1)
    } else {
      sfx.tryAgain()
      setMisses((m) => m + 1)
      setGone((g) => [...g, id])
      fb.tryAgain({ ...r.line })
    }
  }
  const n = r.options.length
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,245,255,0.3)' }}>
      <Guide line={fb.guide ?? r.line} />
      {r.options.map((o, k) => {
        const col = P ? (k % 2) * 400 + 250 + (k === 4 ? 200 : 0) : ((k + 0.5) * (W - 160)) / n + 80
        const row = P ? 420 + Math.floor(k / 2) * 350 : 300 + (k % 2) * 110
        const isPop = popped === o.id
        return (
          <motion.button
            key={r.id + o.id}
            aria-label={o.label ?? o.id}
            onClick={() => tap(o.id)}
            initial={{ y: H - row, opacity: 0 }}
            animate={isPop ? { scale: [1, 1.35, 1.2], opacity: 1, y: 0 } : gone.includes(o.id) ? { opacity: 0.25, y: 0 } : { y: [0, -24, 0], opacity: 1 }}
            transition={isPop || gone.includes(o.id) ? { duration: 0.4 } : { y: { duration: 3 + k * 0.3, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.4 } }}
            style={{ position: 'absolute', left: col - 105, top: row, width: 210, height: 300, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {!isPop && (
              <svg width="210" height="300" viewBox="0 0 210 300" style={{ position: 'absolute', inset: 0 }}>
                <path d="M105 232 q-18 30 4 66" stroke="#8a7aa8" strokeWidth="3" fill="none" />
                <ellipse cx="105" cy="115" rx="96" ry="112" fill={BCOL[k % 5]} />
                <path d="M92 224 L118 224 L105 240Z" fill={BCOL[k % 5]} />
                <ellipse cx="70" cy="70" rx="20" ry="32" fill="#fff" opacity="0.4" />
              </svg>
            )}
            <span className="title-font" style={{ position: 'absolute', inset: '0 0 75px', display: 'grid', placeItems: 'center', fontSize: 84, fontWeight: 700, color: isPop ? '#1f9c9c' : '#fff', textShadow: isPop ? 'none' : '0 4px 0 rgba(60,30,90,0.3)' }}>
              {o.label ?? <Pic pic={o.pic!} size={118} />}
            </span>
            {isPop && tiles && <span className="title-font panel" style={{ position: 'absolute', bottom: 0, left: -20, right: -20, fontSize: 44, fontWeight: 700, color: '#6a4fa3', padding: '2px 0' }}>{tiles[o.id].replace(/·/g, ' · ')}</span>}
          </motion.button>
        )
      })}
      <Dots n={rounds.length} i={i} />
    </div>
  )
}
export const Dots = ({ n, i }: { n: number; i: number }) => (
  <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
    {Array.from({ length: n }).map((_, k) => (
      <span key={k} style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #fff', background: k < i ? '#1f9c9c' : k === i ? '#f7d77b' : 'rgba(255,255,255,0.5)' }} />
    ))}
  </div>
)

// ------------------------------------------------------------------ build a question, then the teacher answers
export function BuildAsk({ items, level, lead, hint, onDone }: { items: { words: string[]; say: string; reply: Line; scene: SceneItem[] }[]; level: LevelId; lead: Line; hint: Line; onDone: () => void }) {
  const { portrait: P } = useStage()
  const rec = useRecord(level)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [answered, setAnswered] = useState(false)
  const it = items[i]
  async function next() {
    setAnswered(false)
    setMisses(0)
    if (i + 1 >= items.length) return onDone()
    setI(i + 1)
    fb.setGuide({ ...lead })
  }
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={fb.guide ?? lead} />
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 120, top: P ? 290 : 165, width: P ? 852 : 1360, height: P ? 1080 : 650, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        {answered ? (
          <>
            <Scene items={it.scene} width={P ? 760 : 640} />
            <SayItPill label="Now you ask!">
              <MicButton spec={{ accept: [it.say.replace(/[?.]/g, '')] }} level={level} item="question" size={84} label="" onOutcome={(o) => o.kind === 'correct' && (sfx.correct(), sayLine(it.reply))} />
            </SayItPill>
            <NextButton onClick={next} />
          </>
        ) : (
          <>
            <div style={{ position: 'relative', width: 260, height: P ? 330 : 250 }}>
              <Character who="teacher" pose="think" height={P ? 320 : 245} style={{ left: 60, bottom: 0 }} />
            </div>
            <SentenceBuilder
              key={i}
              words={it.words}
              onMiss={(m) => {
                setMisses(m)
                fb.tryAgain(hint)
              }}
              onSolved={async () => {
                sfx.correct()
                rec('ask', 'questions', 'grammar', it.words.join(' '), misses)
                await say(it.say, 'alya')
                setAnswered(true)
                fb.setGuide(it.reply)
                await sayLine(it.reply)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------ give things to people
export interface GiveRound {
  id: string
  pic: string
  owner: string
  line: Line
  say: string
  voice?: 'alya'
}
export function GiveTo({ rounds, owners, level, activity, topic, hint, header, onDone }: { rounds: GiveRound[]; owners: { who: Who; name: string }[]; level: LevelId; activity: string; topic: string; hint: Line; header?: (active: string) => ReactNode; onDone: () => void }) {
  const { portrait: P, W } = useStage()
  const rec = useRecord(level)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [given, setGiven] = useState<Record<string, string>>({})
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null)
  const busy = useRef(false)
  const r = rounds[i]
  const tray = useMemo(() => shuffle(rounds), [rounds])
  const cx = (k: number) => (P ? 125 + k * 216 : 250 + k * ((W - 500) / (owners.length - 1)))
  const speak = () => (r.voice === 'alya' ? say(r.line.en, 'alya') : sayLine(r.line))
  return (
    <DragArea
      onDrop={(item, target) => {
        if (busy.current) return false
        if (item === r.id && target === r.owner) {
          busy.current = true
          sfx.drop()
          sfx.correct()
          rec(activity, topic, 'listening', r.id, misses)
          setGiven((g) => ({ ...g, [item]: target }))
          const k = owners.findIndex((o) => o.who === target)
          setBurst({ x: cx(k), y: P ? 560 : 400, k: Date.now() })
          ;(async () => {
            await say(r.say, 'alya')
            await fb.praise()
            busy.current = false
            setMisses(0)
            if (i + 1 >= rounds.length) return onDone()
            fb.setGuide(null)
            setI(i + 1)
          })()
          return true
        }
        sfx.tryAgain()
        setMisses((m) => m + 1)
        fb.tryAgain(misses >= 1 ? hint : { ...r.line })
        return false
      }}
    >
      <Guide line={fb.guide ?? r.line} auto={!(r.voice === 'alya' && !fb.guide)} />
      {r.voice === 'alya' && !fb.guide && <AutoSay k={r.id} speak={speak} />}
      {header && <div style={{ position: 'absolute', left: 0, right: 0, top: P ? 280 : 150, display: 'flex', justifyContent: 'center' }}>{header(r.id)}</div>}
      {owners.map((o, k) => {
        const mine = Object.entries(given).filter(([, w]) => w === o.who)
        return (
          <DropZone key={o.who} id={o.who} label={o.name} style={{ position: 'absolute', left: cx(k) - (P ? 102 : 140), top: P ? 400 : 235, width: P ? 204 : 280, height: P ? 520 : 420, borderRadius: 40, background: 'rgba(255,255,255,0.55)' }}>
            <Character who={o.who} pose={mine.length && given[r.id] === undefined ? 'idle' : given[r.id] === o.who ? 'happy' : 'idle'} height={P ? 330 : 310} style={{ left: P ? 2 : 47, bottom: P ? 120 : 64 }} />
            <span className="title-font" style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 32, fontWeight: 700, color: '#4a3a7a' }}>{o.name}</span>
            <div style={{ position: 'absolute', bottom: 52, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
              {mine.map(([id]) => (
                <Pic key={id} pic={rounds.find((x) => x.id === id)!.pic} size={64} />
              ))}
            </div>
          </DropZone>
        )
      })}
      <div className="panel" style={{ position: 'absolute', left: P ? 24 : 150, right: P ? 24 : 150, top: P ? 990 : 672, height: P ? 500 : 205, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly', gap: 6, padding: 10 }}>
        {tray
          .filter((t) => !given[t.id])
          .map((t) => (
            <Draggable key={t.id} id={t.id} label={t.id}>
              <Pic pic={t.pic} size={P ? 190 : 150} />
            </Draggable>
          ))}
      </div>
      {burst && <StarBurst key={burst.k} x={burst.x} y={burst.y} />}
    </DragArea>
  )
}
function AutoSay({ k, speak }: { k: string; speak: () => unknown }) {
  const { portrait: P } = useStage()
  useMemo(() => {
    setTimeout(speak, 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k])
  return (
    <button className="btn btn-lav title-font" onClick={() => speak()} style={{ position: 'absolute', right: 22, top: P ? 282 : 150, zIndex: 25, fontSize: 24, padding: '8px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
      <Volume2 size={24} /> Alya
    </button>
  )
}

// ------------------------------------------------------------------ memory
export function Memory({ words, level, lead, onDone }: { words: Word[]; level: LevelId; lead: Line; onDone: () => void }) {
  const { portrait: P } = useStage()
  const rec = useRecord(level)
  const [guide, setGuide] = useState<Line>(lead)
  const cards = useMemo(() => shuffle(shuffle(words).slice(0, 6).flatMap((t) => [{ key: t.id + 'p', id: t.id, pic: true }, { key: t.id + 'w', id: t.id, pic: false }])), [words])
  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<string[]>([])
  const [fails, setFails] = useState<Record<string, number>>({})
  const lock = useRef(false)
  function flip(c: (typeof cards)[number]) {
    if (lock.current || open.includes(c.key) || found.includes(c.id)) return
    sfx.flip()
    const next = [...open, c.key]
    setOpen(next)
    if (next.length < 2) return
    lock.current = true
    const [a, b] = next.map((k) => cards.find((x) => x.key === k)!)
    const hit = a.id === b.id
    setTimeout(
      async () => {
        setOpen([])
        lock.current = false
        if (!hit) return setFails((f) => ({ ...f, [a.id]: (f[a.id] ?? 0) + 1 }))
        sfx.correct()
        rec('memory', 'memory', 'vocabulary', a.id, fails[a.id] ?? 0)
        const nf = [...found, a.id]
        setFound(nf)
        setGuide({ ...word(a.id).intro })
        if (nf.length === 6) {
          await wait(2600)
          onDone()
        }
      },
      hit ? 500 : 1300,
    )
  }
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,245,255,0.45)' }}>
      <Guide line={guide} />
      <div style={{ position: 'absolute', left: P ? 30 : 200, right: P ? 30 : 200, top: P ? 290 : 160, bottom: 60, display: 'grid', gridTemplateColumns: P ? 'repeat(3,1fr)' : 'repeat(4,1fr)', gap: 20 }}>
        {cards.map((c) => {
          const up = open.includes(c.key) || found.includes(c.id)
          const face: React.CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 26, border: '5px solid #fff', display: 'grid', placeItems: 'center' }
          return (
            <motion.button key={c.key} aria-label={up ? c.id : 'hidden card'} onClick={() => flip(c)} animate={{ rotateY: up ? 180 : 0 }} transition={{ duration: 0.4 }} style={{ position: 'relative', border: 'none', background: 'none', padding: 0, cursor: 'pointer', transformStyle: 'preserve-3d' }}>
              <div style={{ ...face, background: 'linear-gradient(135deg, #a884d6, #40c9c6)' }}>
                <Star size={66} color="#fff" fill="#f7d77b" />
              </div>
              <div style={{ ...face, transform: 'rotateY(180deg)', background: '#fffaf4', borderColor: found.includes(c.id) ? '#3fae6a' : '#fff' }}>
                {c.pic ? <Pic pic={word(c.id).pic} size={120} /> : <span className="title-font" style={{ fontSize: 36, fontWeight: 700, color: '#4a3a7a' }}>{word(c.id).en}</span>}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export { Confetti }
