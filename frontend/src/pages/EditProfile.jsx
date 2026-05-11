import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';
import InvitationCard, {
  inviteInputClass,
  inviteLabelClass,
  inviteButtonClass,
} from '../components/InvitationCard.jsx';

import { resolveAvatar } from '../utils/resolveAvatar.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function AvatarPreview({ src, file }) {
  const [imgErr, setImgErr] = useState(false);
  // While a new file is chosen show a local object URL; otherwise resolve the stored path
  const previewSrc = file ? URL.createObjectURL(file) : resolveAvatar(src);

  return (
    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-stone-400/40 shadow-lg mx-auto mb-4">
      {!imgErr && previewSrc ? (
        <img
          src={previewSrc}
          alt="Profile preview"
          className="w-full h-full object-cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="40" cy="40" r="40" fill="#e7dfd0" />
          <circle cx="40" cy="30" r="14" fill="#a89070" />
          <ellipse cx="40" cy="68" rx="22" ry="16" fill="#a89070" />
        </svg>
      )}
    </div>
  );
}

// Format a TIMESTAMPTZ from the DB into the value a datetime-local input expects
function toDatetimeLocal(iso) {
  if (!iso) return '';
  // "2025-07-20T18:30:00.000Z" → "2025-07-20T18:30"
  return iso.slice(0, 16);
}

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [username,       setUsername]       = useState(user?.username       ?? '');
  const [password,       setPassword]       = useState('');
  const [expArrival,     setExpArrival]     = useState(toDatetimeLocal(user?.exp_arrival_date));
  const [publicTransport,setPublicTransport]= useState(user?.public_transport ?? false);
  const [driver,         setDriver]         = useState(user?.driver          ?? false);
  const [avatarFile,     setAvatarFile]     = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Use FormData so we can include an optional file
      const fd = new FormData();
      fd.append('username',        username);
      if (password)  fd.append('password', password);
      fd.append('exp_arrival_date', expArrival);
      fd.append('public_transport', String(publicTransport));
      fd.append('driver',           String(driver));
      if (avatarFile) fd.append('profile_pic', avatarFile);

      const res = await fetch(`${API_URL}/api/users/${user.user_id}`, {
        method: 'PATCH',
        body: fd,
        // Do NOT set Content-Type — the browser sets it with the correct boundary
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || 'Could not save changes');
      }

      const updated = await res.json();
      updateUser(updated);
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-tartan flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <InvitationCard tilt="rotate-[1.5deg]" maxWidth="max-w-xl">

          <div className="text-center mb-8">
            <p className="font-invite tracking-[0.4em] uppercase text-stone-500 text-xs">
              Amend your details
            </p>
            <h1 className="font-invite text-5xl sm:text-6xl text-stone-900 mt-1">Edit Profile</h1>
            <p className="font-hand text-2xl text-stone-600 mt-1">— revise as you see fit —</p>
          </div>

          {/* Avatar preview + upload */}
          <div className="text-center mb-6">
            <AvatarPreview src={user?.profile_pic_url} file={avatarFile} />
            <label className={`${inviteLabelClass} cursor-pointer inline-block`}>
              Change portrait
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAvatarFile(e.target.files[0] || null)}
              />
            </label>
            {avatarFile && (
              <p className="font-hand text-lg text-stone-500 mt-1">{avatarFile.name}</p>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-7">
            <div>
              <label className={inviteLabelClass}>Name</label>
              <input
                className={inviteInputClass}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className={inviteLabelClass}>New password (leave blank to keep current)</label>
              <input
                className={inviteInputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={inviteLabelClass}>Expected arrival time</label>
              <input
                className={inviteInputClass}
                type="datetime-local"
                value={expArrival}
                onChange={(e) => setExpArrival(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-3 font-invite tracking-widest uppercase text-sm text-stone-700">
              <input
                type="checkbox"
                checked={publicTransport}
                onChange={(e) => {
                  setPublicTransport(e.target.checked);
                  if (e.target.checked) setDriver(false);
                }}
                className="h-5 w-5 accent-red-900"
              />
              Travelling by public transport
            </label>

            <label className="flex items-center gap-3 font-invite tracking-widest uppercase text-sm text-stone-700">
              <input
                type="checkbox"
                checked={driver}
                onChange={(e) => {
                  setDriver(e.target.checked);
                  if (e.target.checked) setPublicTransport(false);
                }}
                className="h-5 w-5 accent-red-900"
              />
              I am offering a lift (driver)
            </label>

            {error && <p className="font-hand text-xl text-red-800">{error}</p>}

            <div className="flex flex-col items-center gap-4 pt-2">
              <button type="submit" disabled={submitting} className={inviteButtonClass}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="font-hand text-xl text-stone-700 underline decoration-dotted underline-offset-4"
              >
                Cancel
              </button>
            </div>
          </form>
        </InvitationCard>
      </div>
    </div>
  );
}
