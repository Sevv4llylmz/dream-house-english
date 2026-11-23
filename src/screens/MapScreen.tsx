import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Home, Trophy, Settings as Gear } from 'lucide-react'
import { Backdrop, useScene, useStage } from '../components/Stage'
import { Guide, sayLine } from '../components/Guide'
import { LevelIcon } from '../components/Effects'
import { TopButton } from '../components/LevelShell'
import { useGame, LEVEL_ORDER, type LevelId } from '../store/gameStore'
import { LEVELS } from '../content/meta'
import { UI, WELCOME, type Line } from '../content/lines'
import { sfx } from '../audio/sfx'
import { sayAll } from '../audio/voice'
import { Character } from '../components/Character'

/**
 * Adventure map: the supplied campus artwork with five code-generated level markers.
 * Marker positions are stage coordinates on the painted path (SCENE.map.markers), so they
 * stay on the path at every window size.
 */
export function MapScreen() {
  const go = useGame((s) => s.go)
  const completed = useGame((s) => s.completed)
  const [selected, setSelected] = useState<LevelId | null>(null)
  const [guide, setGuide] = useState<Line | null>(null)
  const firstVisit = !LEVEL_ORDER.some((l) => completed[l])
  const scene = useScene()
  const { portrait, W } = useStage()

  useEffect(() => {
    if (firstVisit) {
      sayAll([WELCOME.story1, WELCOME.story2, WELCOME.story3, UI.chooseLevel].map((l) => ({ text: l.en })))
      setGuide(WELCOME.story2)
    } else setGuide(UI.chooseLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const next = LEVELS.map((l) => l.id).find((l) => !completed[l] && l !== 'talk')
  // Alya stands next to the next open challenge
  const at = next ?? 'volley'
  const alyaPos = scene.markers[at]

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Backdrop bg="map" />
      {guide && <Guide line={guide} auto={!firstVisit} width={900} top={14} portraitTop={122} />}
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', flexDirection: portrait ? 'row' : 'column', gap: 12, zIndex: 30 }}>
        <TopButton label="Menu" onClick={() => go({ name: 'menu' })}>
          <Home size={40} color="#4a3a7a" />
        </TopButton>
        <TopButton label="My rewards" color="btn-sun" onClick={() => go({ name: 'rewards' })}>
          <Trophy size={38} color="#6b4a14" />
        </TopButton>
        <TopButton label="Settings" onClick={() => go({ name: 'settings', back: 'map' })}>
          <Gear size={38} color="#4a3a7a" />
        </TopButton>
      </div>

      <Character who="alya" pose="wave" height={190} style={{ left: Math.min(alyaPos.x + 62, W - 130), top: alyaPos.y - 165, zIndex: 5 }} />

      {LEVELS.map((lv, i) => {
        const p = scene.markers[lv.id]
                const done = !!completed[lv.id]
        const isNext = lv.id === next
        return (
          <motion.button
            key={lv.id}
            data-testid={`marker-${lv.id}`}
            aria-label={`Level ${lv.num}: ${lv.title}${done ? ' (completed)' : ''}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15 * i, type: 'spring' }}
            whileHover={{ scale: 1.1 }}
            whileFocus={{ scale: 1.1 }}
            className={isNext ? 'pulse-glow' : ''}
            onClick={() => {
              sfx.pop()
              setSelected(lv.id)
              sayLine(lv.name)
            }}
            style={{
              position: 'absolute',
              left: p.x - 56,
              top: p.y - 70,
              width: 112,
              height: 112,
              borderRadius: '50%',
              border: `6px solid ${done ? '#f7d77b' : '#fff'}`,
              background: `radial-gradient(circle at 35% 30%, #ffffffaa, ${lv.colour} 60%)`,
              boxShadow: '0 8px 0 rgba(36,93,97,0.45), 0 14px 22px rgba(0,0,0,0.3)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              zIndex: 6,
            }}
          >
            <LevelIcon icon={lv.icon} size={52} />
            <span className="title-font" style={{ position: 'absolute', top: -14, left: -14, width: 46, height: 46, borderRadius: '50%', background: '#4a3a7a', color: '#fff', fontSize: 26, fontWeight: 700, display: 'grid', placeItems: 'center', border: '4px solid #fff' }}>
              {lv.num}
            </span>
            {done && (
              <span style={{ position: 'absolute', bottom: -10, right: -12, width: 50, height: 50, borderRadius: '50%', background: '#3fae6a', display: 'grid', placeItems: 'center', border: '4px solid #fff' }}>
                <Check size={30} color="#fff" strokeWidth={4} />
              </span>
            )}
            <span className="title-font" style={{ position: 'absolute', top: 112, whiteSpace: 'nowrap', fontSize: 24, fontWeight: 700, color: '#4a3a7a', background: 'rgba(255,247,232,0.95)', padding: '2px 14px', borderRadius: 14, border: '3px solid #fff' }}>
              {lv.title}
            </span>
          </motion.button>
        )
      })}

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(36,93,97,0.35)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={() => setSelected(null)}>
            {(() => {
              const lv = LEVELS.find((l) => l.id === selected)!
              return (
                <motion.div initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="panel" style={{ width: 640, padding: 36, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'grid', placeItems: 'center', width: 120, height: 120, borderRadius: '50%', background: lv.colour, margin: '0 auto', border: '6px solid #fff' }}>
                    <LevelIcon icon={lv.icon} size={64} />
                  </div>
                  <div className="title-font" style={{ fontSize: 28, color: '#1f9c9c', marginTop: 12 }}>
                    Level {lv.num} · {lv.place}
                  </div>
                  <div className="title-font" style={{ fontSize: 60, fontWeight: 700, color: lv.colour }}>{lv.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#7a6a55' }}>Reward: {lv.reward}</div>
                  <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 26 }}>
                    <button className="btn btn-cream title-font" style={{ fontSize: 32, padding: '12px 32px' }} onClick={() => setSelected(null)}>
                      Not now
                    </button>
                    <button
                      className="btn btn-teal title-font"
                      style={{ fontSize: 38, padding: '12px 46px' }}
                      onClick={() => {
                        sfx.click()
                        go({ name: 'level', level: lv.id })
                      }}
                    >
                      {completed[lv.id] ? 'Play again' : "Let's go!"}
                    </button>
                  </div>
                </motion.div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
