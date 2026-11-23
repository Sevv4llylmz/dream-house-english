import { useState } from 'react'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { Guide, TrButton, sayLine, sayTr } from '../components/Guide'
import { Character } from '../components/Character'
import { NextButton, Dots } from '../components/Activities'
import { SayItPill } from '../components/ChoiceActivity'
import { MicButton } from '../components/Mic'
import { useStage } from '../components/Stage'
import { useGame } from '../store/gameStore'
import { DEM_WORD, demPages, demLine, type Dem } from '../content/toys'
import { img } from '../assets/manifest'
import { say, stopVoice } from '../audio/voice'

const TEAL = '#1f9c9c'
const PINK = '#e0709b'
const INK = '#4a3a7a'

/** Turkish text whose [[English]] words are shown in teal. */
function Tr({ text, size }: { text: string; size: number }) {
  return (
    <div style={{ fontSize: size, fontWeight: 800, color: PINK, lineHeight: 1.3 }}>
      {text.split(/(\[\[.+?\]\])/).map((x, i) => (x.startsWith('[[') ? <span key={i} className="title-font" style={{ color: TEAL, fontWeight: 700 }}>{x.slice(2, -2)}</span> : x))}
    </div>
  )
}
const Robots = ({ n, h }: { n: number; h: number }) => (
  <span style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
    {Array.from({ length: n }).map((_, k) => (
      <img key={k} src={img('obj/robot')} alt="robot" draggable={false} style={{ height: h, marginLeft: k ? -h * 0.06 : 0, filter: 'drop-shadow(0 5px 4px rgba(60,40,90,.25))' }} />
    ))}
  </span>
)
const Tag = ({ en, tr }: { en: string; tr: string }) => (
  <span style={{ background: '#fff', borderRadius: 16, padding: '2px 16px', fontSize: 26, fontWeight: 800, color: INK, whiteSpace: 'nowrap' }}>
    {en} <span style={{ color: PINK }}>= {tr}</span>
  </span>
)

/** Alya stands on the left; near = beside her, far = on the other side of the room. */
function Picture({ d, w }: { d?: Dem; w: number }) {
  const near = !d || d === 'this' || d === 'these'
  const far = !d || d === 'that' || d === 'those'
  const n = d === 'these' || d === 'those' ? 3 : 1
  const H = 400
  return (
    <div style={{ position: 'relative', width: w, height: H, borderRadius: 30, overflow: 'hidden', background: 'linear-gradient(#efe6fb 0 52%, #f3dcc0 52% 53%, #f7e6cf 53%)', border: '5px solid #fff', flex: 'none' }}>
      <Character who="alya" pose={far && d ? 'point' : 'idle'} height={320} style={{ left: 10, bottom: 18 }} />
      {near && (
        <div style={{ position: 'absolute', left: 196, bottom: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Robots n={n} h={n > 1 ? 150 : 180} />
          <Tag en="near" tr="yakın" />
        </div>
      )}
      {far && (
        <div style={{ position: 'absolute', right: 26, bottom: 118, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Tag en="far" tr="uzak" />
          <Robots n={n} h={74} />
        </div>
      )}
    </div>
  )
}

const CELL: { d: Dem; n: number; h: number }[] = [
  { d: 'this', n: 1, h: 96 },
  { d: 'these', n: 3, h: 84 },
  { d: 'that', n: 1, h: 50 },
  { d: 'those', n: 3, h: 50 },
]
/** rows near / far, columns one / many */
function Table({ P }: { P: boolean }) {
  const head: React.CSSProperties = { display: 'grid', placeItems: 'center', fontSize: 27, fontWeight: 800, color: INK, textAlign: 'center', lineHeight: 1.1 }
  const cell = (d: Dem) => {
    const c = CELL.find((x) => x.d === d)!
    return (
      <button key={d} className="card" aria-label={d} onClick={() => say(demLine(d, 'robot').say, 'alya')} style={{ display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: P ? 6 : 26, padding: 8, height: P ? 230 : 150 }}>
        <span style={{ width: P ? 'auto' : 220, height: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <Robots n={c.n} h={c.h} />
        </span>
        <span style={{ textAlign: 'center' }}>
          <span className="title-font" style={{ display: 'block', fontSize: 50, fontWeight: 700, color: TEAL, lineHeight: 1 }}>{d}</span>
          <span style={{ display: 'block', fontSize: 32, fontWeight: 800, color: PINK }}>{DEM_WORD[d]}</span>
        </span>
      </button>
    )
  }
  const Head = ({ en, tr }: { en: string; tr: string }) => (
    <div style={head}>
      <span>
        {en}
        <br />
        <span style={{ color: PINK }}>{tr}</span>
      </span>
    </div>
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: P ? '110px 1fr 1fr' : '130px 470px 470px', gap: 14, width: P ? 800 : undefined }}>
      <span />
      <Head en="one · is" tr="bir tane" />
      <Head en="many · are" tr="birden fazla" />
      <Head en="near" tr="yakın" />
      {cell('this')}
      {cell('these')}
      <Head en="far" tr="uzak" />
      {cell('that')}
      {cell('those')}
    </div>
  )
}

/** this / these / that / those, one idea on every page, with the Turkish explanation spoken and written. */
export function DemLesson({ onDone }: { onDone: () => void }) {
  const { portrait: P } = useStage()
  const assist = useGame((s) => s.settings.assist)
  const [i, setI] = useState(0)
  const p = demPages[i]
  const last = i === demPages.length - 1
  const speak = async () => {
    if ((await sayLine(p.line)) && assist) await sayTr(p.rule)
  }
  const ruleBox = assist && (
    <div style={{ background: '#fff3f8', border: '4px solid #f4c9d6', borderRadius: 24, padding: '12px 22px', textAlign: 'left' }}>
      <Tr text={p.rule.tr!} size={31} />
    </div>
  )
  const nav = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      {i > 0 && (
        <button className="btn btn-cream" aria-label="Back" onClick={() => (stopVoice(), setI(i - 1))} style={{ width: 68, height: 68, display: 'grid', placeItems: 'center' }}>
          <ArrowLeft size={34} />
        </button>
      )}
      <NextButton label={last ? "Let's go!" : 'Next'} onClick={() => (stopVoice(), last ? onDone() : setI(i + 1))} />
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Guide key={i} line={p.line} onSpoken={() => assist && sayTr(p.rule)} />
      <div className="panel" data-testid="dem-lesson" style={{ position: 'absolute', left: P ? 24 : 100, top: P ? 290 : 170, width: P ? 852 : 1400, height: P ? 1180 : 660, boxSizing: 'border-box', padding: P ? 24 : '20px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: P ? 26 : 14 }}>
        <div style={{ position: 'absolute', top: 16, ...(P ? { right: 18 } : { left: 24 }), display: 'flex', gap: 10, zIndex: 2 }}>
          <button className="btn btn-sun" aria-label="Listen again" onClick={speak} style={{ width: 84, height: 54, display: 'grid', placeItems: 'center' }}>
            <Volume2 size={30} />
          </button>
          <TrButton lines={p.d ? [p.line, p.rule] : [p.rule]} />
        </div>
        {last ? (
          <>
            <Table P={P} />
            <div style={{ width: P ? 780 : 1230 }}>{ruleBox}</div>
            {nav}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: P ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: P ? 26 : 34 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, marginTop: P || !p.d ? 0 : 30 }}>
              <Picture d={p.d} w={P ? 790 : 640} />
              {p.d && (
                  <button className="btn btn-sun title-font" style={{ fontSize: 32, padding: '8px 24px', display: 'flex', gap: 10, alignItems: 'center' }} onClick={() => say(p.line.en, 'alya')}>
                    <Volume2 size={28} />
                    <span>
                      {p.line.en}
                      <span style={{ display: 'block', fontSize: 25, fontWeight: 800, color: '#b23a6c', fontFamily: 'var(--font-body)' }}>{p.line.tr}</span>
                    </span>
                  </button>
              )}
            </div>
            <div style={{ width: P ? 780 : 640, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: P ? 22 : 14, textAlign: 'center' }}>
              {p.d ? (
                <div className="title-font" style={{ fontSize: 76, fontWeight: 700, color: TEAL, lineHeight: 1 }}>
                  {p.d} <span style={{ color: INK }}>=</span> <span style={{ color: PINK, fontFamily: 'var(--font-body)', fontWeight: 900 }}>{DEM_WORD[p.d]}</span>
                </div>
              ) : (
                <div className="title-font" style={{ fontSize: 56, fontWeight: 700, color: TEAL, lineHeight: 1.1 }}>
                  near <span style={{ color: PINK, fontFamily: 'var(--font-body)', fontWeight: 900 }}>= yakın</span>
                  <br />
                  far <span style={{ color: PINK, fontFamily: 'var(--font-body)', fontWeight: 900 }}>= uzak</span>
                </div>
              )}
              {ruleBox}
              {p.d && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <SayItPill label="Repeat!">
                    <MicButton key={i} spec={{ accept: [p.line.en] }} level="toys" item={'lesson-' + p.d} size={70} label="" repeat={p.line.en} />
                  </SayItPill>
                </div>
              )}
              {nav}
            </div>
          </div>
        )}
      </div>
      <Dots n={demPages.length} i={i} />
    </div>
  )
}
