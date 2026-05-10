import type { Variants, Transition } from 'framer-motion';

export const easeOutQuart: Transition['ease'] = [0.22, 1, 0.36, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOutQuart } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easeOutQuart } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutQuart } },
};

export const subtleHover = {
  rest: { y: 0, transition: { duration: 0.3, ease: easeOutQuart } },
  hover: { y: -2, transition: { duration: 0.25, ease: easeOutQuart } },
};

export const arrowSlide = {
  rest: { x: 0 },
  hover: { x: 3, transition: { duration: 0.3, ease: easeOutQuart } },
};
