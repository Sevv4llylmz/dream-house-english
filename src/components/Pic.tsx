import { BG, img } from '../assets/manifest'
import type { SceneItem, Visual } from '../content/types'

/** Any sprite by key: "obj/lamp", "cat/sit", "mia/idle". */
export function Pic({ pic, size = 150, className }: { pic: string; size?: number; className?: string }) {
  return <img src={img(pic)} alt={pic.split('/')[1].replace(/-/g, ' ')} draggable={false} className={className} style={{ maxHeight: size, maxWidth: size * 1.3, objectFit: 'contain', filter: 'drop-shadow(0 5px 5px rgba(60,40,90,0.2))' }} />
}

/** A 1000 x 600 picture made of sprites, scaled to the given width. */
export function Scene({ items, bg, caption, captionTr, width = 640, onTap }: Omit<Extract<Visual, { type: 'scene' }>, 'type'> & { width?: number; onTap?: (i: number) => void }) {
  const H = bg === 'house' ? 563 : 600
  const s = width / 1000
  return (
    <div className="panel" style={{ width, height: H * s, position: 'relative', overflow: 'hidden', flex: 'none', background: 'linear-gradient(#efe6fb 0 62%, #f3dcc0 62% 63%, #f7e6cf 63%)' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1000, height: H, transform: `scale(${s})`, transformOrigin: '0 0' }}>
        {bg && <img src={BG[bg].l} alt="" draggable={false} style={{ position: 'absolute', width: 1000, height: H, objectFit: 'cover' }} />}
        {items.map((it, i) => (
          <Item key={i} it={it} onTap={onTap && (() => onTap(i))} />
        ))}
        {caption && (
          <div className="title-font" style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', fontSize: 62, fontWeight: 700, color: '#3d2a66' }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.92)', borderRadius: 24, padding: '2px 30px' }}>
              {caption}
              {captionTr && <span style={{ display: 'block', fontSize: 46, lineHeight: 1.1, paddingBottom: 6, fontWeight: 800, color: '#e0709b', fontFamily: 'var(--font-body)' }}>{captionTr}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
export function Item({ it, onTap }: { it: SceneItem; onTap?: () => void }) {
  return (
    <img
      src={img(it.k)}
      alt={it.k.split('/')[1]}
      draggable={false}
      onClick={onTap}
      style={{
        position: 'absolute',
        left: it.x,
        top: it.y - it.h,
        height: it.h,
        maxWidth: 'none',
        transform: `translateX(-50%)${it.flip ? ' scaleX(-1)' : ''}${it.sy ? ` scaleY(${it.sy})` : ''}`,
        transformOrigin: '50% 100%',
        clipPath: it.front ? `inset(${it.front * 100}% 0 0 0)` : undefined,
        filter: it.front ? undefined : it.edge ? 'drop-shadow(0 0 2px #6b3f12) drop-shadow(0 3px 2px rgba(70,40,10,0.55))' : it.glow ? 'drop-shadow(0 0 14px #fff2a8) drop-shadow(0 0 5px #f2b705)' : 'drop-shadow(0 6px 5px rgba(60,40,90,0.18))',
        cursor: onTap ? 'pointer' : undefined,
      }}
    />
  )
}
