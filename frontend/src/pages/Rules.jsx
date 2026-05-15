import Navbar from '../components/Navbar.jsx';
import { inviteLabelClass } from '../components/InvitationCard.jsx';

export default function Rules() {
  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center p-6 sm:p-12">
        <div className="max-w-2xl w-full mx-auto bg-parchment shadow-2xl ring-1 ring-stone-300/60 px-6 py-8 sm:px-10 sm:py-10 rotate-[-0.3deg] text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
            House law
          </p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Rules</h1>
          <p className="font-hand text-2xl text-stone-600 mt-1">— the lay of the land —</p>
        </div>

        <div className="max-w-2xl w-full mx-auto">
          <article className="bg-parchment shadow-lg ring-1 ring-stone-300/60 px-6 py-10 sm:px-8 sm:py-12 rotate-[0.4deg] text-center">
            <p className={inviteLabelClass}>Coming soon</p>
            <p className="font-hand text-2xl text-stone-700 mt-3">
              TODO: contact mother about rules list.
            </p>
          </article>
        </div>
      </div>
    </div>
  );
}
