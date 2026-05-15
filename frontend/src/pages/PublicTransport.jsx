import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';
import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ROUTES = [
  {
    title: 'Via Dundee',
    subtitle: 'The swift way',
    totalTime: '~ 3.5 hours',
    legs: [
      { icon: '', provider: 'ScotRail', from: 'Edinburgh', to: 'Dundee', mode: 'Train' },
      { icon: '', provider: 'Ember',    from: 'Dundee',    to: 'Braemar', mode: 'Bus' },
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
    subtitle: 'The scenic way',
    totalTime: '~ 5–7 hours',
    legs: [
      { icon: '', provider: 'ScotRail', from: 'Edinburgh', to: 'Aberdeen', mode: 'Train' },
      { icon: '', provider: 'Ember',    from: 'Aberdeen',  to: 'Braemar',  mode: 'Bus' },
    ],
    links: [
      {
        label: 'Edi to Aber',
        href: 'https://www.scotrail.co.uk/train-times/edinburgh-waverley-to-aberdeen?gad_source=1&gad_campaignid=13139459975&gbraid=0AAAAAD3h74veKZbRydAe3agvvfJM4QS2e&gclid=Cj0KCQjwiJvQBhCYARIsAMjts3JaRAtTBH_2YxWelmjUJMrOe6yPXtoEbtYreOemmmh8XYLYzwVHg9UaAssNEALw_wcB',
      },
      {
        label: 'Aber to Braemar',
        href: 'https://www.rome2rio.com/map/Aberdeen/Braemar?route=Bus&segment=0&departureDate=2026-09-03',
      },
    ],
  },
];

function Leg({ leg }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="text-3xl sm:text-4xl leading-none shrink-0">{leg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={inviteLabelClass}>{leg.mode} · {leg.provider}</p>
        <p className="font-hand text-2xl text-stone-900 truncate">
          {leg.from} <span className="text-stone-500">→</span> {leg.to}
        </p>
      </div>
    </div>
  );
}

function RouteCard({ route, tilt }) {
  return (
    <div
      className={`bg-parchment shadow-lg ring-1 ring-stone-300/60 px-5 py-5 sm:px-7 sm:py-6 ${tilt} mb-8`}
    >
      <div className="flex items-end justify-between gap-3 mb-3 border-b border-stone-300 pb-3">
        <div>
          <p className={inviteLabelClass}>{route.subtitle}</p>
          <h2 className="font-invite text-3xl sm:text-4xl text-stone-900">{route.title}</h2>
        </div>
        <p className="font-hand text-xl sm:text-2xl text-stone-700 whitespace-nowrap">
          {route.totalTime}
        </p>
      </div>

      <div className="divide-y divide-stone-200">
        {route.legs.map((leg, i) => (
          <Leg key={i} leg={leg} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center pt-5 mt-3 border-t border-stone-300">
        {route.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-invite uppercase tracking-[0.2em] text-sm bg-red-900 text-parchment text-stone-50 px-5 py-2 shadow-md hover:bg-red-800 transition rotate-[-1deg]"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function Avatar({ user, size = 'w-12 h-12', ring = 'ring-2 ring-stone-300/60' }) {
  const [err, setErr] = useState(false);
  const src = resolveAvatar(user?.profile_pic_url);
  return (
    <div className={`${size} ${ring} rounded-full overflow-hidden shrink-0 shadow-md`}>
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

function TravellerRow({ traveller }) {
  return (
    <li className="flex items-center gap-4 py-3 border-b border-stone-200 last:border-0">
      <Avatar user={traveller} />
      <div className="flex-1 min-w-0">
        <p className="font-hand text-2xl text-stone-900 truncate">{traveller.username}</p>
        <p className={inviteLabelClass}>Arrives {formatArrival(traveller.exp_arrival_date)}</p>
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
    <div
      className={`bg-parchment shadow-lg ring-1 ring-stone-300/60 px-5 py-5 sm:px-7 sm:py-6 ${tilt} mb-2`}
    >
      <div className="border-b border-stone-300 pb-3 mb-3">
        <p className={inviteLabelClass}>Travelling together</p>
        <h2 className="font-invite text-3xl sm:text-4xl text-stone-900">By Public Transport</h2>
      </div>

      {!travellers && !error && (
        <p className="font-hand text-xl text-stone-500 text-center py-4">Loading…</p>
      )}
      {error && (
        <p className="font-hand text-xl text-red-800 text-center py-4">{error}</p>
      )}
      {travellers && travellers.length === 0 && (
        <p className="font-hand text-xl text-stone-500 text-center py-4">
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
    </div>
  );
}

export default function PublicTransport() {
  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-start justify-center p-6 sm:p-12">
        <div className="mx-auto max-w-3xl w-full bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-10 sm:px-10 sm:py-12 rotate-[-0.3deg]">

          <div className="text-center mb-8">
            <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
              How to arrive
            </p>
            <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Public Transport</h1>
            <p className="font-hand text-2xl text-stone-600 mt-1">— two routes to Braemar —</p>
          </div>

          {ROUTES.map((route, i) => (
            <RouteCard
              key={route.title}
              route={route}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}

          <TravellersCard tilt={ROUTES.length % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'} />

        </div>
      </div>
    </div>
  );
}
