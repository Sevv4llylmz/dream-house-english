import { useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Camera, Volume2 } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, SayItPill, outcomeFor } from '../components/ChoiceActivity'
import { Balloons, Explore, GiveTo, Memory, NextButton, useFeedback, Dots } from '../components/Activities'
import { Guide, sayLine } from '../components/Guide'
import { MicButton } from '../components/Mic'
import { useScene, useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { TY, TOYS, OWNER, SOUND_TILES, demLine, demRounds, demWhy, ownerRounds, photoRounds, soundRounds, whoseRounds, type Dem, type Owner } from '../content/toys'
import { img, size } from '../assets/manifest'
import { shuffle } from '../content/lines'
import { word } from '../content/vocab'
import { DemLesson } from './DemLesson'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function Toys() {
  const sounds = useMemo(soundRounds, [])
  return (
    <LevelShell
      level="toys"
      bg="toyRoom"
      intro={TY.intro}
      activities={[
        { key: 'words', title: TY.titles.words, render: (d) => <Explore words={TOYS} level="toys" lead={TY.wordsLead} onDone={d} /> },
        { key: 'sounds', title: TY.titles.sounds, render: (d) => <Balloons rounds={sounds} level="toys" activity="sound-balloons" tiles={SOUND_TILES} onDone={d} /> },
        { key: 'photo', title: TY.titles.photo, render: (d) => <Photo onDone={d} /> },
        { key: 'choose', title: TY.titles.choose, render: (d) => <ChoiceActivity rounds={demRounds} level="toys" activity="this-that" onDone={d} /> },
        { key: 'owner', title: TY.titles.owner, render: (d) => <GiveTo rounds={ownerRounds} owners={(['alya', 'mia', 'leo', 'teacher'] as Owner[]).map((o) => ({ who: o, name: OWNER[o].en }))} level="toys" activity="owners" topic="whose-listen" hint={TY.ownerHint} onDone={d} /> },
        { key: 'whose', title: TY.titles.whose, render: (d) => <ChoiceActivity rounds={whoseRounds} level="toys" activity="whose" onDone={d} /> },
        { key: 'memory', title: TY.titles.memory, render: (d) => <Memory words={TOYS} level="toys" lead={TY.memoryLead} onDone={d} /> },
      ]}
    />
  )
}

const DEMS: Dem[] = ['this', 'these', 'that', 'those']

/** Photo time: the same toy is near (table) and far (shelf), one and many. */
function Photo({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const T = useScene().toy
  const record = useGame((s) => s.recordAttempt)
  const fb = useFeedback()
  const rounds = useMemo(photoRounds, [])
  const [teach, setTeach] = useState(true)
  const [i, setI] = useState(0)
  const [misses, setMisses] = useState(0)
  const [shot, setShot] = useState<Dem | null>(null)
  const [flash, setFlash] = useState(0)
  // Next comes only after the sentence and the praise, so they can never cut off the next instruction
  const [ready, setReady] = useState(false)
  const busy = useRef(false)
  const r = rounds[i]
  const spots = useMemo(() => {
    const near = shuffle(T.nearX)
    const far = shuffle(T.farX)
    return { this: [near[0], T.nearY, T.nearH], these: [near[1], T.nearY, T.nearH * 0.82], that: [far[0], T.farY, T.farH], those: [far[1], T.farY, T.farH * 0.82] } as Record<Dem, number[]>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, P])
  const line = demLine(r.dem, r.id)
  async function tap(d: Dem) {
    if (busy.current) return
    if (d === r.dem) {
      busy.current = true
      fb.cancel()
      setFlash(Date.now())
      sfx.click()
      sfx.correct()
      setShot(d)
      record({ level: 'toys', activity: 'photo', skill: 'listening', topic: 'photo-dem', item: r.dem, outcome: outcomeFor(misses, false), misses })
      await say(line.say, 'alya')
      await fb.praise()
      setReady(true)
      busy.current = false
    } else {
      sfx.tryAgain()
      setMisses((m) => m + 1)
      fb.tryAgain(misses >= 1 ? { ...line.line } : demWhy[r.dem])
    }
  }
  function next() {
    setShot(null)
    setReady(false)
    setMisses(0)
    fb.setGuide(null)
    if (i + 1 >= rounds.length) onDone()
    else setI(i + 1)
  }
  if (teach) return <DemLesson onDone={() => setTeach(false)} />
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={fb.guide ?? line.line} />
      {DEMS.map((d) => {
        const [x, y, h0] = spots[d]
        const n = d === 'this' || d === 'that' ? 1 : 3
        // wide toys (camera, tablet) are made smaller so that the groups never overlap
        const [sw, sh] = size(word(r.id).pic)
        const room = d === 'this' || d === 'these' ? (P ? 330 : 520) : P ? 205 : 330
        const h = Math.min(h0, room / ((sw / sh) * n - 0.12 * (n - 1)))
        return (
          <button key={d} aria-label={d} data-dem={import.meta.env.DEV ? String(d === r.dem) : undefined} onClick={() => tap(d)} style={{ position: 'absolute', left: x, top: y - h - 14, transform: 'translateX(-50%)', background: shot === d ? 'rgba(255,255,255,0.85)' : 'none', border: shot === d ? '8px solid #fff' : '8px solid transparent', borderRadius: 20, padding: 6, display: 'flex', alignItems: 'flex-end', cursor: 'pointer', boxShadow: shot === d ? '0 8px 24px rgba(60,40,90,.35)' : 'none' }}>
            {Array.from({ length: n }).map((_, k) => (
              <img key={k} src={img(word(r.id).pic)} alt={r.id} draggable={false} style={{ height: h, marginLeft: k ? -h * 0.12 : 0, filter: 'drop-shadow(0 6px 5px rgba(60,40,90,.25))' }} />
            ))}
          </button>
        )
      })}
      {!!flash && <motion.div key={flash} initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', inset: 0, background: '#fff', pointerEvents: 'none', zIndex: 50 }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 50, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        {!shot ? (
          <button className="card title-font" aria-label="Listen to the sentence" onClick={() => sayLine(line.line)} style={{ fontSize: 40, padding: '10px 30px', fontWeight: 700, color: '#4a3a7a', display: 'flex', alignItems: 'center', gap: 18 }}>
            <Camera size={58} color="#fff" style={{ background: '#8a6cc9', borderRadius: 16, padding: 8 }} />
            {line.say}
            <Volume2 size={40} color="#e0a72e" />
          </button>
        ) : (
          <>
            <button className="card title-font" style={{ fontSize: 36, padding: '12px 28px', fontWeight: 600, color: '#4a3a7a' }} onClick={() => say(line.say, 'alya')}>
              {line.say}
              <span style={{ display: 'block', fontSize: 30, fontWeight: 800, color: '#e0709b', fontFamily: 'var(--font-body)' }}>{line.tr}</span>
            </button>
            <SayItPill label="Repeat!">
              <MicButton key={i} spec={{ accept: [line.say] }} level="toys" item={r.dem} size={80} label="" repeat={line.say} />
            </SayItPill>
            {ready && <NextButton onClick={next} />}
          </>
        )}
      </div>
      <Dots n={rounds.length} i={i} />
    </div>
  )
}
