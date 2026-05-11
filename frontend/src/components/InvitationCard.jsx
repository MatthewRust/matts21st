/**
 * Card wrapper styled like a formal invitation tossed onto the table.
 * Cream parchment, drop shadow, slight rotation, generous padding.
 */
export default function InvitationCard({ tilt = '-rotate-2', maxWidth = 'max-w-xl', children }) {
  return (
    <div className={`mx-auto ${maxWidth} ${tilt} bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-10 py-12 sm:px-14 sm:py-16`}>
      {children}
    </div>
  );
}

/** Shared input style — a line on parchment with handwritten input. */
export const inviteInputClass =
  'w-full bg-transparent border-0 border-b border-stone-700 focus:border-stone-900 focus:outline-none focus:ring-0 font-hand text-3xl text-stone-800 px-1 py-1';

export const inviteLabelClass =
  'block font-invite uppercase tracking-[0.3em] text-xs text-stone-600 mb-1';

export const inviteButtonClass =
  'font-invite uppercase tracking-[0.25em] text-lg bg-red-900 text-parchment text-stone-50 px-8 py-3 shadow-lg hover:bg-red-800 transition rotate-[-1deg]';
