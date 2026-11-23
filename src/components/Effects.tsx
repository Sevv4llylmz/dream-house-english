import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Cat, House, Megaphone, School, ToyBrick, Trophy } from 'lucide-react'
import { img } from '../assets/manifest'
import type { LevelMeta } from '../content/meta'

const COLS = ['#f7d77b', '#8fe0dc', '#c8a2e0', '#f4b7cc', '#40c9c6', '#a884d6', '#fff0b8']

export function Confetti({ count = 70, duration = 2.6 }: { count?: number; duration?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: Math.random() * 1600,
        d: Math.random() * 0.8,
        r: Math.random() * 720 - 360,
        c: COLS[i % COLS.length],
        w: 12 + Math.random() * 12,
        drift: Math.random() * 200 - 100,
      })),
    [count],
  )
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 120 }}>
      {bits.map((b, i) => (
        <motion.div
          key={i}
          initial={{ x: b.x, y: -40, rotate: 0, opacity: 1 }}
          animate={{ x: b.x + b.drift, y: 960, rotate: b.r, opacity: [1, 1, 0.8] }}
          transition={{ duration: duration + Math.random(), delay: b.d, ease: 'easeIn' }}
          style={{ position: 'absolute', width: b.w, height: b.w * 0.6, background: b.c, borderRadius: 4 }}
        />
      ))}
    </div>
  )
}

/** Little star burst at a point (stage px) – used for correct answers. */
export function StarBurst({ x, y, n = 8 }: { x: number; y: number; n?: number }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none', zIndex: 90 }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2
        return (
          <motion.svg
            key={i}
            width="34"
            height="34"
            viewBox="0 0 24 24"
            style={{ position: 'absolute', left: -17, top: -17 }}
            initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
            animate={{ x: Math.cos(a) * 120, y: Math.sin(a) * 120, scale: 1, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <path d="M12 1l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill={COLS[i % COLS.length]} stroke="#fff" strokeWidth="1.2" />
          </motion.svg>
        )
      })}
    </div>
  )
}

export function LevelIcon({ icon, size = 40, color = '#fff' }: { icon: LevelMeta['icon']; size?: number; color?: string }) {
  const I = { talk: Megaphone, cat: Cat, school: School, toy: ToyBrick, home: House, trophy: Trophy }[icon]
  return <I size={size} color={color} strokeWidth={2.4} />
}

/** Reward: star key for the four units, cup for volleyball, star for Teacher Talk. */
export function Badge({ meta, size = 200, earned = true }: { meta: LevelMeta; size?: number; earned?: boolean }) {
  const pic = meta.id === 'volley' ? 'obj/trophy' : meta.id === 'talk' ? 'obj/cushion' : 'obj/key'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `radial-gradient(circle at 40% 30%, #fff, ${meta.colour}66 75%)`, border: `${size * 0.04}px solid ${meta.colour}`, boxShadow: 'inset 0 0 0 5px #fff', filter: earned ? undefined : 'grayscale(1) opacity(0.4)' }}>
      <img src={img(pic)} alt="" draggable={false} style={{ maxHeight: size * 0.72, maxWidth: size * 0.66 }} />
    </div>
  )
}

export function TrophyArt({ size = 260 }: { size?: number }) {
  return <img src={img('obj/trophy')} alt="Trophy" draggable={false} style={{ height: size }} />
}
