import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import { Flourish } from '../components/Flourish.jsx';
import { PageTransition, FadeIn, StaggerGroup, StaggerItem } from '../components/MotionPrimitives.jsx';

const ITEMS = [
  { name: 'Outdoorsy outfit',  qty: 1, note: 'For hikes and the outdoors.' },
  { name: 'Pub outfit',        qty: 1, note: 'Pubfit or poufit.' },
  { name: 'Black tie outfit',  qty: 1, note: 'For the formal dinner.' },
  { name: 'Swimming costume',  qty: 1, note: 'For the tub or the Dee.' },
  { name: 'Sports apparel',    qty: 1, note: 'For general sporting activity.' },
];

function PackingRow({ item }) {
  return (
    <StaggerItem>
      <li className="flex items-center gap-5 py-4 border-b border-rule/40 last:border-0">
        <span className="font-invite text-3xl text-ink w-12 shrink-0 text-center num">
          ×{item.qty}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-hand text-2xl text-ink leading-tight">{item.name}</p>
          {item.note && (
            <p className="eyebrow mt-1 text-ink-faint">{item.note}</p>
          )}
        </div>
        <span className="font-invite text-gold text-2xl select-none">✓</span>
      </li>
    </StaggerItem>
  );
}

export default function PackingList() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-2xl w-full mx-auto mb-2">
            <InvitationPanel variant="hero" className="text-center">
              <p className="eyebrow">Don't forget</p>
              <h1 className="font-invite text-display text-ink mt-2">Packing List</h1>
              <div className="hairline-gold w-32 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">— what to bring —</p>
            </InvitationPanel>
          </FadeIn>

          <Flourish />

          <FadeIn className="max-w-2xl w-full mx-auto">
            <InvitationPanel variant="card" tilt={0.3}>
              <header className="border-b border-rule/60 pb-4 mb-4">
                <p className="eyebrow text-gold">Recommended</p>
                <h2 className="font-invite text-3xl sm:text-4xl text-ink mt-1">The essentials</h2>
              </header>
              <ol>
                <StaggerGroup stagger={0.05}>
                  {ITEMS.map((item) => (
                    <PackingRow key={item.name} item={item} />
                  ))}
                </StaggerGroup>
              </ol>
            </InvitationPanel>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
