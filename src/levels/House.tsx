import { useMemo, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, outcomeFor } from '../components/ChoiceActivity'
import { Explore, GiveTo, NextButton, useFeedback, Dots, Confetti } from '../components/Activities'
import { Guide, TrButton, sayLine } from '../components/Guide'
import { Pic } from '../components/Pic'
import { Character } from '../components/Character'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { StarBurst } from '../components/Effects'
import { useScene, useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { DECOR, H, PRON, ROOMS, phoneRounds, pronTeach, putRounds, shoeRounds, whereRound, whichRounds, type Pron } from '../content/house'
import { OWNER } from '../content/toys'
import { HOME } from '../content/vocab'
import { shuffle } from '../content/lines'
import { img, size, type Room } from '../assets/manifest'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function House() {
  return (
    <LevelShell
      level="house"
      bg="house"
      intro={H.intro}
      activities={[
        { key: 'words', title: H.titles.words, render: (d) => <Explore words={HOME} level="house" lead={H.wordsLead} onDone={d} /> },
        { key: 'put', title: H.titles.put, render: (d) => <PutIn onDone={d} /> },
        { key: 'shoes', title: H.titles.shoes, render: (d) => <Shoes onDone={d} /> },
        { key: 'which', title: H.titles.which, render: (d) => <Dim><ChoiceActivity rounds={whichRounds} level="house" activity="which-ones" onDone={d} /></Dim> },
        { key: 'phone', title: H.titles.phone, render: (d) => <Dim><ChoiceActivity rounds={phoneRounds} level="house" activity="phone-call" lead={H.phoneLead} onDone={d} /><PhoneTeacher /></Dim> },
        { key: 'decor', title: H.titles.decor, render: (d) => <Decorate onDone={d} /> },
      ]}
    />
  )
}
const Dim = ({ children }: { children: React.ReactNode }) => <div style={{ position: 'absolute', inset: 0, background: 'rgba(250,245,255,0.72)' }}>{children}</div>
function PhoneTeacher() {
  const { portrait: P } = useStage()
  return <Character who="teacher" pose="phone" height={P ? 250 : 270} style={{ left: P ? 690 : 1430, bottom: P ? 40 : 10, pointerEvents: 'none' }} />
}

/** Drag the thing the teacher says into the room with the right colour. */
function PutIn({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const rooms = useScene().rooms
  const record = useGame((s) => s.recordAttempt)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [placed, setPlaced] = useState<Record<string, Room>>({})
  const [misses, setMisses] = useState(0)
  const [burst, setBurst] = useState<{ x: number; y: number; k: number } | null>(null)
  const busy = useRef(false)
  const r = putRounds[i]
  const tray = useMemo(() => shuffle(putRounds.map((x) => x.id)), [])
  const hOf = (id: string) => (DECOR.find((d) => d.id === id)?.h ?? 100) * (P ? 1.2 : 1.4)
  return (
    <DragArea
      onDrop={(item, target) => {
        if (busy.current) return false
        if (item === r.id && target === r.room) {
          busy.current = true
          sfx.drop()
          sfx.correct()
          setPlaced((p) => ({ ...p, [item]: r.room }))
          const z = rooms[r.room]
          setBurst({ x: z.x + z.w / 2, y: z.y + z.h / 2, k: Date.now() })
          record({ level: 'house', activity: 'put-room', skill: 'listening', topic: 'put-room', item: r.id, outcome: outcomeFor(misses, false), misses })
          ;(async () => {
            await say(r.say, 'alya')
            await fb.praise()
            busy.current = false
            setMisses(0)
            if (i + 1 >= putRounds.length) return onDone()
            fb.setGuide(null)
            setI(i + 1)
          })()
          return true
        }
        sfx.tryAgain()
        setMisses((m) => m + 1)
        fb.tryAgain(misses >= 1 ? H.putHint : { ...r.line })
        return false
      }}
    >
      <Guide line={fb.guide ?? r.line} />
      {ROOMS.map((k) => {
        const z = rooms[k]
        const here = Object.keys(placed).filter((id) => placed[id] === k)
        return (
          <DropZone key={k} id={k} label={k + ' room'} style={{ position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h, borderRadius: 18, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20, paddingBottom: 14, boxSizing: 'border-box' }}>
            {here.map((id) => (
              <img key={id} src={img('obj/' + id)} alt={id} style={{ height: hOf(id), marginBottom: id === 'clock' ? z.h * 0.45 : 0 }} />
            ))}
          </DropZone>
        )
      })}
      <div className="panel" style={P ? { position: 'absolute', left: 24, top: 1372, width: 852, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' } : { position: 'absolute', left: 1468, top: 150, width: 124, height: 726, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}>
        {tray
          .filter((id) => !placed[id])
          .map((id) => (
            <Draggable key={id} id={id} label={id}>
              <Pic pic={'obj/' + id} size={P ? 105 : 84} />
            </Draggable>
          ))}
      </div>
      {burst && <StarBurst key={burst.k} x={burst.x} y={burst.y} />}
      <Dots n={putRounds.length} i={i} />
    </DragArea>
  )
}

/** mine / yours / his / hers: short teaching card, then Alya tells whose shoes they are. */
function Shoes({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const [teach, setTeach] = useState(true)
  const prons = Object.keys(PRON) as Pron[]
  const rounds = useMemo(() => shuffle(shoeRounds).map((r) => ({ ...r, voice: 'alya' as const })), [])
  if (teach)
    return (
      <Dim>
        <Guide line={H.shoesLead} />
        <div className="panel" style={{ position: 'absolute', left: P ? 24 : 120, top: P ? 290 : 165, width: P ? 852 : 1360, height: P ? 1180 : 660, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <TrButton lines={prons.map((p) => pronTeach[p])} style={{ position: 'absolute', top: 18, right: 18 }} />
          <div className="title-font" style={{ fontSize: 36, fontWeight: 700, color: '#4a3a7a' }}>Alya says:</div>
          <div style={{ display: 'grid', gridTemplateColumns: P ? '1fr 1fr' : 'repeat(4,1fr)', gap: 18 }}>
            {prons.map((p) => (
              <button key={p} className="card" onClick={() => say(p, 'alya')} style={{ width: P ? 380 : 300, height: P ? 400 : 400, position: 'relative', overflow: 'hidden' }}>
                <Character who={PRON[p].owner} pose={p === 'mine' ? 'point' : 'idle'} height={220} style={{ left: P ? 124 : 84, top: 14 }} />
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 14 }}>
                  <span className="title-font" style={{ display: 'block', fontSize: 62, fontWeight: 700, color: '#1f9c9c', lineHeight: 1 }}>{p}</span>
                  <span style={{ display: 'block', fontSize: 30, fontWeight: 800, color: '#e0709b' }}>{PRON[p].tr}</span>
                </span>
              </button>
            ))}
          </div>
          <NextButton label="Let's go!" onClick={() => setTeach(false)} />
        </div>
      </Dim>
    )
  return (
    <Dim>
      <GiveTo
        rounds={rounds}
        owners={(['alya', 'teacher', 'leo', 'mia'] as const).map((o) => ({ who: o, name: OWNER[o].en }))}
        level="house"
        activity="shoes"
        topic="shoes-listen"
        hint={H.shoesHint}
        header={P ? () => <div className="title-font panel" style={{ fontSize: 30, fontWeight: 700, color: '#6a4fa3', padding: '6px 24px' }}>Alya says…</div> : undefined}
        onDone={onDone}
      />
    </Dim>
  )
}

/** Free play: drag furniture anywhere; saved on this device. Then the teacher asks about Alya's own house. */
function Decorate({ onDone }: { onDone: () => void }) {
  const { portrait: P, scale, W, H: SH } = useStage()
  const rooms = useScene().rooms
  const o = P ? 'p' : 'l'
  const decor = useGame((s) => s.decor[o])
  const setDecor = useGame((s) => s.setDecor)
  const [guide, setGuide] = useState(H.decorLead)
  const [phase, setPhase] = useState<'play' | 'ask' | 'end'>('play')
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const f = P ? 1 : 0.98
  const home = (k: number): [number, number] => (P ? [70 + (k % 7) * 127, 1424 + Math.floor(k / 7) * 92] : k < 7 ? [66, 292 + k * 97] : [1532, 292 + (k - 7) * 97])
  const placed = HOME.filter((t) => decor[t.id])
  const roomAt = (p: [number, number]): Room | null => ROOMS.find((r) => p[0] > rooms[r].x - 10 && p[0] < rooms[r].x + rooms[r].w + 10 && p[1] > rooms[r].y - 10 && p[1] < rooms[r].y + rooms[r].h + 20) ?? null
  const ask = useMemo(() => {
    if (phase !== 'ask') return []
    return placed
      .map((t) => ({ t, r: roomAt(decor[t.id]) }))
      .filter((x) => x.r)
      .slice(0, 3)
      .map((x) => whereRound(x.t.id, x.r!, { type: 'none' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
  const items = DECOR.map((d, k) => {
    const pos = drag?.id === d.id ? ([drag.x, drag.y] as [number, number]) : decor[d.id]
    const [w0, h0] = size('obj/' + d.id)
    const out = !!pos
    const h = out ? d.h * f * 1.1 : Math.min(P ? 74 : 84, (110 * h0) / w0)
    const [x, y] = pos ?? home(k)
    return { ...d, x, y, h, w: (h * w0) / h0, out }
  })
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {phase === 'play' && <Guide line={guide} />}
      {items
        .sort((a, b) => a.y - b.y)
        .map((d) => (
          <div
            key={d.id}
            role="button"
            aria-label={d.id}
            onPointerDown={(e) => {
              if (phase !== 'play') return
              e.currentTarget.setPointerCapture(e.pointerId)
              start.current = { px: e.clientX, py: e.clientY, x: d.x, y: d.y }
              setDrag({ id: d.id, x: d.x, y: d.y })
              sfx.click()
            }}
            onPointerMove={(e) => {
              const s = start.current
              if (s && drag?.id === d.id) setDrag({ id: d.id, x: s.x + (e.clientX - s.px) / scale, y: s.y + (e.clientY - s.py) / scale })
            }}
            onPointerUp={() => {
              if (drag?.id !== d.id) return
              const p: [number, number] = [Math.round(Math.max(40, Math.min(W - 40, drag.x))), Math.round(Math.max(150, Math.min(SH - 20, drag.y)))]
              setDecor(o, d.id, roomAt(p) ? p : null)
              sfx.drop()
              setDrag(null)
              start.current = null
            }}
            onPointerCancel={() => setDrag(null)}
            style={{ position: 'absolute', left: d.x - d.w / 2, top: d.y - d.h, width: d.w, height: d.h, touchAction: 'none', cursor: 'grab', zIndex: drag?.id === d.id ? 30 : 4 }}
          >
            {!d.out && <span style={{ position: 'absolute', inset: -6, borderRadius: 16, background: 'rgba(255,255,255,0.8)' }} />}
            <img src={img('obj/' + d.id)} alt={d.id} draggable={false} style={{ position: 'relative', width: '100%', height: '100%', filter: 'drop-shadow(0 4px 4px rgba(60,40,90,.25))' }} />
          </div>
        ))}
      {phase === 'play' && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: P ? 8 : 6, display: 'flex', justifyContent: 'center', gap: 18, zIndex: 35, pointerEvents: 'none' }}>
          <button className="btn btn-cream" aria-label="Start again" style={{ pointerEvents: 'auto', padding: '8px 20px' }} onClick={() => DECOR.forEach((d) => setDecor(o, d.id, null))}>
            <RotateCcw size={32} color="#4a3a7a" />
          </button>
          <button
            className="btn btn-teal title-font"
            style={{ pointerEvents: 'auto', fontSize: 32, padding: '8px 34px', display: 'flex', gap: 8, alignItems: 'center' }}
            onClick={async () => {
              if (placed.length < 3) return setGuide({ ...H.decorMore })
              setPhase('ask')
            }}
          >
            <Check size={32} /> Finished!
          </button>
        </div>
      )}
      {phase === 'ask' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
          <AskOwn rounds={ask} onDone={async () => {
            setPhase('end')
            sfx.fanfare()
            await sayLine(H.decorDone)
            onDone()
          }} />
        </div>
      )}
      {phase === 'end' && <Confetti />}
    </div>
  )
}
/** the questions float over the child's own house */
function AskOwn({ rounds, onDone }: { rounds: Parameters<typeof ChoiceActivity>[0]['rounds']; onDone: () => void }) {
  return <ChoiceActivity rounds={rounds} level="house" activity="my-house" onDone={onDone} requeue={false} />
}
