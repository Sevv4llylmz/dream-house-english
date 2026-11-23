import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Map as MapIcon, Settings as Gear, Play, RotateCcw, Trophy, Volume2 } from 'lucide-react'
import { Backdrop, useScene, useStage } from '../components/Stage'
import { Character } from '../components/Character'
import { Guide, TrButton, sayLine } from '../components/Guide'
import { TopButton } from '../components/LevelShell'
import { OptionButton, VisualView, outcomeFor } from '../components/ChoiceActivity'
import { BuiltTr, SentenceBuilder } from '../components/SentenceBuilder'
import { InPill, MicButton, type MicOutcome } from '../components/Mic'
import { Confetti, StarBurst, TrophyArt } from '../components/Effects'
import { wait } from '../components/Activities'
import { img } from '../assets/manifest'
import { useGame, reviewKeys } from '../store/gameStore'
import { levelMeta } from '../content/meta'
import { SETS, V, WIN, passRound, spikes, type SetItem } from '../content/volley'
import { ALL_WORDS } from '../content/vocab'
import { PRAISE, SAID, UI, named, pick, plainTr, shuffle, type Line } from '../content/lines'
import type { ChoiceRound, Option } from '../content/types'
import { sfx } from '../audio/sfx'
import { say, stopVoice } from '../audio/voice'

type Q = { kind: 'pass' | 'spike'; round: ChoiceRound } | { kind: 'set'; item: SetItem }
type Pt = { x: number; y: number }
type Res = 'right' | 'wrong'

/**
 * Rules: a rally is pass (listen) -> set (build the sentence) -> spike (say it). Three right answers = 1 point,
 * first to 5 wins. A wrong answer: "Oh no!", the right answer turns green and is spoken, the Teacher gets the point.
 * Her score stops at 4, so Alya always wins in the end. Microphone problems never lose a point.
 */
export function Volley() {
  const go = useGame((s) => s.go)
  const name = useGame((s) => s.playerName) ?? 'Alya'
  const completeLevel = useGame((s) => s.completeLevel)
  const addTime = useGame((s) => s.addTime)
  const reduced = useGame((s) => s.settings.reducedMotion)
  const { portrait: P, W } = useStage()
  const C = useScene().court
  const [phase, setPhase] = useState<'intro' | 'play' | 'victory'>('intro')
  const [score, setScore] = useState({ a: 0, t: 0 })
  const sc = useRef({ a: 0, t: 0 })
  const [pose, setPose] = useState({ alya: 'ready', mia: 'ready', teacher: 'ready' })
  const [alyaX, setAlyaX] = useState(0)
  const [guide, setGuide] = useState<Line | null>(null)
  const [q, setQ] = useState<Q | null>(null)
  const [qKey, setQKey] = useState(0)
  const [cheer, setCheer] = useState(false)
  const [burst, setBurst] = useState(0)
  const ball = useRef<HTMLImageElement>(null)
  const alive = useRef(true)
  const pool = useRef<{ pass: ChoiceRound[]; set: SetItem[]; spike: ChoiceRound[] }>({ pass: [], set: [], spike: [] })
  const answer = useRef<(r: Res) => void>(() => {})

  useEffect(() => {
    alive.current = true
    const t = setInterval(() => document.visibilityState === 'visible' && addTime(5000), 5000)
    return () => {
      alive.current = false
      clearInterval(t)
      stopVoice()
    }
  }, [addTime])
  useEffect(() => {
    if (phase === 'intro') sayLine(levelMeta('volley').name).then((ok) => ok && sayLine(V.intro[0])).then((ok) => ok && sayLine(V.intro[1]))
  }, [phase])

  const top = C.ground - C.H
  const D = P ? 46 : 52
  const hit = { t: { x: C.teacher - 60, y: top + 70 }, a: { x: C.alya + 62, y: C.ground - 105 }, m: { x: C.mia + 45, y: top - 8 }, s: { x: C.spikeX + 40, y: top - 40 } }
  function place(p: Pt, rot: number) {
    if (ball.current) ball.current.style.transform = `translate(${p.x - D / 2}px, ${p.y - D / 2}px) rotate(${rot}deg)`
  }
  function arc(a: Pt, b: Pt, peak: number, ms: number) {
    const dur = reduced ? ms / 2 : ms
    return new Promise<void>((res) => {
      const h = Math.max(20, Math.min(a.y, b.y) - peak)
      const t0 = performance.now()
      // safety net: hidden tabs pause animation frames
      const done = setTimeout(() => (place(b, 0), res()), dur + 400)
      const step = (now: number) => {
        if (!alive.current) return res()
        const t = Math.min(1, (now - t0) / dur)
        place({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - 4 * h * t * (1 - t) }, t * 360)
        if (t < 1) requestAnimationFrame(step)
        else {
          clearTimeout(done)
          res()
        }
      }
      requestAnimationFrame(step)
    })
  }
  const set = (p: Partial<typeof pose>) => setPose((o) => ({ ...o, ...p }))
  function take<K extends 'pass' | 'set' | 'spike'>(k: K) {
    const pl = pool.current
    if (!pl.pass.length) {
      const rev = reviewKeys(useGame.getState().review).map((x) => x.split(':')[1])
      const ws = shuffle(ALL_WORDS).sort((x, y) => Number(rev.includes(y.id)) - Number(rev.includes(x.id)))
      pl.pass = ws.slice(0, 12).map(passRound)
    }
    if (!pl.set.length) pl.set = shuffle(SETS)
    if (!pl.spike.length) pl.spike = spikes()
    return pl[k].shift()!
  }
  function question(nq: Q, line: Line) {
    setGuide(line)
    setQ(nq)
    setQKey((k) => k + 1)
    return new Promise<Res>((res) => (answer.current = res)).then((r) => {
      setQ(null)
      return r
    })
  }
  async function lose(from: Pt) {
    set({ alya: 'sad', mia: 'sad' })
    await arc(from, { x: from.x + 70, y: C.ground - 10 }, from.y - 20, 500)
    sfx.bounce()
    const max = sc.current.t >= WIN - 1
    sc.current = { ...sc.current, t: Math.min(WIN - 1, sc.current.t + 1) }
    setScore(sc.current)
    set({ teacher: 'win' })
    const l = max ? V.keep : V.mine
    setGuide(l)
    await sayLine(l)
  }
  async function rally() {
    while (alive.current) {
      setAlyaX(0)
      setCheer(false)
      set({ alya: 'ready', mia: 'ready', teacher: 'ready' })
      place(hit.t, 0)
      setGuide(V.serve)
      await sayLine(V.serve)
      if (!alive.current) return
      set({ teacher: 'spike' })
      sfx.hit()
      await arc(hit.t, hit.a, C.netTop - 60, 1000)
      set({ teacher: 'ready' })
      if (!alive.current) return
      // 1 pass
      if ((await question({ kind: 'pass', round: take('pass') as ChoiceRound }, V.passText)) === 'wrong') {
        await lose(hit.a)
        continue
      }
      set({ alya: 'pass' })
      sfx.hit()
      await arc(hit.a, hit.m, C.netTop - 20, 800)
      set({ alya: 'ready', mia: 'set' })
      // 2 set
      if ((await question({ kind: 'set', item: take('set') as SetItem }, V.set)) === 'wrong') {
        await lose(hit.m)
        continue
      }
      sfx.hit()
      setAlyaX(C.spikeX - C.alya)
      await arc(hit.m, hit.s, hit.s.y - 70, 800)
      set({ mia: 'ready', alya: 'spike' })
      // 3 spike
      if ((await question({ kind: 'spike', round: take('spike') as ChoiceRound }, V.spike)) === 'wrong') {
        await lose(hit.s)
        continue
      }
      sfx.whoosh()
      sfx.hit()
      await arc(hit.s, { x: C.teacher + 90, y: C.ground - 15 }, hit.s.y - 10, 480)
      sfx.bounce()
      sc.current = { ...sc.current, a: sc.current.a + 1 }
      setScore(sc.current)
      setBurst(Date.now())
      setCheer(true)
      set({ alya: 'win', mia: 'win', teacher: 'sad' })
      sfx.sparkle()
      const l = V.point[sc.current.a - 1]
      setGuide(l)
      await sayLine(l)
      if (sc.current.a >= WIN) {
        completeLevel('volley')
        setPhase('victory')
        sfx.fanfare()
        await wait(500)
        await sayLine(V.win)
        await say(named(V.congrats.en, name))
        return
      }
      await wait(300)
    }
  }
  const begin = () => {
    stopVoice()
    sfx.click()
    sc.current = { a: 0, t: 0 }
    setScore(sc.current)
    pool.current = { pass: [], set: [], spike: [] }
    setPhase('play')
    setTimeout(rally, 300)
  }
  const ch = (who: 'alyav' | 'miav' | 'teacherv', p: string, x: number) => <Character who={who} pose={p} height={C.H} style={{ left: x - C.H * 0.3, top }} />
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop bg="court" />
      {(['a', 't'] as const).map((k) => {
        const p = k === 'a' ? C.scoreA : C.scoreT
        return (
          <div key={k}>
            <span className="title-font" style={{ position: 'absolute', left: p.x - 80, width: 160, top: p.y - C.scoreSize * 0.56, textAlign: 'center', fontSize: C.scoreSize * 0.28, fontWeight: 600, color: k === 'a' ? '#8ff0ec' : '#dcc3f7' }}>{k === 'a' ? 'Alya & Mia' : 'Teacher'}</span>
            <motion.span key={score[k]} data-testid={'score-' + k} initial={{ scale: 1.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="title-font" style={{ position: 'absolute', left: p.x - 80, width: 160, top: p.y - C.scoreSize * 0.33, lineHeight: `${C.scoreSize}px`, textAlign: 'center', fontSize: C.scoreSize, fontWeight: 700, color: k === 'a' ? '#8ff0ec' : '#dcc3f7' }}>
              {score[k]}
            </motion.span>
          </div>
        )
      })}
      {/* fans in the stands */}
      <Character who="leo" pose={cheer ? 'happy' : 'idle'} height={P ? 120 : 135} style={{ left: C.fans.x, top: C.fans.y - (P ? 120 : 135) }} />
      <img src={img(cheer ? 'cat/jump' : 'cat/sit')} alt="cat" style={{ position: 'absolute', height: P ? 70 : 80, left: C.fans.x + (P ? 70 : 85), top: C.fans.y - (P ? 70 : 80) }} />
      {phase !== 'victory' && (
        <>
          {ch('miav', pose.mia, C.mia)}
          <motion.div initial={false} animate={{ x: alyaX }} transition={{ duration: 0.7 }} style={{ position: 'absolute', left: 0, top: 0 }}>
            {ch('alyav', pose.alya, C.alya)}
          </motion.div>
          {ch('teacherv', pose.teacher, C.teacher)}
          <img ref={ball} src={img('obj/volleyball')} alt="ball" style={{ position: 'absolute', left: 0, top: 0, width: D, zIndex: 15, opacity: phase === 'play' ? 1 : 0, pointerEvents: 'none', filter: q ? 'drop-shadow(0 0 10px #fff6b0)' : undefined }} />
        </>
      )}
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: P ? 'row' : 'column', gap: 12, zIndex: 30 }}>
        <TopButton label="Back to map" onClick={() => go({ name: 'map' })}>
          <MapIcon size={40} color="#4a3a7a" />
        </TopButton>
        <TopButton label="Settings" onClick={() => go({ name: 'settings', back: 'map' })}>
          <Gear size={38} color="#4a3a7a" />
        </TopButton>
      </div>
      {guide && phase === 'play' && <Guide line={guide} auto={false} width={1060} />}
      {phase === 'play' && (
        <div className="title-font panel" style={{ position: 'absolute', right: P ? 20 : 24, top: P ? 34 : 30, padding: '6px 18px', display: 'flex', gap: 12, fontSize: 26, fontWeight: 700, zIndex: 22 }}>
          {(['pass', 'set', 'spike'] as const).map((k) => (
            <span key={k} style={{ color: q?.kind === k ? '#1f9c9c' : '#c3b7dc', textDecoration: q?.kind === k ? 'underline' : 'none' }}>{k}</span>
          ))}
        </div>
      )}
      {q && phase === 'play' && (
        <motion.div key={qKey} data-testid="q" initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 20 }} className="panel" style={{ position: 'absolute', left: C.card.x, top: C.card.y, width: C.card.w, height: C.card.h, zIndex: 25, display: 'grid', placeItems: 'center', padding: 8, boxSizing: 'border-box' }}>
          <Question q={q} setGuide={setGuide} onMood={(m) => set({ alya: m })} onResult={(r) => answer.current(r)} />
        </motion.div>
      )}
      {burst > 0 && <StarBurst key={burst} x={C.teacher} y={C.ground - 60} n={12} />}

      {phase === 'intro' && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(250,245,255,0.35)' }}>
          <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="panel" style={{ width: P ? 820 : 720, padding: '30px 40px', textAlign: 'center', position: 'relative' }}>
            <TrButton lines={[levelMeta('volley').name, ...V.intro]} style={{ position: 'absolute', top: 16, right: 16 }} />
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <TrophyArt size={120} />
            </div>
            <div className="title-font" style={{ fontSize: 60, fontWeight: 700, color: '#e0a72e' }}>Volleyball Cup!</div>
            {V.intro.map((l) => (
              <div key={l.en}>
                <div style={{ fontSize: 27, fontWeight: 700, color: '#4a3a7a' }}>{l.en}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#e0709b' }}>{plainTr(l.tr!)}</div>
              </div>
            ))}
            <div style={{ fontSize: 21, fontWeight: 700, color: '#e0709b', marginTop: 8 }}>3 doğru = 1 sayı · 5 sayı alan kazanır · Yanlışta sayı öğretmenin</div>
            <button className="btn btn-teal title-font" style={{ fontSize: 44, padding: '14px 56px', marginTop: 18 }} onClick={begin}>
              <Play size={36} fill="#fff" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 10 }} /> Play!
            </button>
          </motion.div>
        </div>
      )}
      {phase === 'victory' && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(74,58,122,0.4)', zIndex: 60 }}>
          <Confetti count={110} />
          <Character who="alyav" pose="win" height={P ? 400 : 420} style={{ left: P ? 30 : 90, bottom: 40 }} />
          <Character who="miav" pose="win" height={P ? 390 : 400} style={{ left: P ? 320 : 330, bottom: 40 }} />
          <Character who="teacherv" pose="win" height={P ? 400 : 420} style={{ right: P ? 20 : 130, bottom: 40 }} />
          <motion.div initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="panel" style={{ position: 'absolute', left: (W - 820) / 2, top: P ? 160 : 24, width: 820, padding: 24, textAlign: 'center', zIndex: 5 }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <TrophyArt size={P ? 230 : 150} />
            </div>
            <div className="title-font" style={{ fontSize: 66, fontWeight: 700, color: '#e0a72e', lineHeight: 1 }}>YOU DID IT!</div>
            <div className="title-font" style={{ fontSize: 40, fontWeight: 700, color: '#1f9c9c' }}>VOLLEYBALL CHAMPION!</div>
            <div style={{ fontSize: 25, fontWeight: 700, color: '#4a3a7a' }}>{named(V.congrats.en, name)}</div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 14 }}>
              <button className="btn btn-sun title-font" style={{ fontSize: 27, padding: '10px 22px' }} onClick={() => setPhase('intro')}>
                <RotateCcw size={26} style={{ display: 'inline', verticalAlign: 'middle' }} /> Play Again
              </button>
              <button className="btn btn-lav title-font" style={{ fontSize: 27, padding: '10px 22px' }} onClick={() => go({ name: 'rewards' })}>
                <Trophy size={26} style={{ display: 'inline', verticalAlign: 'middle' }} /> My Rewards
              </button>
              <button className="btn btn-teal title-font" style={{ fontSize: 27, padding: '10px 22px' }} onClick={() => go({ name: 'map' })}>
                Map
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function Question({ q, setGuide, onMood, onResult }: { q: Q; setGuide: (l: Line) => void; onMood: (m: string) => void; onResult: (r: Res) => void }) {
  const { portrait: P } = useStage()
  const record = useGame((s) => s.recordAttempt)
  const recordSpeech = useGame((s) => s.recordSpeech)
  const [solved, setSolved] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [shown, setShown] = useState(false)
  const [manual, setManual] = useState(false)
  const done = useRef(false)
  const round = q.kind === 'set' ? null : q.round
  const prompt: Line = q.kind === 'set' ? q.item.line : q.round.prompt
  const options = useMemo<Option[]>(() => (round ? shuffle(round.options) : []), [round])
  const meta = q.kind === 'set' ? { topic: 'word-order', item: q.item.say, skill: 'grammar' as const } : { topic: q.round.topic, item: q.round.id, skill: q.kind === 'spike' ? ('speaking' as const) : ('listening' as const) }

  useEffect(() => {
    let on = true
    ;(async () => {
      // pass: only the word itself, nothing before it
      if (q.kind !== 'pass') await sayLine(q.kind === 'set' ? V.set : V.spike)
      if (!on || done.current) return
      setGuide(q.kind === 'pass' ? V.passText : prompt)
      await sayLine(prompt)
      if (on && !done.current && q.kind === 'set') await say(q.item.say, 'alya')
    })()
    return () => {
      on = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function right(text?: string, byVoice = false) {
    if (done.current) return
    done.current = true
    sfx.correct()
    record({ level: 'volley', activity: 'match', ...meta, outcome: outcomeFor(0, false), misses: 0 })
    if (text) await say(text, 'alya')
    const p = pick(byVoice ? SAID : PRAISE)
    setGuide(p)
    await sayLine(p)
    if (q.kind === 'set') await wait(900)
    onResult('right')
  }
  async function miss(id: string) {
    if (done.current) return
    done.current = true
    sfx.tryAgain()
    onMood('sad')
    setWrong(id)
    const c = options.find((o) => o.correct)
    if (c) setSolved(c.id)
    setShown(true)
    setManual(true)
    setGuide(V.ohNo)
    await sayLine(V.ohNo)
    if (q.kind === 'set') await say(q.item.say, 'alya')
    else if (c?.say) await say(c.say, 'alya')
    else await sayLine(prompt)
    record({ level: 'volley', activity: 'match', ...meta, outcome: 'revealed', misses: 1 })
    await wait(500)
    onResult('wrong')
  }
  function choose(o: Option) {
    if (done.current) return
    if (o.correct) {
      setSolved(o.id)
      right(o.say)
    } else miss(o.id)
  }
  const st = (o: Option) => (solved === o.id ? 'right' : wrong === o.id ? 'wrong' : solved ? 'dim' : 'idle') as 'idle'

  if (q.kind === 'set')
    return shown ? (
      <div style={{ display: 'grid', gap: 14, justifyItems: 'center' }}>
        <div className="card is-correct title-font" style={{ fontSize: 42, fontWeight: 700, color: '#4a3a7a', padding: '12px 30px' }}>{q.item.say} ✓</div>
        <BuiltTr tr={q.item.line.tr!} size={38} />
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', gap: 20 }}>
        <button className="btn btn-sun" aria-label="Listen" onClick={() => say(q.item.say, 'alya')} style={{ width: 76, height: 76, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Volume2 size={38} />
        </button>
        <SentenceBuilder compact tr={q.item.line.tr} words={q.item.words} onMiss={() => miss('order')} onSolved={() => right(q.item.say)} />
      </div>
    )

  const r = q.round
  if (q.kind === 'pass')
    return (
      <div style={{ display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', gap: 22 }}>
        <button className="btn btn-sun" aria-label="Listen again" onClick={() => sayLine(prompt)} style={{ width: 110, height: 110, borderRadius: '50%', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Volume2 size={58} />
        </button>
        <div style={{ display: 'flex', gap: 14 }}>
          {options.map((o) => (
            <OptionButton key={o.id} compact opt={o} layout="pictures" state={st(o)} onClick={() => choose(o)} />
          ))}
        </div>
      </div>
    )

  function onMic(o: MicOutcome) {
    if (done.current) return
    if (o.kind === 'correct') {
      setGuide(UI.recognized)
      right(undefined, true)
    } else if (o.kind === 'partial') {
      setGuide(UI.wholeSentence)
      sayLine(UI.wholeSentence)
    } else if (o.kind === 'other-answer') {
      setGuide(UI.otherAnswer)
      sayLine(UI.otherAnswer)
    } else if (o.kind === 'error' && !['no-speech', 'timeout', 'aborted'].includes(o.error)) setManual(true)
  }
  return (
    <div style={{ display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: P ? 10 : 24, width: '100%' }}>
      <VisualView visual={r.visual?.type === 'object' ? undefined : r.visual} width={P ? 310 : 392} />
      {manual ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: P ? 640 : 560 }}>
          {options.map((o) => (
            <OptionButton
              key={o.id}
              compact
              opt={o}
              layout="sentences"
              state={st(o)}
              onClick={() => {
                if (!done.current) recordSpeech({ level: 'volley', item: r.id, result: 'manual' })
                choose(o)
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: P ? '10px 18px' : '6px 18px', width: P ? 700 : 600 }}>
          <div className="title-font" style={{ flex: '1 0 100%', fontSize: P ? 30 : 27, fontWeight: 700, color: '#4a3a7a', textAlign: 'center', lineHeight: 1.1 }}>{r.prompt.en}</div>
          {/* the result gets its own line, so nothing is pushed out of the card */}
          <InPill.Provider value={true}>
            <span className="title-font" style={{ fontSize: 26, fontWeight: 600, color: '#8a3a5c' }}>Say it!</span>
            <MicButton spec={r.speak!} level="volley" item={r.id} size={78} label="" onOutcome={onMic} />
          </InPill.Provider>
          <button className="title-font" onClick={() => setManual(true)} style={{ background: '#fff', border: '3px solid #e3d8f5', borderRadius: 16, padding: '4px 18px', fontSize: 21, color: '#4a3a7a', cursor: 'pointer' }}>
            Tap the answer instead
          </button>
        </div>
      )}
    </div>
  )
}
