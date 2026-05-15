import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';

export const DAYS = [
  {
    title: 'Thursday 3rd September - Arrival',
    eyebrow: 'Day one',
    events: [
      { time: '09:00 – 16:00', text: 'Arrive at the property.' },
      { time: '16:00 – 19:00', text: 'Get settled in.' },
      { time: '19:00 – 20:00', text: 'Tea time: Potato, cauliflower and spinach curry with accoutrements.' },
      { time: '20:00 – late', text: 'Matthew Quiz Show: is your team of 2 the smartest here?' },
    ],
  },
  {
    title: 'Friday 4th September - Olympics Day',
    eyebrow: 'Day two',
    events: [
      { time: '09:00 - late', text: 'Olympics Day: Can your team win gold'},
      { time: '11:00 – 12:00', text: 'Tennis'},
      { time: '12:00 – 13:00', text: 'Lunch' },
      { time: '12:00 – ~14:30', text: 'Scavenger hunt: who can find the most, the fastest.' },
      { time: '14:30 – 16:00', text: 'Tub and chill'},
      { time: '16:00 - 19:00', text: 'Games like croque and beer mile'},
      { time: '19:00 – 20:00', text: 'Tea time: BBQ.' },
      { time: '20:00 - late', text: 'Olympics winners ceromony and after party'}
    ],
  },
  {
    title: 'Saturday 5th September - Games Day',
    eyebrow: 'Day three',
    events: [
      { time: '10:00 – 10:45', text: '"High"-K: smoke a J and run a 5K.' },
      { time: '11:00 – 16:00', text: 'Enjoy the games day.' },
      { time: '16:00 – 17:00', text: 'Get ready for dinner.' },
      { time: '17:00 – 19:00', text: 'Cocktails.' },
      { time: '19:00 – 20:00', text: 'Tea time: roast chicken with sides.' },
      { time: '20:00 – late late', text: 'poker — £10 buy in cash, drinks and good times.' },
    ],
  },
  {
    title: 'Sunday 6th September - Traitors',
    eyebrow: 'Day four',
    events: [
      { time: '08:00 – late', text: 'The Traitors game begins…' },
      { time: '12:00 – 13:00', text: 'Wake up.' },
      { time: '13:00 – 15:45', text: 'Refreshing hike up Morrone (mandatory for first timers).' },
      { time: '16:00 – 19:00', text: 'Traitors and Games' },
      { time: '19:00 – 20:00', text: 'Tea time: venison chilli.' },
      { time: '20:00 – late', text: 'Traitors Final Round Table' },
    ],
  },
  {
    title: 'Monday 7th September - Departure',
    eyebrow: 'Day five',
    events: [
      { time: '09:00 – 19:00', text: 'Tidy up and leave :(' },
    ],
  },
];

function EventRow({ event }) {
  return (
    <li className="flex gap-4 py-2 border-b border-stone-200 last:border-0">
      <span className="font-invite uppercase tracking-[0.15em] text-xs text-stone-600 w-32 sm:w-40 shrink-0 pt-1">
        {event.time}
      </span>
      <span className="font-hand text-xl sm:text-2xl text-stone-900 flex-1">
        {event.text}
      </span>
    </li>
  );
}

function DayCard({ day, tilt }) {
  return (
    <article
      className={`bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-6 sm:px-8 sm:py-7 ${tilt} mb-8`}
    >
      <header className="border-b border-stone-300 pb-3 mb-3">
        <p className={inviteLabelClass}>{day.eyebrow}</p>
        <h2 className="font-invite text-3xl sm:text-4xl text-stone-900">{day.title}</h2>
      </header>
      <ul>
        {day.events.map((event, i) => (
          <EventRow key={i} event={event} />
        ))}
      </ul>
    </article>
  );
}

export default function Schedule() {
  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 sm:p-12">
        <div className="max-w-3xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            The running order
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Schedule</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— five days in Braemar —</p>
        </div>

        <div className="max-w-3xl w-full mx-auto">
          {DAYS.map((day, i) => (
            <DayCard
              key={day.title}
              day={day}
              tilt={i % 2 === 0 ? 'rotate-[0.4deg]' : 'rotate-[-0.4deg]'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
