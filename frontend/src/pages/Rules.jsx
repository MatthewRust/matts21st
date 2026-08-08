import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import { Flourish } from '../components/Flourish.jsx';
import { PageTransition, FadeIn } from '../components/MotionPrimitives.jsx';

export default function Rules() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-2xl w-full mx-auto">
            <InvitationPanel variant="hero" className="text-center">
              <p className="eyebrow">The house</p>
              <h1 className="font-invite text-display text-ink mt-2">Rules</h1>
              <div className="hairline-gold w-32 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">— a few ground rules —</p>
            </InvitationPanel>
          </FadeIn>

          <Flourish />

          <FadeIn className="max-w-2xl w-full mx-auto">
            <InvitationPanel variant="card" tilt={0.3} className="text-center py-12">
              <p className="eyebrow text-gold">Coming soon</p>
              <p className="font-hand text-2xl text-ink-soft mt-4">
                Still being agreed with Mum.
              </p>
              <p className="font-hand text-xl text-ink-faint mt-2 italic">
                Check back soon.
              </p>
            </InvitationPanel>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
