/**
 * Card wrapper styled like a formal invitation tossed onto the table.
 * Cream parchment, soft drop shadow, slight rotation, generous padding.
 *
 * Kept for backwards compatibility — new code should prefer <InvitationPanel>
 * from ./InvitationPanel.jsx, which is more flexible.
 */
export default function InvitationCard({
  tilt = 'rotate-[-1deg]',
  maxWidth = 'max-w-xl',
  children,
}) {
  return (
    <div
      className={`mx-auto ${maxWidth} ${tilt} bg-parchment shadow-lift ring-1 ring-rule/60 px-9 py-12 sm:px-14 sm:py-16`}
    >
      {children}
    </div>
  );
}

/** A bottom-border line input in handwriting script, on parchment. */
export const inviteInputClass =
  'w-full bg-transparent border-0 border-b border-ink/40 focus:border-ink focus:outline-none focus:ring-0 font-hand text-3xl text-ink px-1 py-1 transition-colors';

/** A small caps eyebrow label for form fields and section markers. */
export const inviteLabelClass =
  'block font-invite uppercase tracking-[0.32em] text-[0.72rem] text-ink-faint mb-1';

/**
 * Primary action button — wax-red, gentle press feel, hover tilt only.
 * Old behaviour had a permanent -1deg rotation; that read as cute on one
 * button but cluttered when several appeared together. Now it tilts on hover.
 */
export const inviteButtonClass =
  'inline-flex items-center justify-center font-invite uppercase tracking-[0.28em] text-[0.95rem] sm:text-base bg-seal text-parchment px-7 py-3 shadow-paper hover:bg-seal-deep hover:-rotate-1 hover:-translate-y-0.5 transition-[transform,background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-parchment disabled:opacity-60 disabled:cursor-not-allowed';

/** A quieter secondary / ghost button. */
export const inviteGhostButtonClass =
  'inline-flex items-center justify-center font-invite uppercase tracking-[0.28em] text-[0.95rem] sm:text-base bg-transparent text-ink border border-ink/30 px-7 py-3 hover:bg-parchment-deep hover:border-ink/60 transition-colors focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60 disabled:cursor-not-allowed';
