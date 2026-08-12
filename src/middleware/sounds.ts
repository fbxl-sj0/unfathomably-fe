import { playSound } from '@/utils/play-sound.ts';

import type { Sounds } from '@/utils/sounds.ts';
import type { AnyAction, Middleware } from 'redux';

interface Action extends AnyAction {
  meta?: {
    sound?: Sounds;
  };
}

/** Middleware to play sounds in response to certain Redux actions. */
export default function soundsMiddleware(): Middleware {
  return () => next => anyAction => {
    const action = anyAction as Action;
    if (action.meta?.sound) {
      playSound(action.meta.sound);
    }

    return next(action);
  };
}
