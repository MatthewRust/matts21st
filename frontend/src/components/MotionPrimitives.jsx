import { useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1]; // a soft, paper-on-paper easing

export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.45, ease }}
      className="min-h-screen flex flex-col"
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({ as: Tag = 'div', delay = 0, y = 14, children, className, ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Drives the reveal off `animate` rather than `whileInView`. `whileInView` only
// hands "show" to the children registered at the moment it fires, so a group
// that scrolls into view while still empty (fetched lists) leaves any later
// arrivals stranded on "hidden". `animate` is part of the variant tree, so
// children that mount afterwards inherit it and reveal themselves.
export function StaggerGroup({ children, className, stagger = 0.08, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, y = 16 }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { motion, AnimatePresence };
