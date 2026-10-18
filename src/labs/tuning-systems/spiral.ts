/**
 * The pitch spiral's geometry and the notes picked on it (pure, no three.js).
 * Positions are cents above the Tonic in octave 4: the Tonic sits at the front of the
 * spiral and one turn climbs one octave.
 */
import { type Note, type Ratio, type TuningSystemId, cents, nearestPureInterval } from '../../core';

/** Height gained per octave (one turn), in scene units. */
export const SPIRAL_RISE = 1.6;
/** Radius of the first system's helix; each further system sits a little further out. */
export const SPIRAL_RADIUS = 3;
export const SPIRAL_GAP = 0.32;

/** The helix radius of the k-th compared system (0-based). */
export const systemRadius = (k: number) => SPIRAL_RADIUS + k * SPIRAL_GAP;

/** Octaves drawn (decision #17): two on desktop, one on phones. */
export const spiralOctaves = (phone: boolean) => (phone ? 1 : 2);

/**
 * A point on the spiral `position` cents above the Tonic: x right, y up, z towards the
 * viewer; the Tonic is at the front, turning clockwise seen from above. The spiral is
 * centred on y = 0 for two octaves.
 */
export function spiralPoint(position: number, radius: number): [number, number, number] {
  const turns = position / 1200;
  const angle = Math.PI / 2 - 2 * Math.PI * turns;
  return [radius * Math.cos(angle), turns * SPIRAL_RISE - SPIRAL_RISE, radius * Math.sin(angle)];
}

/** A note picked on the spiral or in the table. */
export interface Pick {
  readonly system: TuningSystemId;
  /** The note to play. */
  readonly note: Note;
  readonly spelling: string;
  /** Cents above the Tonic in octave 4 (1200 and up in the octave above). */
  readonly cents: number;
}

const samePick = (a: Pick, b: Pick) => a.system === b.system && a.cents === b.cents;

/** The picked notes after a click: one note, then two for an interval, then start again. */
export function pickNote(picked: readonly Pick[], next: Pick): readonly Pick[] {
  if (picked.length === 1 && samePick(picked[0]!, next)) return picked;
  return picked.length === 1 ? [picked[0]!, next] : [next];
}

export interface PickedInterval {
  readonly low: Pick;
  readonly high: Pick;
  /** Its size in cents. */
  readonly size: number;
  /** The 5-limit pure interval it aims at. */
  readonly pure: Ratio;
  /** Where the pure interval would put the upper note, in cents above the Tonic. */
  readonly target: number;
  /** Cents the upper note is above (+) or below (−) that target. */
  readonly offPure: number;
}

/** Two picked notes measured from the lower one against the pure interval they aim at. */
export function intervalOf(a: Pick, b: Pick): PickedInterval {
  const [low, high] = a.cents <= b.cents ? [a, b] : [b, a];
  const size = high.cents - low.cents;
  const pure = nearestPureInterval(size);
  const target = low.cents + cents(pure);
  return { low, high, size, pure, target, offPure: high.cents - target };
}
