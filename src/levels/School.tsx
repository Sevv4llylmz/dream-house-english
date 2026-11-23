import { useMemo, useRef, useState } from 'react'
import { LevelShell } from '../components/LevelShell'
import { ChoiceActivity, SayItPill, outcomeFor } from '../components/ChoiceActivity'
import { Balloons, Explore, NextButton, useFeedback, Dots } from '../components/Activities'
import { Guide, sayLine } from '../components/Guide'
import { Scene } from '../components/Pic'
import { MicButton } from '../components/Mic'
import { useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { SC, DIFF_ITEMS, DIFF_ROUNDS, diffLines, diffSay, isThereRounds, manyRounds, numberRounds } from '../content/school'
import { SCHOOL } from '../content/vocab'
import { sfx } from '../audio/sfx'
import { say } from '../audio/voice'

export function School() {
  const nums = useMemo(() => numberRounds().slice(0, 8), [])
  return (
    <LevelShell
      level="school"
      bg="classroom"
      intro={SC.intro}
      activities={[
        { key: 'words', title: SC.titles.words, render: (d) => <Explore words={SCHOOL} level="school" lead={SC.wordsLead} onDone={d} /> },
        { key: 'nums', title: SC.titles.nums, render: (d) => <Balloons rounds={nums} level="school" activity="number-balloons" onDone={d} /> },
        { key: 'many', title: SC.titles.many, render: (d) => <ChoiceActivity rounds={manyRounds} level="school" activity="how-many" onDone={d} /> },
        { key: 'is', title: SC.titles.isThere, render: (d) => <ChoiceActivity rounds={isThereRounds} level="school" activity="is-there" onDone={d} /> },
        { key: 'diff', title: SC.titles.diff, render: (d) => <Differences onDone={d} /> },
      ]}
    />
  )
}

/** Two pictures: tap (in picture 1) what is not in picture 2, then say the sentence. */
function Differences({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const record = useGame((s) => s.recordAttempt)
  const fb = useFeedback()
  const [i, setI] = useState(0)
  const [found, setFound] = useState<string[]>([])
  const [misses, setMisses] = useState(0)
  const busy = useRef(false)
  const missing = DIFF_ROUNDS[i]
  const last = found[found.length - 1]
  const item = (d: (typeof DIFF_ITEMS)[number], glow: boolean) => ({ k: d.pic, x: d.x, y: d.y, h: d.h, glow })
  const W = P ? 700 : 690
  async function tap(k: number) {
    const d = DIFF_ITEMS[k]
    if (busy.current || found.includes(d.id)) return
    if (missing.includes(d.id)) {
      busy.current = true
      sfx.correct()
      setFound((f) => [...f, d.id])
      record({ level: 'school', activity: 'differences', skill: 'grammar', topic: 'there-isnt', item: d.id, outcome: outcomeFor(misses, false), misses })
      setMisses(0)
      fb.setGuide(diffLines[d.id])
      await sayLine(diffLines[d.id])
      busy.current = false
    } else {
      sfx.tryAgain()
      setMisses((m) => m + 1)
      fb.setGuide({ ...SC.diffNo })
    }
  }
  const complete = missing.every((m) => found.includes(m))
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide line={fb.guide ?? SC.diffLead} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: P ? 290 : 190, display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: P ? 14 : 40 }}>
        {[1, 2].map((n) => (
          <div key={n} style={{ position: 'relative' }}>
            <span className="title-font" style={{ position: 'absolute', zIndex: 2, top: -14, left: 18, background: '#8a6cc9', color: '#fff', borderRadius: 14, padding: '0 18px', fontSize: 30, fontWeight: 700 }}>{n}</span>
            <Scene bg="classroom" width={W} items={DIFF_ITEMS.filter((d) => n === 1 || !missing.includes(d.id)).map((d) => item(d, n === 1 && found.includes(d.id)))} onTap={n === 1 ? tap : undefined} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: P ? 1200 : 622, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 22 }}>
        {last && (
          <>
            <button className="card title-font" style={{ fontSize: 34, padding: '14px 28px', fontWeight: 600, color: '#4a3a7a' }} onClick={() => say(diffSay[last], 'alya')}>{diffSay[last]}</button>
            <SayItPill label="Repeat!">
              <MicButton key={last} spec={{ accept: [diffSay[last], diffSay[last].replace('.', ' in picture two')] }} level="school" item={last} size={84} label="" repeat={diffSay[last]} />
            </SayItPill>
          </>
        )}
        {complete && (
          <NextButton
            onClick={() => {
              if (i + 1 >= DIFF_ROUNDS.length) return onDone()
              setFound([])
              setI(i + 1)
              fb.setGuide({ ...SC.diffLead })
            }}
          />
        )}
      </div>
      <Dots n={DIFF_ROUNDS.length} i={i} />
    </div>
  )
}
