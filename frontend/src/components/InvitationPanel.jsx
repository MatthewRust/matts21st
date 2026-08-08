import { motion } from 'framer-motion';

/**
 * Unified parchment card primitive. Replaces the ad-hoc `bg-parchment shadow-…
 * ring-…` strings sprinkled across the codebase.
 *
 *   variant   hero    big, square, dramatic shadow — for page titles
 *             card    standard card — for content sections
 *             strip   compact horizontal strip — for countdown / chips
 *             row     low-emphasis row — for list items inside a card
 *   tilt      0.4 | -0.4 | 0 etc.   degrees; default 0 (kept subtle)
 *   lift      adds a hover-lift on cursor (used for clickable cards)
 *
 * The component is a plain div; pass `as={motion.div}` and motion props to
 * animate it, or wrap it in <FadeIn> / <StaggerItem> from MotionPrimitives.
 */
const variants = {
  hero:  'px-8 py-12 sm:px-14 sm:py-16 shadow-lift',
  card:  'px-6 py-7 sm:px-8 sm:py-8 shadow-paper',
  strip: 'px-5 py-3 sm:px-6 sm:py-4 shadow-paper',
  row:   'px-5 py-4 sm:px-6 sm:py-5 shadow-paper',
};

export default function InvitationPanel({
  variant = 'card',
  tilt = 0,
  lift = false,
  as: Comp = 'div',
  className = '',
  style,
  children,
  ...rest
}) {
  const tiltStyle = tilt ? { transform: `rotate(${tilt}deg)`, ...style } : style;
  const hover = lift
    ? 'transition will-change-transform hover:-translate-y-0.5 hover:shadow-lift'
    : '';
  return (
    <Comp
      style={tiltStyle}
      className={`
        relative bg-parchment ring-1 ring-rule/60
        ${variants[variant] ?? variants.card}
        ${hover}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Motion-flavoured variant for use as a hover-lift link card. */
export function MotionPanel({ tilt = 0, variant = 'card', className = '', children, ...rest }) {
  const initialRotate = tilt;
  return (
    <motion.div
      initial={{ rotate: initialRotate }}
      whileHover={{ rotate: 0, y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`
        relative bg-parchment ring-1 ring-rule/60
        ${variants[variant]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
