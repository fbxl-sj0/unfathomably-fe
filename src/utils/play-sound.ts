/*
 * Unfathomably FE
 * File: play-sound.ts
 * Purpose: Load and play optional interface sounds without extending app startup.
 * This file intentionally does not create audio elements until a sound is requested.
 */

import type { Sounds } from '@/utils/sounds.ts';

const soundNames = new Set<Sounds>(['boop', 'chat']);

/** Load the audio implementation on demand and play a known interface sound. */
const playSound = (sound: unknown): void => {
  if (!soundNames.has(sound as Sounds)) {
    return;
  }

  void import('@/utils/sounds.ts')
    .then(({ play, soundCache }) => play(soundCache[sound as Sounds]))
    .catch((error: unknown) => {
      console.error('Failed to play interface sound', error);
    });
};

export { playSound };

/* end of play-sound.ts */
