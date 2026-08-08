import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, {
  inviteInputClass, inviteLabelClass, inviteButtonClass,
} from '../components/InvitationCard.jsx';
import { WaxSeal } from '../components/Flourish.jsx';
import { PageTransition, FadeIn } from '../components/MotionPrimitives.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-tartan px-5 sm:px-10 py-12 flex items-center justify-center">
        <FadeIn className="relative w-full flex justify-center">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10">
            <WaxSeal size={72} />
          </div>
          <InvitationCard tilt="rotate-[-1.2deg]" maxWidth="max-w-xl">
            <div className="text-center mb-10 mt-3">
              <p className="eyebrow">Welcome back</p>
              <h1 className="font-invite text-display text-ink mt-3">Sign in</h1>
              <div className="hairline-gold w-24 mx-auto my-4" />
              <p className="font-hand text-2xl text-ink-soft">— your name and password —</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-8">
              <div>
                <label className={inviteLabelClass}>Your name</label>
                <input
                  className={inviteInputClass}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className={inviteLabelClass}>Password</label>
                <input
                  className={inviteInputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="font-hand text-xl text-seal">{error}</p>
              )}

              <div className="flex flex-col items-center gap-4 pt-2">
                <button type="submit" disabled={submitting} className={inviteButtonClass}>
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
                <Link
                  to="/signup"
                  className="font-hand text-xl text-ink-soft underline decoration-dotted underline-offset-4 decoration-gold hover:text-ink"
                >
                  Not signed up yet? Sign up.
                </Link>
              </div>
            </form>
          </InvitationCard>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
