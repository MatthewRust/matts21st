import InvitationPanel from './InvitationPanel.jsx';
import { FadeIn, StaggerGroup, StaggerItem } from './MotionPrimitives.jsx';
import { inviteButtonClass } from './InvitationCard.jsx';

const MAPS_URL =
  'https://www.google.com/maps/dir/55.8762749,-4.2920562/Viewmount+House/@56.4171493,-4.4728898,9z/data=!3m1!4b1!4m8!4m7!1m1!4e1!1m4!2m2!1d-3.4082!2d57.0046005!4e1?entry=ttu&g_ep=EgoyMDI2MDgwNS4xIKXMDSoASAFQAw%3D%3D';

/**
 * The last mile, from the village to the drive. Written as steps because the
 * turnings are easy to miss and people will be reading this on a phone.
 */
const STEPS = [
  'Drive through the village until you reach Braemar Brewery.',
  'Take the road on its left up the hill — this is Chapel Brae.',
  'About a third of the way up there is a large modern house (Bellevue) on your right, and Mar Cottage on your left.',
  'Immediately after Mar Cottage is a small road on your left, which goes to the old Moorfield. Take this.',
  'Then immediately on your right is our drive. There is a granite stone with Viewmount House engraved at the entrance.',
];

export default function DirectionsPanel() {
  return (
    <FadeIn className="mx-auto max-w-3xl w-full">
      <InvitationPanel variant="card" className="px-5 py-6 sm:px-8 sm:py-8 overflow-hidden">
        <p className="eyebrow text-gold">The last mile</p>
        <h2 className="font-invite text-2xl sm:text-3xl text-ink mt-2">
          Finding the house
        </h2>
        <div className="hairline-gold w-24 my-5" />

        <StaggerGroup className="space-y-5">
          {STEPS.map((step, i) => (
            <StaggerItem key={step}>
              <div className="flex gap-4">
                <span className="font-invite text-xl text-gold num shrink-0 leading-snug w-6 text-right">
                  {i + 1}.
                </span>
                <p className="font-hand text-lg sm:text-xl text-ink-soft leading-snug break-words">
                  {step}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <div className="hairline-gold w-24 my-6" />

        <div className="flex flex-col items-center gap-3">
          <p className="font-hand text-lg text-ink-faint text-center">
            Or let the map do the work —
          </p>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${inviteButtonClass} text-xs px-5 py-2`}
          >
            Open in Google Maps
          </a>
        </div>
      </InvitationPanel>
    </FadeIn>
  );
}
