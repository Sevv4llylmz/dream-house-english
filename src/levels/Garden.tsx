import { useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, SayItPill, outcomeFor } from '../components/ChoiceActivity'
import { BuildAsk, NextButton, useFeedback, Dots } from '../components/Activities'
import { Guide, TrButton, sayLine } from '../components/Guide'
import { Item, Pic, Scene } from '../components/Pic'
import { MicButton } from '../components/Mic'
import { DragArea, Draggable, DropZone } from '../components/Drag'
import { StarBurst } from '../components/Effects'
import { useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { G, PREPS, SPOTS, askItems, catAt, findRounds, hideRounds, itIs } from '../content/garden'
import { PRAISE, pick } from '../content/lines'
import { REPEAT } from '../content/ui'
import type { SceneItem } from '../content/types'
import type { Spot } from '../content/vocab'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function Garden() {
  return (
    <LevelShell
      level="garden"
      bg="garden"
      intro={G.intro}
      activities={[
        { key: 'learn', title: G.titles.learn, render: (d) => <Learn onDone={d} /> },
        { key: 'find', title: G.titles.find, render: (d) => <ChoiceActivity rounds={findRounds} level="garden" activity="find-cat" onDone={d} /> },
        { key: 'hide', title: G.titles.hide, render: (d) => <Hide onDone={d} /> },
        { key: 'ask', title: G.titles.ask, render: (d) => <BuildAsk items={askItems.map((x) => ({ ...x, scene: catAt(x.spot) }))} level="garden" lead={G.askLead} hint={G.askHint} onDone={d} /> },
      ]}
    />
  )
}

/** Three cards: in / on / under – listen, read the Turkish, repeat. */
function Learn({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const [i, setI] = useState(0)
  const p = PREPS[i]
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={p.line} />
      <div className="panel" key={p.id} style={{ position: 'absolute', left: P ? 24 : 150, top: P ? 290 : 160, width: P ? 852 : 1300, height: P ? 1140 : 690, display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <TrButton lines={[p.word, p.line]} style={{ position: 'absolute', top: 18, right: 18 }} />
        <Scene items={catAt(p.spot)} width={P ? 760 : 700} />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="title-font" style={{ fontSize: 110, fontWeight: 700, lineHeight: 1, color: '#1f9c9c' }}>{p.id}</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: '#e0709b' }}>{p.tr}</div>
          <button className="btn btn-sun title-font" style={{ fontSize: 30, padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }} onClick={() => say(itIs(p.spot), 'alya')}>
            <Volume2 size={28} /> {itIs(p.spot)}
          </button>
          <SayItPill label="Repeat!">
            <MicButton key={p.id} spec={{ accept: [itIs(p.spot), p.id], rivals: PREPS.filter((x) => x.id !== p.id).map((x) => x.id) }} level="garden" item={p.id} size={84} label="" onOutcome={(o) => (o.kind === 'correct' ? (sfx.correct(), sayLine(pick(PRAISE))) : o.kind === 'other-answer' && sayLine(REPEAT))} />
          </SayItPill>
          <NextButton onClick={() => (i + 1 < PREPS.length ? setI(i + 1) : onDone())} />
        </div>
      </div>
      <Dots n={3} i={i} />
    </div>
  )
}

/** Drag the cat to the place the teacher says. */
const FURN: SceneItem[] = [
  { k: 'obj/table', x: 230, y: 540, h: 300 },
  { k: 'obj/box', x: 555, y: 560, h: 220 },
  { k: 'obj/chair', x: 835, y: 545, h: 320 },
]
const ZONES: Record<string, { x: number; y: number; w: number; h: number; cat: SceneItem; behind?: boolean }> = {
  'on-table': { x: 90, y: 110, w: 280, h: 190, cat: { k: 'cat/sit', x: 230, y: 305, h: 170 } },
  'under-table': { x: 110, y: 345, w: 240, h: 200, cat: { k: 'cat/crouch', x: 230, y: 538, h: 150 }, behind: true },
  'in-box': { x: 455, y: 320, w: 200, h: 235, cat: { k: 'cat/sit', x: 555, y: 500, h: 230 }, behind: false },
  'on-chair': { x: 745, y: 200, w: 180, h: 205, cat: { k: 'cat/sit', x: 835, y: 400, h: 170 } },
  'under-chair': { x: 760, y: 430, w: 150, h: 120, cat: { k: 'cat/crouch', x: 835, y: 545, h: 95 }, behind: true },
}
function Hide({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const record = useGame((s) => s.recordAttempt)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [placed, setPlaced] = useState<Spot | null>(null)
  const [misses, setMisses] = useState(0)
  const [burst, setBurst] = useState(0)
  const busy = useRef(false)
  const r = hideRounds[i]
  const s = P ? 0.85 : 1.06
  const L = P ? 25 : 60
  const T = P ? 470 : 190
  const z = placed && ZONES[placed]
  return (
    <DragArea
      onDrop={(_, target) => {
        if (busy.current) return false
        if (target === r.spot) {
          busy.current = true
          setPlaced(r.spot)
          setBurst(Date.now())
          sfx.drop()
          sfx.correct()
          record({ level: 'garden', activity: 'hide-cat', skill: 'listening', topic: 'hide-cat', item: r.spot, outcome: outcomeFor(misses, false), misses })
          ;(async () => {
            await say(itIs(r.spot), 'alya')
            await fb.praise()
            busy.current = false
            setPlaced(null)
            setMisses(0)
            if (i + 1 >= hideRounds.length) return onDone()
            fb.setGuide(null)
            setI(i + 1)
          })()
          return true
        }
        sfx.tryAgain()
        setMisses((m) => m + 1)
        fb.tryAgain(misses >= 1 ? G.hideHint : { ...r.line })
        return false
      }}
    >
      <Guide line={fb.guide ?? r.line} />
      <div style={{ position: 'absolute', left: L, top: T, width: 1000, height: 600, transform: `scale(${s})`, transformOrigin: '0 0' }}>
        {z && z.behind && <Item it={z.cat} />}
        {FURN.map((f) => (
          <Item key={f.k} it={f} />
        ))}
        {z && !z.behind && <Item it={z.cat} />}
        {placed === 'in-box' && <Item it={{ ...FURN[1], front: 0.4 }} />}
        {Object.entries(ZONES).map(([id, q]) => (
          <DropZone key={id} id={id} label={SPOTS[id].en} style={{ position: 'absolute', left: q.x, top: q.y, width: q.w, height: q.h, borderRadius: 30 }} />
        ))}
      </div>
      <div className="panel" style={{ position: 'absolute', left: P ? 270 : 1190, top: P ? 1090 : 300, width: 360, height: 400, display: 'grid', placeItems: 'center' }}>
        {!placed && (
          <Draggable id="cat" label="cat">
            <Pic pic="cat/walk" size={250} />
          </Draggable>
        )}
      </div>
      {burst > 0 && <StarBurst key={burst} x={P ? 450 : 600} y={P ? 800 : 480} />}
      <Dots n={hideRounds.length} i={i} />
    </DragArea>
  )
}
