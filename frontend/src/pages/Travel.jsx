import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import InvitationPanel from '../components/InvitationPanel.jsx';
import CarsPanel from '../components/CarsPanel.jsx';
import PublicTransportPanel from '../components/PublicTransportPanel.jsx';
import { PageTransition, FadeIn, motion, AnimatePresence } from '../components/MotionPrimitives.jsx';

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative font-invite uppercase tracking-[0.25em] text-sm px-5 sm:px-6 py-2 transition-colors ${
        active ? 'text-ink' : 'text-ink-faint hover:text-ink-soft'
      }`}
    >
      {label}
      {active && (
        <motion.span
          layoutId="travel-tab"
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gold"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function Travel() {
  const [tab, setTab] = useState('cars');

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan">
        <Navbar />

        <div className="flex flex-col items-center px-5 sm:px-10 pt-8 pb-16">
          <FadeIn className="max-w-3xl w-full mx-auto mb-8">
            <InvitationPanel variant="hero" className="text-center">
              <p className="eyebrow">Getting to Viewmount, Braemar</p>
              <h1 className="font-invite text-display text-ink mt-2">Travel</h1>
              <div className="hairline-gold w-32 mx-auto my-5" />
              <p className="font-hand text-2xl text-ink-soft">— by car or by train —</p>

              <div className="flex justify-center gap-2 mt-8 border-b border-rule/60">
                <Tab label="Cars" active={tab === 'cars'} onClick={() => setTab('cars')} />
                <Tab label="Public Transport" active={tab === 'public'} onClick={() => setTab('public')} />
              </div>
            </InvitationPanel>
          </FadeIn>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              {tab === 'cars' ? <CarsPanel /> : <PublicTransportPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
