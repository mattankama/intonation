/** The six Labs in their fixed order (home page and left rail, decision #18). */
export const LAB_IDS = [
  'sound-waves',
  'beats-and-roughness',
  'tuning-systems',
  'chord-comparison',
  'just-intonation-lattice',
  'edo-explorer',
] as const;

export type LabId = (typeof LAB_IDS)[number];
