import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import InvitationCard, {
  inviteInputClass,
  inviteLabelClass,
  inviteButtonClass,
} from '../components/InvitationCard.jsx';

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
    <div className="min-h-screen bg-tartan p-6 sm:p-12 flex items-center">
      <InvitationCard tilt="-rotate-2" maxWidth="max-w-xl">
        <div className="text-center mb-8">
          <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">You are cordially welcomed</p>
          <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-2">Please, do come in</h1>
          <p className="font-hand text-2xl text-stone-700 mt-2">— a small matter of identity —</p>
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
            <label className={inviteLabelClass}>The secret word</label>
            <input
              className={inviteInputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="font-hand text-xl text-red-800">{error}</p>
          )}

          <div className="flex flex-col items-center gap-4 pt-2">
            <button type="submit" disabled={submitting} className={inviteButtonClass}>
              {submitting ? 'Entering…' : 'Enter'}
            </button>
            <Link to="/signup" className="font-hand text-xl text-stone-700 underline decoration-dotted underline-offset-4">
              No invitation yet? Sign up.
            </Link>
          </div>
        </form>
      </InvitationCard>
    </div>
  );
}
