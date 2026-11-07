export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 38, mass: 0.8 },
  smooth: { type: 'spring', stiffness: 260, damping: 30 },
  gentle: { type: 'spring', stiffness: 140, damping: 22 },
  settle: { type: 'spring', duration: 0.5, bounce: 0.15 },
} as const;

export const ease = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

export const dur = { micro: 0.12, short: 0.2, medium: 0.32, long: 0.7, scene: 0.9 } as const;
export const stagger = 0.04;

/** Enter from slightly below with opacity; never from scale(0). */
export const rise = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6, transition: { duration: dur.short * 0.7, ease: ease.out } },
  transition: { duration: dur.medium, ease: ease.out },
} as const;

export const pop = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: dur.short * 0.7, ease: ease.out } },
  transition: spring.snappy,
} as const;

export const cssEase = {
  out: 'cubic-bezier(0.23, 1, 0.32, 1)',
  inOut: 'cubic-bezier(0.77, 0, 0.175, 1)',
  drawer: 'cubic-bezier(0.32, 0.72, 0, 1)',
} as const;
