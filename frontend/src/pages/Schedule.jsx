import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import { Flourish } from '../components/Flourish.jsx';
import { PageTransition, FadeIn, StaggerGroup, StaggerItem } from '../components/MotionPrimitives.jsx';

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
      { time: '09:00 - late', text: 'Olympics Day: Can your team win gold' },
      { time: '11:00 – 12:00', text: 'Tennis' },
      { time: '12:00 – 13:00', text: 'Lunch' },
      { time: '12:00 – ~14:30', text: 'Scavenger hunt: who can find the most, the fastest.' },
      { time: '14:30 – 16:00', text: 'Tub and chill' },
      { time: '16:00 - 19:00', text: 'Games like croque and beer mile' },
      { time: '19:00 – 20:00', text: 'Tea time: BBQ.' },
      { time: '20:00 - late', text: 'Olympics winners ceromony and after party' },
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

function splitTitle(t) {
  const [head, ...rest] = t.split(' - ');
  return { head: head.trim(), tail: rest.join(' - ').trim() };
}

function EventRow({ event }) {
  return (
    <StaggerItem>
      <li className="relative pl-8 sm:pl-10 py-3 border-b border-rule/40 last:border-0">
        {/* timeline pip */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-5 w-3 h-3 rounded-full bg-gold ring-4 ring-parchment shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
        />
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-5">
          <span className="font-invite uppercase tracking-[0.18em] text-[0.7rem] text-ink-faint w-40 shrink-0 num pt-1">
            {event.time}
          </span>
          <span className="font-hand text-2xl text-ink leading-snug flex-1">
            {event.text}
          </span>
        </div>
      </li>
    </StaggerItem>
  );
}

function DayCard({ day, tilt }) {
  const { head, tail } = splitTitle(day.title);
  return (
    <FadeIn>
      <InvitationPanel variant="card" tilt={tilt} className="mb-8 sm:mb-10">
        <header className="border-b border-rule/60 pb-4 mb-5">
          <p className="eyebrow text-gold">{day.eyebrow}</p>
          <h2 className="font-invite text-3xl sm:text-4xl text-ink mt-1">{head}</h2>
          {tail && <p className="font-hand text-xl text-ink-soft mt-1">— {tail} —</p>}
        </header>
        <ol className="relative">
          {/* the connecting rail */}
          <span
            aria-hidden="true"
            className="absolute left-[5.5px] top-2 bottom-2 w-px bg-rule/60"
          />
          <StaggerGroup stagger={0.05}>
            {day.events.map((event, i) => (
              <EventRow key={i} event={event} />
            ))}
          </StaggerGroup>
        </ol>
      </InvitationPanel>
    </FadeIn>
  );
}

export default function Schedule() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-3xl w-full mx-auto mb-2">
            <InvitationPanel variant="hero" className="text-center">
              <p className="eyebrow">What's on</p>
              <h1 className="font-invite text-display text-ink mt-2">Schedule</h1>
              <div className="hairline-gold w-32 mx-auto my-5" />
              <p className="font-hand text-2xl text-ink-soft">— five days in Braemar —</p>
            </InvitationPanel>
          </FadeIn>

          <Flourish />

          <div className="max-w-3xl w-full mx-auto">
            {DAYS.map((day, i) => (
              <DayCard
                key={day.title}
                day={day}
                tilt={i % 2 === 0 ? 0.3 : -0.3}
              />
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
