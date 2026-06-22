/*
  Project: Soapbox frontend compatibility layer

  File: react-motion.tsx

  Purpose:

    Provide the small subset of the old react-motion API still used by
    the frontend after moving the app to React 19.

  Responsibilities:

    - expose Motion, TransitionMotion, presets, and spring
    - resolve spring values to their final numeric state
    - keep old call sites buildable while the animations are simplified

  This file intentionally does NOT contain:

    - a physics animation engine
    - component-specific animation behavior
    - layout or visual styling
*/

import type { CSSProperties } from 'react';

type MotionStyleValue = number | { val: number };
type MotionStyle = Record<string, MotionStyleValue>;
type PlainStyle = Record<string, number>;

interface SpringOptions {
  damping?: number;
  precision?: number;
  stiffness?: number;
}

interface MotionProps {
  children(style: PlainStyle): React.ReactNode;
  defaultStyle?: PlainStyle;
  style?: MotionStyle;
}

interface TransitionStyle {
  data?: any;
  key: string;
  style: MotionStyle;
}

interface TransitionPlainStyle {
  data?: any;
  key: string;
  style: PlainStyle;
}

interface TransitionMotionProps {
  children(styles: TransitionPlainStyle[]): React.ReactNode;
  styles: TransitionStyle[];
  willEnter?(): MotionStyle;
  willLeave?(): MotionStyle;
}

const resolveValue = (value: MotionStyleValue): number => {
  if (typeof value === 'object' && value && 'val' in value) {
    return value.val;
  }

  return value;
};

const resolveStyle = (style: MotionStyle = {}): PlainStyle => {
  const result: PlainStyle = {};

  Object.entries(style).forEach(([key, value]) => {
    result[key] = resolveValue(value);
  });

  return result;
};

const spring = (value: number, _options?: SpringOptions): number => value;

const presets = {
  gentle: {
    damping: 14,
    stiffness: 120,
  },
};

const Motion = ({ children, style = {} }: MotionProps): JSX.Element => (
  <>{children(resolveStyle(style))}</>
);

const TransitionMotion = ({ children, styles }: TransitionMotionProps): JSX.Element => (
  <>
    {children(styles.map(({ key, data, style }) => ({
      data,
      key,
      style: resolveStyle(style),
    })))}
  </>
);

export {
  Motion,
  TransitionMotion,
  presets,
  spring,
};

export type {
  CSSProperties,
  MotionProps,
};

/* end of react-motion.tsx */
