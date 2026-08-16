import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveAvatar } from '../utils/resolveAvatar.js';

/**
 * Type-to-narrow picker for choosing a person.
 *
 * Behaves like a combobox rather than a plain <select>: the field is a text
 * input that filters the list as you type, but the list is also browsable
 * without typing. With 30-odd guests a native select is workable; this stays
 * usable if the list grows, and matches the handwriting-on-parchment styling
 * that a native dropdown can't take.
 *
 * Keyboard: ArrowUp/ArrowDown move, Enter selects, Escape closes.
 */
export default function UserCombobox({
  users,
  value,            // selected user_id, or null for "everyone"
  onChange,
  placeholder = 'Everyone',
  allLabel = 'Everyone',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = users.find((u) => u.user_id === value) || null;

  // Close when clicking outside. Without this the panel would stay open behind
  // the rest of the page after the user moves on.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? users.filter((u) => u.username.toLowerCase().includes(q))
      : users;
    // "Everyone" is offered as the first option rather than a separate clear
    // button, so resetting is the same gesture as choosing.
    return [{ user_id: null, username: allLabel, photo_count: null }, ...matched];
  }, [users, query, allLabel]);

  // A shrinking list can leave the highlight past the end.
  useEffect(() => {
    if (active >= options.length) setActive(0);
  }, [options.length, active]);

  function choose(option) {
    onChange(option.user_id);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setActive((i) => {
        const next = e.key === 'ArrowDown' ? i + 1 : i - 1;
        return (next + options.length) % options.length;
      });
    } else if (e.key === 'Enter') {
      if (open && options[active]) { e.preventDefault(); choose(options[active]); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative w-full sm:w-64">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="user-combobox-list"
        aria-autocomplete="list"
        value={open ? query : (selected?.username ?? '')}
        placeholder={selected ? selected.username : placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onKeyDown={onKeyDown}
        className="w-full bg-transparent border-0 border-b border-ink/40 focus:border-ink focus:outline-none focus:ring-0 font-hand text-2xl text-ink px-1 py-1 pr-7 transition-colors placeholder:text-ink-faint"
      />

      {/* Caret / clear affordance.
          Drawn as SVG rather than with glyphs like ▾ and ×: those are rendered
          by whatever font the device picks, which on iOS can substitute an
          emoji face and break the hand-lettered look. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={selected ? 'Clear filter' : 'Show list'}
        onClick={() => (selected ? choose({ user_id: null }) : setOpen((o) => !o))}
        className="absolute right-0 bottom-2 text-ink-soft hover:text-ink transition-colors"
      >
        <svg
          viewBox="0 0 16 16"
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {selected ? (
            <>
              <path d="M4 4 L12 12" />
              <path d="M12 4 L4 12" />
            </>
          ) : (
            <path d="M4 6.5 L8 10.5 L12 6.5" />
          )}
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            // AnimatePresence tracks its children by key.
            key="user-combobox-list"
            id="user-combobox-list"
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-parchment ring-1 ring-rule/60 shadow-lift py-1"
          >
            {options.length === 1 && query.trim() && (
              <li className="px-4 py-2 font-hand text-lg text-ink-faint">No one by that name</li>
            )}
            {options.map((option, i) => (
              <li key={option.user_id ?? 'all'} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(option)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    i === active ? 'bg-parchment-deep' : ''
                  }`}
                >
                  {option.user_id === null ? (
                    <span className="w-7 h-7 rounded-full bg-rule/40 shrink-0" />
                  ) : (
                    <Avatar user={option} />
                  )}
                  <span className="font-hand text-xl text-ink flex-1 truncate">{option.username}</span>
                  {option.photo_count != null && (
                    <span className="eyebrow text-ink-faint">{option.photo_count}</span>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ user }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <span className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-rule/60 block">
      {!err && src ? (
        <img src={src} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        <svg viewBox="0 0 80 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
          <circle cx="40" cy="30" r="14" fill="#a89070" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
        </svg>
      )}
    </span>
  );
}
