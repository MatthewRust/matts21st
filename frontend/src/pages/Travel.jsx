import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import CarsPanel from '../components/CarsPanel.jsx';
import PublicTransportPanel from '../components/PublicTransportPanel.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        font-invite uppercase tracking-[0.25em] text-sm px-6 py-2 transition
        border-b-2
        ${active
          ? 'text-stone-900 border-stone-800'
          : 'text-stone-400 border-transparent hover:text-stone-600 hover:border-stone-300'
        }
      `}
    >
      {label}
    </button>
  );
}

export default function Travel() {
  const [tab, setTab] = useState('cars'); // 'cars' | 'public'

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 sm:p-12">
        <div className="max-w-3xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-6">
          <p className={inviteLabelClass}>Getting to Viewmount, Braemar</p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Travel</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— ride or rail —</p>

          <div className="flex justify-center gap-2 mt-6 border-b border-stone-200">
            <Tab label="Cars" active={tab === 'cars'} onClick={() => setTab('cars')} />
            <Tab label="Public Transport" active={tab === 'public'} onClick={() => setTab('public')} />
          </div>
        </div>

        {tab === 'cars' ? <CarsPanel /> : <PublicTransportPanel />}
      </div>
    </div>
  );
}
