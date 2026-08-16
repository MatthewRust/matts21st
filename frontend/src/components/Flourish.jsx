import { motion } from 'framer-motion';

/* ─── Ornamental divider ────────────────────────────────────────────────── */

/**
 * A small, hand-engraved-feeling flourish used between sections in place of
 * the ad-hoc "★ · ★ · ★" text divider. Two flourishes flank a small fleuron.
 */
export function Flourish({ className = '', tone = 'ink' }) {
  const stroke = tone === 'parchment' ? 'var(--parchment)' : 'var(--ink-soft)';
  const accent = tone === 'parchment' ? 'var(--gold-soft)' : 'var(--gold)';
  return (
    <div className={`flex items-center justify-center gap-3 my-10 select-none ${className}`}>
      <svg width="120" height="14" viewBox="0 0 120 14" fill="none">
        <path
          d="M0 7 H40 M50 7 Q55 2 60 7 T70 7 M80 7 H120"
          stroke={stroke} strokeWidth="1" strokeLinecap="round"
        />
        <circle cx="45" cy="7" r="1" fill={accent} />
        <circle cx="75" cy="7" r="1" fill={accent} />
      </svg>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M7 0 L8.4 5.6 L14 7 L8.4 8.4 L7 14 L5.6 8.4 L0 7 L5.6 5.6 Z"
          fill={accent}
        />
      </svg>
      <svg width="120" height="14" viewBox="0 0 120 14" fill="none">
        <path
          d="M0 7 H40 M50 7 Q55 12 60 7 T70 7 M80 7 H120"
          stroke={stroke} strokeWidth="1" strokeLinecap="round"
        />
        <circle cx="45" cy="7" r="1" fill={accent} />
        <circle cx="75" cy="7" r="1" fill={accent} />
      </svg>
    </div>
  );
}

/* ─── Wax seal ──────────────────────────────────────────────────────────── */

/**
 * A pressed-wax seal SVG with the letter M and a tiny ribbon underneath.
 *
 * `size` fixes the seal in pixels. Pass `sizeClass` instead when it needs to
 * change across breakpoints — a fixed inline width can't respond to one, and
 * the seal overlaps content on the home page, so its footprint has to shrink
 * on narrow screens.
 */
export function WaxSeal({ size = 96, sizeClass, letter = 'M', className = '' }) {
  return (
    <motion.div
      className={`relative inline-block ${sizeClass ?? ''} ${className}`}
      style={sizeClass ? undefined : { width: size, height: size }}
      initial={{ scale: 0, rotate: -90, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.25 }}
      whileHover={{ rotate: -4, scale: 1.05 }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]">
        <defs>
          <radialGradient id="seal-grad" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#a83333" />
            <stop offset="60%"  stopColor="#7b1a1a" />
            <stop offset="100%" stopColor="#4d0e0e" />
          </radialGradient>
          <radialGradient id="seal-shine" cx="35%" cy="30%" r="40%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.45)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* The molten wax blob — irregular edge */}
        <path
          d="M50 4
             C 64 6, 80 10, 90 24
             C 96 34, 96 50, 92 62
             C 96 74, 86 90, 70 94
             C 56 98, 40 96, 26 90
             C 10 84, 2 68, 6 52
             C 2 38, 10 22, 24 12
             C 32 6, 40 4, 50 4 Z"
          fill="url(#seal-grad)"
        />
        {/* Inner border ring */}
        <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
        {/* Top shine */}
        <ellipse cx="38" cy="32" rx="22" ry="14" fill="url(#seal-shine)" />
        {/* The letter */}
        <text
          x="50" y="62"
          textAnchor="middle"
          fontFamily="Cormorant Garamond, serif"
          fontWeight="700"
          fontSize="42"
          fill="#f3e6c8"
          style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.45))' }}
        >
          {letter}
        </text>
        {/* Star above letter */}
        <path
          d="M50 18 L51.4 22 L55.5 22.6 L52.4 25.4 L53.2 29.5 L50 27.4 L46.8 29.5 L47.6 25.4 L44.5 22.6 L48.6 22 Z"
          fill="#f3e6c8" opacity="0.85"
        />
      </svg>
      {/* Ribbon */}
      <svg
        viewBox="0 0 100 24"
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-[140%]"
        aria-hidden="true"
      >
        <path d="M5 4 L95 4 L88 14 L95 24 L5 24 L12 14 Z"
          fill="#7b1a1a"
          stroke="rgba(0,0,0,0.25)"
          strokeWidth="0.6"
        />
        <path d="M0 6 L8 14 L0 22 Z" fill="#5b1111" />
        <path d="M100 6 L92 14 L100 22 Z" fill="#5b1111" />
      </svg>
    </motion.div>
  );
}

/* ─── Corner ornament ───────────────────────────────────────────────────── */

/** A small fleuron used at panel corners on important pages. */
export function CornerOrnament({ className = '', size = 28 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 28 28"
      className={className} aria-hidden="true"
    >
      <path d="M2 2 L14 2 M2 2 L2 14" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round" />
      <path d="M6 2 Q14 6 14 14" stroke="var(--gold)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="14" r="1.4" fill="var(--gold)" />
    </svg>
  );
}
