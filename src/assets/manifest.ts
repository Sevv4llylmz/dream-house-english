/** Central asset manifest. Files are produced from assets-src/ by tools/prepare_assets.py. */
import sizes from './sprites.json'

const base = (import.meta.env?.BASE_URL ?? './') + 'assets/'
export const STAGE_W = 1600
export const STAGE_H = 900

const bg = (n: string) => ({ l: `${base}bg/${n}-yatay.webp`, p: `${base}bg/${n}-dikey.webp` })
export const BG = {
  map: bg('harita'),
  garden: bg('bahce'),
  classroom: bg('sinif'),
  toyRoom: bg('oyuncak-odasi'),
  house: bg('bebek-evi'),
  court: bg('voleybol'),
} as const
export type BgKey = keyof typeof BG

const S = sizes as unknown as Record<string, Record<string, [number, number]>>
/** "obj/lamp", "cat/sit", "mia/wave", "alyav/spike" */
export const img = (k: string) => `${base}${k}.webp`
export function size(k: string): [number, number] {
  const [f, n] = k.split('/')
  const r = S[f]?.[n]
  if (!r) throw new Error('unknown sprite ' + k)
  return r
}
export type Who = 'alya' | 'mia' | 'leo' | 'teacher' | 'alyav' | 'miav' | 'teacherv'
/** height of the standing pose: other poses keep the same scale */
export const refH = (who: Who) => (who.endsWith('v') ? S[who].win[1] : S[who].idle[1])

type Pt = { x: number; y: number }
export type Zone = { x: number; y: number; w: number; h: number }
export type Room = 'purple' | 'turquoise' | 'yellow' | 'pink'
export interface SceneSet {
  markers: Record<'garden' | 'school' | 'toys' | 'house' | 'volley' | 'talk', Pt>
  rooms: Record<Room, Zone>
  court: { scoreA: Pt; scoreT: Pt; scoreSize: number; ground: number; H: number; alya: number; mia: number; spikeX: number; teacher: number; netTop: number; card: Zone; fans: Pt }
  toy: { nearY: number; farY: number; nearX: [number, number]; farX: [number, number]; nearH: number; farH: number }
}
/** Positions painted into the backgrounds, in stage pixels (l = 1600x900, p = 900x1600). */
export const SCENE: { l: SceneSet; p: SceneSet } = {
  l: {
    markers: { garden: { x: 318, y: 650 }, school: { x: 460, y: 318 }, toys: { x: 783, y: 704 }, house: { x: 1146, y: 318 }, volley: { x: 1260, y: 736 }, talk: { x: 800, y: 222 } },
    rooms: { purple: { x: 135, y: 160, w: 655, h: 330 }, turquoise: { x: 820, y: 160, w: 645, h: 330 }, yellow: { x: 135, y: 522, w: 655, h: 332 }, pink: { x: 820, y: 522, w: 645, h: 332 } },
    court: { scoreA: { x: 704, y: 252 }, scoreT: { x: 897, y: 252 }, scoreSize: 92, ground: 625, H: 275, alya: 250, mia: 520, spikeX: 705, teacher: 1260, netTop: 340, card: { x: 250, y: 632, w: 1100, h: 262 }, fans: { x: 345, y: 520 } },
    toy: { nearY: 690, farY: 322, nearX: [470, 1130], farX: [620, 1020], nearH: 170, farH: 92 },
  },
  p: {
    markers: { garden: { x: 282, y: 880 }, school: { x: 245, y: 507 }, toys: { x: 635, y: 1003 }, house: { x: 685, y: 549 }, volley: { x: 391, y: 1396 }, talk: { x: 150, y: 1215 } },
    rooms: { purple: { x: 52, y: 455, w: 388, h: 425 }, turquoise: { x: 462, y: 455, w: 388, h: 425 }, yellow: { x: 52, y: 912, w: 388, h: 435 }, pink: { x: 462, y: 912, w: 388, h: 435 } },
    court: { scoreA: { x: 364, y: 541 }, scoreT: { x: 535, y: 541 }, scoreSize: 82, ground: 1075, H: 250, alya: 105, mia: 275, spikeX: 395, teacher: 740, netTop: 660, card: { x: 24, y: 1105, w: 852, h: 480 }, fans: { x: 620, y: 845 } },
    toy: { nearY: 1215, farY: 582, nearX: [240, 660], farX: [350, 600], nearH: 150, farH: 78 },
  },
}

const SPRITES = Object.entries(S).flatMap(([f, o]) => Object.keys(o).map((n) => img(`${f}/${n}`)))
export const PRELOAD = [...Object.values(BG).flatMap((b) => [b.l, b.p]), ...SPRITES]
export function preloadAll(onProgress?: (done: number, total: number) => void) {
  let done = 0
  return Promise.all(
    PRELOAD.map(
      (src) =>
        new Promise<void>((res) => {
          const im = new Image()
          im.onload = im.onerror = () => {
            onProgress?.(++done, PRELOAD.length)
            res()
          }
          im.src = src
        }),
    ),
  )
}
