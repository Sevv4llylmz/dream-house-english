import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Mic, Loader2, ShieldCheck, MicOff } from 'lucide-react'
import { listenOnce, recognitionSupported, stopListening, type RecError } from '../speech/recognition'
import { matchSpeech, type MatchOutcome, type SpeakSpec } from '../speech/match'
import { say, stopVoice, type VoiceId } from '../audio/voice'
import { sfx, restoreAudioAfterMic } from '../audio/sfx'
import { useGame, type LevelId } from '../store/gameStore'
import { sayLine } from './Guide'
import { SAID, UI, pick } from '../content/lines'
import { ALMOST } from '../content/ui'

export type MicOutcome = { kind: MatchOutcome; heard: string } | { kind: 'error'; error: RecError }

const ERROR_TEXT: Record<RecError, string> = {
  unsupported: 'Speaking practice needs Chrome, Edge or Safari. Tap the answer instead!',
  'not-allowed': 'The microphone is blocked. A grown-up can allow it in the browser. Tap the answer instead!',
  'no-speech': "I didn't hear anything. Try again!",
  network: 'The speech service is not reachable (internet?). Tap the answer instead!',
  aborted: 'Stopped. Try again!',
  timeout: "I didn't hear anything. Try again!",
  'audio-capture': 'No microphone found. Tap the answer instead!',
  other: 'Something went wrong. Try again or tap the answer!',
}

/**
 * Grown-up consent before the browser speech recogniser is used (it may send audio to the browser vendor).
 * Rendered with a portal straight into <body>, outside the scaled game stage, so it is always centred
 * on the real screen and sized in real pixels (big, easy buttons on phones too).
 */
export function MicConsent({ onClose }: { onClose: (ok: boolean) => void }) {
  const setSettings = useGame((s) => s.setSettings)
  const reduced = useGame((s) => s.settings.reducedMotion)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const btn: React.CSSProperties = { flex: '1 1 200px', minHeight: 56, padding: '12px 18px', fontSize: 'clamp(17px, 2.4vw, 22px)', borderRadius: 999 }
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-consent-title"
      onClick={() => onClose(false)}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,50,52,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}
    >
      <motion.div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        initial={reduced ? false : { scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ background: '#fff7e8', width: 'min(620px, 100%)', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto', padding: 'clamp(18px, 4vw, 30px)', boxSizing: 'border-box', borderRadius: 28 }}
      >
        <div id="mic-consent-title" className="title-font" style={{ fontSize: 'clamp(20px, 3.4vw, 28px)', fontWeight: 700, color: '#4a3a7a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={30} style={{ flex: 'none' }} /> For grown-ups · Yetişkinler için
        </div>
        <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', lineHeight: 1.45, margin: '12px 0', color: '#23464a' }}>
          Speaking practice uses your browser&apos;s speech recognition. In Chrome and Edge the spoken audio is sent to the browser
          maker&apos;s speech service (Google / Microsoft) to be turned into text. This game does <b>not</b> record or store any audio – it only
          compares the returned text with the expected answer.
        </p>
        <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', lineHeight: 1.45, margin: '0 0 18px', color: '#7a4a62' }}>
          Konuşma alıştırması tarayıcının ses tanıma özelliğini kullanır. Chrome ve Edge&apos;de konuşma sesi metne çevrilmek için tarayıcı
          şirketinin sunucusuna gönderilir. Oyun hiçbir ses kaydı saklamaz. Mikrofonsuz da oynanabilir: cevaplara dokunmak yeterli.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap-reverse', gap: 12 }}>
          <button className="btn btn-cream title-font" style={btn} onClick={() => onClose(false)}>
            Not now · Şimdi değil
          </button>
          <button
            className="btn btn-teal title-font"
            style={btn}
            autoFocus
            onClick={() => {
              setSettings({ micEnabled: true })
              onClose(true)
            }}
          >
            Allow speaking · İzin ver
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

/** true inside the pink bubble: the result gets its own line there and never covers other buttons */
export const InPill = createContext(false)

/** What the microphone understood: green = correct, orange = try again. */
export function MicResult({ kind, heard, text, tr, target }: { kind: 'good' | 'almost' | 'info'; heard?: string; text: string; tr?: string; target?: string }) {
  const c = kind === 'good' ? { bg: '#e0f7e8', line: '#3fae6a', ink: '#1f7a45' } : kind === 'almost' ? { bg: '#fff0de', line: '#f0973c', ink: '#9a5312' } : { bg: '#fff', line: '#e3d8f5', ink: '#7a4a62' }
  return (
    <motion.div data-testid={'mic-' + kind} initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ order: 4, flex: '1 0 100%', boxSizing: 'border-box', minWidth: 260, maxWidth: '100%', textAlign: 'center', background: c.bg, border: `4px solid ${c.line}`, borderRadius: 18, padding: '5px 14px', lineHeight: 1.2 }}>
      <div className="title-font" style={{ fontSize: kind === 'good' ? 32 : 24, fontWeight: 700, color: c.ink }}>
        {kind === 'good' ? '✓ ' : ''}
        {text}
      </div>
      {tr && <div style={{ fontSize: 22, fontWeight: 800, color: '#c9446f' }}>{tr}</div>}
      {heard && <div style={{ fontSize: 20, fontWeight: 700, color: c.ink }}>{kind === 'good' ? `“${heard}”` : `I heard: “${heard}”`}</div>}
      {target && kind === 'almost' && <div style={{ fontSize: 20, fontWeight: 800, color: '#4a3a7a' }}>Say: “{target}”</div>}
    </motion.div>
  )
}

export function MicButton({
  spec,
  level,
  item,
  onOutcome,
  size = 110,
  disabled,
  label = 'Say it!',
  repeat,
  repeatVoice = 'alya',
  partialOk = false,
}: {
  spec: SpeakSpec
  level: LevelId
  item: string
  onOutcome?: (o: MicOutcome) => void
  /** repeat-after-me use: the sentence to say. The button then praises / helps by itself before onOutcome. */
  repeat?: string
  repeatVoice?: VoiceId
  /** the key word alone is enough */
  partialOk?: boolean
  size?: number
  disabled?: boolean
  label?: string
}) {
  const micEnabled = useGame((s) => s.settings.micEnabled)
  const recordSpeech = useGame((s) => s.recordSpeech)
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [msg, setMsg] = useState<Parameters<typeof MicResult>[0] | null>(null)
  const inPill = useContext(InPill)
  const alive = useRef(true)
  const [consent, setConsent] = useState(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      stopListening()
    }
  }, [])

  async function run(force = false) {
    if (state !== 'idle') {
      stopListening()
      return
    }
    if (!recognitionSupported()) {
      setMsg({ kind: 'info', text: ERROR_TEXT.unsupported })
      onOutcome?.({ kind: 'error', error: 'unsupported' })
      return
    }
    if (!micEnabled && !force) {
      setConsent(true)
      return
    }
    stopVoice()
    setMsg(null)
    sfx.pop()
    setState('listening')
    const res = await listenOnce(7000)
    setState('processing')
    await new Promise((r) => setTimeout(r, 350))
    restoreAudioAfterMic()
    // the child has already gone on: never talk over the next question
    if (!alive.current) return
    setState('idle')
    if (!res.ok) {
      recordSpeech({ level, item, result: 'error', heard: res.error })
      setMsg({ kind: 'info', text: ERROR_TEXT[res.error] })
      if (res.error === 'no-speech' || res.error === 'timeout') sayLine(UI.noHear)
      onOutcome?.({ kind: 'error', error: res.error })
      return
    }
    const m = matchSpeech(res.alternatives, spec)
    recordSpeech({ level, item, result: m.outcome, heard: m.heard })
    const good = m.outcome === 'correct' || (partialOk && m.outcome === 'partial')
    if (good) setMsg({ kind: 'good', text: 'Correct!', tr: 'Doğru!', heard: m.heard })
    else if (m.outcome === 'unclear') setMsg({ kind: 'info', text: ERROR_TEXT['no-speech'] })
    else if (m.outcome === 'partial') setMsg({ kind: 'almost', text: 'Good! Say the whole sentence.', tr: 'Güzel! Cümlenin tamamını söyle.', heard: m.heard, target: repeat })
    else setMsg({ kind: 'almost', text: 'Try again!', tr: 'Tekrar dene!', heard: m.heard, target: repeat })
    if (m.outcome === 'unclear') sayLine(UI.noHear)
    else if (repeat && good) {
      sfx.correct()
      await sayLine(pick(SAID))
      if (!alive.current) return
    } else if (repeat) {
      const ok = await sayLine(m.outcome === 'partial' ? UI.wholeSentence : ALMOST)
      if (ok && alive.current) await say(repeat, repeatVoice)
      if (!alive.current) return
    }
    onOutcome?.({ kind: m.outcome, heard: m.heard })
  }

  const listening = state === 'listening'
  return (
    <div style={inPill ? { display: 'contents' } : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', maxWidth: 420 }}>
      <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
        {listening && <span className="mic-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#f4b7cc' }} />}
        <motion.button
          className={`btn ${listening ? 'btn-pink' : 'btn-teal'}`}
          disabled={disabled}
          onClick={() => run()}
          aria-label={listening ? 'Listening – tap to stop' : 'Speak your answer'}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'grid', placeItems: 'center' }}
          animate={listening ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.8, repeat: listening ? Infinity : 0 }}
        >
          {state === 'processing' ? <Loader2 size={size * 0.45} className="spin-slow" /> : micEnabled || !recognitionSupported() ? recognitionSupported() ? <Mic size={size * 0.48} /> : <MicOff size={size * 0.45} /> : <Mic size={size * 0.48} />}
        </motion.button>
      </div>
      {(label || state !== 'idle') && (
        <div className="title-font" style={{ fontSize: 22, fontWeight: 600, color: '#4a3a7a', order: inPill ? 4 : undefined, flex: inPill ? '1 0 100%' : undefined, textAlign: 'center' }}>
        {listening ? 'Listening… speak now!' : state === 'processing' ? 'Checking…' : label}
        </div>
      )}
      {msg && state === 'idle' && <MicResult {...msg} />}
      {consent && (
        <MicConsent
          onClose={(ok) => {
            setConsent(false)
            if (ok) setTimeout(() => run(true), 50)
          }}
        />
      )}
    </div>
  )
}
