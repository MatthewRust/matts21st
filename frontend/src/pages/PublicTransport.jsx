import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';

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

        </div>
      </div>
    </div>
  );
}
