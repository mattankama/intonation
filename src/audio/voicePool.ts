/**
 * Which voices may sound (decision #6: headroom from a worst-case peak bound). The pool
 * counts every voice that is sounding or still ringing out after its release, and never
 * lets more than its limit in: past it, a new voice takes over from the voice that has
 * rung out longest (or, if all are held, the oldest held one). The engine fades that
 * voice out at least as fast as the new one rises (levels.ts HANDOVER_SECONDS), so the
 * two together never sound louder than one. Pure, so the bound can be unit-tested.
 */
interface Entry<T> {
  readonly voice: T;
  releasing: boolean;
}

export class VoicePool<T> {
  /** Oldest first. */
  private readonly entries: Entry<T>[] = [];

  constructor(private readonly limit: number) {}

  /** Voices sounding or ringing out. */
  get size(): number {
    return this.entries.length;
  }

  /** Lets a new voice in; returns the voice it takes over from (to fade out now), or null. */
  admit(voice: T): T | null {
    let handed: T | null = null;
    if (this.entries.length >= this.limit) {
      const index = Math.max(
        0,
        this.entries.findIndex((e) => e.releasing),
      );
      handed = this.entries.splice(index, 1)[0]!.voice;
    }
    this.entries.push({ voice, releasing: false });
    return handed;
  }

  /** The voice was released: it rings out, and is the first to give way to a new one. */
  release(voice: T): void {
    const entry = this.entries.find((e) => e.voice === voice);
    if (entry) entry.releasing = true;
  }

  /** The voice has fallen silent: its place is free. */
  end(voice: T): void {
    const index = this.entries.findIndex((e) => e.voice === voice);
    if (index >= 0) this.entries.splice(index, 1);
  }
}
