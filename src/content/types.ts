import type { Line } from './lines'
import type { BgKey } from '../assets/manifest'

export type Skill = 'vocabulary' | 'listening' | 'speaking' | 'grammar'

/** Sprite key: "obj/lamp", "cat/sit", "mia/idle". */
export type PicRef = string

/** One thing in a 1000 x 600 picture: x = centre, y = bottom, h = height. */
export interface SceneItem {
  k: string
  x: number
  y: number
  h: number
  flip?: boolean
  /** draw again only the part below this fraction (the front of an open box) */
  front?: number
  glow?: boolean
}

export type Visual =
  | { type: 'object'; pic: PicRef }
  | { type: 'scene'; items: SceneItem[]; bg?: BgKey; caption?: string }
  | { type: 'listen' }
  | { type: 'text'; text: string }
  | { type: 'person'; who: 'teacher' | 'mia' | 'leo' | 'alya'; pose: string }
  | { type: 'none' }

export interface Option {
  id: string
  label?: string
  pic?: PicRef
  correct: boolean
  /** spoken in Alya's voice when chosen (model answer) */
  say?: string
}

export interface SpeakSpecData {
  accept: string[]
  keyword?: string
  rivals?: string[]
  pattern?: RegExp
}

export interface ChoiceRound {
  id: string // item key for progress tracking
  topic: string
  skill: Skill
  prompt: Line
  visual?: Visual
  options: Option[]
  hint: Line
  after?: Line
  speak?: SpeakSpecData
  /** listening rounds: hide the prompt text until answered */
  hideText?: boolean
  /** short teaching card shown before the round */
  teach?: { word: string; tr: string; meaning: string; meaningTr: string; wordLine: Line; line: Line }
  layout?: 'pictures' | 'sentences' | 'numbers'
}
