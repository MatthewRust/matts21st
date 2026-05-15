import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';

const ITEMS = [
  { name: 'Outdoorsy outfit', qty: 1, note: 'For hikes and general adventure.' },
  { name: 'Pub outfit', qty: 1, note: 'Smart-casual for the local.' },
  { name: 'Black tie outfit', qty: 1, note: 'Bring out the finery.' },
  { name: 'Swimming costume', qty: 1, note: 'For the tub/Dee.' },
];

function PackingRow({ item }) {
  return (
    <li className="flex items-center gap-4 py-3 border-b border-stone-200 last:border-0">
      <span className="font-invite text-2xl text-stone-900 w-12 shrink-0 text-center tabular-nums">
        ×{item.qty}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-hand text-2xl text-stone-900 leading-tight">{item.name}</p>
        {item.note && (
          <p className={inviteLabelClass}>{item.note}</p>
        )}
      </div>
    </li>
  );
}

export default function PackingList() {
  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 sm:p-12">
        <div className="max-w-2xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            Don't forget
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Packing List</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— what to bring along —</p>
        </div>

        <div className="max-w-2xl w-full mx-auto">
          <article className="bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-6 sm:px-8 sm:py-7 rotate-[0.4deg]">
            <header className="border-b border-stone-300 pb-3 mb-3">
              <p className={inviteLabelClass}>Recommended</p>
              <h2 className="font-invite text-3xl sm:text-4xl text-stone-900">The essentials</h2>
            </header>
            <ul>
              {ITEMS.map((item) => (
                <PackingRow key={item.name} item={item} />
              ))}
            </ul>
          </article>
        </div>
      </div>
    </div>
  );
}
