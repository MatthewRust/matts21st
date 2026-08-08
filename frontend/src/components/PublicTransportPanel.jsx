import { useEffect, useState } from 'react';
import InvitationPanel from './InvitationPanel.jsx';
import { FadeIn, StaggerGroup, StaggerItem } from './MotionPrimitives.jsx';
import { inviteLabelClass, inviteButtonClass } from './InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ROUTES = [
  {
    title: 'Via Dundee',
    subtitle: 'The quickest',
    totalTime: '~ 3.5 hours',
    legs: [
      { provider: 'ScotRail', from: 'Edinburgh', to: 'Dundee',  mode: 'Train' },
      { provider: 'Ember',    from: 'Dundee',    to: 'Braemar', mode: 'Bus' },
    ],
    links: [
      {
        label: 'Edi to Braemar',
        href: 'https://www.rome2rio.com/map/Edinburgh/Braemar?route=Train-bus&departureDate=2026-09-03',
      },
    ],
  },
  {
    title: 'Via Aberdeen',
    subtitle: 'The scenic route',
    totalTime: '~ 5–7 hours',
    legs: [
      { provider: 'ScotRail', from: 'Edinburgh', to: 'Aberdeen', mode: 'Train' },
      { provider: 'Ember',    from: 'Aberdeen',  to: 'Braemar',  mode: 'Bus' },
    ],
    links: [
      {
        label: 'Edi to Aber',
        href: 'https://www.scotrail.co.uk/train-times/edinburgh-waverley-to-aberdeen',
      },
      {
        label: 'Aber to Braemar',
        href: 'https://www.rome2rio.com/map/Aberdeen/Braemar?route=Bus&segment=0&departureDate=2026-09-03',
      },
    ],
  },
];

function Avatar({ user, size = 'w-12 h-12', ring = 'ring-2 ring-rule/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-paper`}>
      {!err && src ? (
        <img
          src={src}
          alt={user?.username ?? 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
          <circle cx="40" cy="30" r="14" fill="#a89070" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
        </svg>
      )}
    </div>
  );
}

function ModeBadge({ mode }) {
  const icon = mode === 'Train' ? '🚆' : mode === 'Bus' ? '🚌' : '·';
  return (
    <span className="inline-flex items-center gap-1.5 font-invite uppercase tracking-[0.18em] text-[0.7rem] text-ink-faint">
      <span aria-hidden="true">{icon}</span>
      {mode}
    </span>
  );
}

function formatArrival(iso) {
  if (!iso) return 'Time TBC';
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Leg({ leg, last }) {
  return (
    <li className="relative pl-7 py-3">
      <span
        aria-hidden="true"
        className="absolute left-0 top-5 w-3 h-3 rounded-full bg-gold ring-4 ring-parchment"
      />
      {!last && (
        <span aria-hidden="true" className="absolute left-[5.5px] top-7 bottom-0 w-px bg-rule/60" />
      )}
      <ModeBadge mode={leg.mode} />
      <p className="font-hand text-2xl text-ink mt-0.5">
        {leg.from} <span className="text-ink-faint">→</span> {leg.to}
      </p>
      <p className="font-hand text-base text-ink-faint">{leg.provider}</p>
    </li>
  );
}

function RouteCard({ route, tilt }) {
  return (
    <StaggerItem>
      <InvitationPanel variant="card" tilt={tilt} className="mb-7">
        <header className="flex items-end justify-between gap-3 mb-4 border-b border-rule/60 pb-4">
          <div>
            <p className="eyebrow text-gold">{route.subtitle}</p>
            <h2 className="font-invite text-3xl sm:text-4xl text-ink mt-1">{route.title}</h2>
          </div>
          <p className="font-hand text-xl sm:text-2xl text-ink-soft whitespace-nowrap num">
            {route.totalTime}
          </p>
        </header>

        <ol>
          {route.legs.map((leg, i) => (
            <Leg key={i} leg={leg} last={i === route.legs.length - 1} />
          ))}
        </ol>

        <div className="flex flex-wrap gap-3 justify-center pt-5 mt-4 border-t border-rule/60">
          {route.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${inviteButtonClass} text-xs px-5 py-2`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </InvitationPanel>
    </StaggerItem>
  );
}

function TravellerRow({ traveller }) {
  return (
    <li className="flex items-center gap-4 py-3 border-b border-rule/40 last:border-0">
      <Avatar user={traveller} />
      <div className="flex-1 min-w-0">
        <p className="font-hand text-2xl text-ink truncate">{traveller.username}</p>
        <p className="eyebrow">Arrives {formatArrival(traveller.exp_arrival_date)}</p>
      </div>
    </li>
  );
}

function TravellersCard({ tilt }) {
  const [travellers, setTravellers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/users`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((users) => {
        if (cancelled) return;
        const filtered = users
          .filter((u) => u.public_transport === true)
          .sort((a, b) => {
            const aT = a.exp_arrival_date ? new Date(a.exp_arrival_date).getTime() : Infinity;
            const bT = b.exp_arrival_date ? new Date(b.exp_arrival_date).getTime() : Infinity;
            if (aT !== bT) return aT - bT;
            return a.username.localeCompare(b.username);
          });
        setTravellers(filtered);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, []);

  return (
    <StaggerItem>
      <InvitationPanel variant="card" tilt={tilt}>
        <div className="border-b border-rule/60 pb-4 mb-4">
          <p className="eyebrow text-gold">Travelling together</p>
          <h2 className="font-invite text-3xl sm:text-4xl text-ink mt-1">By public transport</h2>
        </div>

        {!travellers && !error && (
          <p className="font-hand text-xl text-ink-faint text-center py-4">Loading…</p>
        )}
        {error && (
          <p className="font-hand text-xl text-seal text-center py-4">{error}</p>
        )}
        {travellers && travellers.length === 0 && (
          <p className="font-hand text-xl text-ink-faint text-center py-4">
            No one's confirmed public transport yet.
          </p>
        )}
        {travellers && travellers.length > 0 && (
          <ul>
            {travellers.map((t) => (
              <TravellerRow key={t.user_id} traveller={t} />
            ))}
          </ul>
        )}
      </InvitationPanel>
    </StaggerItem>
  );
}

export default function PublicTransportPanel() {
  return (
    <FadeIn className="mx-auto max-w-3xl w-full">
      <StaggerGroup>
        {ROUTES.map((route, i) => (
          <RouteCard
            key={route.title}
            route={route}
            tilt={i % 2 === 0 ? 0.3 : -0.3}
          />
        ))}

        <TravellersCard tilt={ROUTES.length % 2 === 0 ? 0.3 : -0.3} />
      </StaggerGroup>
    </FadeIn>
  );
}
