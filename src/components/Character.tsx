import { motion, type TargetAndTransition } from 'motion/react'
import { img, refH, size, type Who } from '../assets/manifest'

/**
 * Pose-based animation of the supplied artwork (no warping). `height` is the height of the
 * standing pose; every other pose keeps the same scale, so nobody grows or shrinks.
 */
export function Character({ who, pose, height = 360, flip = false, style, onClick, label }: { who: Who; pose: string; height?: number; flip?: boolean; style?: React.CSSProperties; onClick?: () => void; label?: string }) {
  const [w, h] = size(`${who}/${pose}`)
  const s = height / refH(who)
  const jump = /happy|win/.test(pose)
  const anim: TargetAndTransition = jump ? { y: [0, -26, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.5 } } : pose === 'wave' ? { rotate: [0, -2, 0, 2, 0], transition: { duration: 1.6, repeat: Infinity } } : pose === 'sad' || pose === 'oh' ? { y: [0, 5, 0], transition: { duration: 0.8 } } : {}
  const Tag = onClick ? motion.button : motion.div
  return (
    <Tag onClick={onClick} aria-label={label} style={{ position: 'absolute', height, width: height * 0.6, background: 'none', border: 'none', padding: 0, cursor: onClick ? 'pointer' : 'default', ...style }}>
      <motion.div key={pose} animate={anim} style={{ position: 'absolute', left: '50%', bottom: 0, width: w * s, height: h * s, marginLeft: (-w * s) / 2, transformOrigin: '50% 100%' }}>
        <div className={/idle|ready/.test(pose) ? 'breathe' : ''} style={{ width: '100%', height: '100%' }}>
          <img src={img(`${who}/${pose}`)} alt={label ?? who} draggable={false} style={{ width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : undefined, filter: 'drop-shadow(0 8px 8px rgba(40,30,70,0.2))' }} />
        </div>
      </motion.div>
    </Tag>
  )
}
