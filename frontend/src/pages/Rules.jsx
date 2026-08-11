import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import { Flourish } from '../components/Flourish.jsx';
import { PageTransition, FadeIn, StaggerGroup, StaggerItem } from '../components/MotionPrimitives.jsx';

const SECTIONS = [
  {
    eyebrow: 'First things first',
    title: 'Not a student flat',
    rules: [
      'This is our home, not a student flat — please treat it that way.',
      'Report any accidental damage as soon as it happens, so there is time to get it sorted.',
    ],
  },
  {
    eyebrow: 'Drinks',
    title: 'Red wine stays put',
    rules: [
      'No red wine or coloured drinks anywhere except the kitchen or outside.',
      'No silly mixed drinks.',
      'Use the can crusher.',
    ],
  },
  {
    eyebrow: 'Doors and windows',
    title: 'Mind the bats',
    rules: [
      'Only open windows that have a mesh.',
      'Shut the back door behind you at all times — especially at dawn, dusk and after dark. There are bats in the garden and the light draws them in.',
      'Keeping the back hall light off when you use the back door helps too.',
    ],
  },
  {
    eyebrow: 'If someone is worse for wear',
    title: 'Away from the carpets',
    rules: [
      'Anyone feeling sick should be kept well away from any room with a carpet.',
      'Buckets and towels go by the side of the bed.',
      'Anything "soiled" is yours to wash — washing machine instructions to follow.',
    ],
  },
  {
    eyebrow: 'Before you go',
    title: 'Leave it as you found it',
    rules: [
      'Strip your bed and leave the sheets in the yellow bag.',
      'Empty the bins. Matthew will point out which one goes down to the end of the gate.',
    ],
  },
];

function RuleCard({ section, tilt }) {
  return (
    <FadeIn>
      <InvitationPanel variant="card" tilt={tilt} className="mb-8 sm:mb-10">
        <header className="border-b border-rule/60 pb-4 mb-5">
          <p className="eyebrow text-gold">{section.eyebrow}</p>
          <h2 className="font-invite text-3xl sm:text-4xl text-ink mt-1">{section.title}</h2>
        </header>
        <ul>
          <StaggerGroup stagger={0.05}>
            {section.rules.map((rule) => (
              <StaggerItem key={rule}>
                <li className="relative pl-8 sm:pl-10 py-3 border-b border-rule/40 last:border-0">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-[1.35rem] w-3 h-3 rounded-full bg-gold ring-4 ring-parchment shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                  />
                  <span className="font-hand text-2xl text-ink leading-snug">{rule}</span>
                </li>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </ul>
      </InvitationPanel>
    </FadeIn>
  );
}

export default function Rules() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-2xl w-full mx-auto mb-2">
            <InvitationPanel variant="hero" className="text-center">
              <p className="eyebrow">The house</p>
              <h1 className="font-invite text-display text-ink mt-2">Rules</h1>
              <div className="hairline-gold w-32 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">— a few ground rules —</p>
            </InvitationPanel>
          </FadeIn>

          <Flourish />

          <div className="max-w-2xl w-full mx-auto">
            {SECTIONS.map((section, i) => (
              <RuleCard
                key={section.title}
                section={section}
                tilt={i % 2 === 0 ? 0.3 : -0.3}
              />
            ))}
          </div>

          <FadeIn className="max-w-2xl w-full mx-auto">
            <InvitationPanel variant="card" tilt={-0.3} className="text-center py-10">
              <p className="eyebrow text-gold">And with that</p>
              <div className="hairline-gold w-16 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">
                All that said — we want you all to have a fabulous birthday weekend.
              </p>
              <p className="font-hand text-3xl text-ink mt-6 italic">G xx</p>
            </InvitationPanel>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
