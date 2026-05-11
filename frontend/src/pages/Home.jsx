import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [info, setInfo] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/info`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo([]));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-3 bg-black/30 text-sm">
        <span className="font-invite tracking-wider">Logged in as {user?.username}</span>
        <button
          onClick={() => navigate('/profile')}
          title="Your profile"
          aria-label="Go to your profile"
          className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          {/* User silhouette icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <header className="px-6 py-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight">Matt's 21st</h1>
        <p className="mt-3 text-lg text-purple-200">Info, travel, and photos all in one place.</p>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 pb-16 md:grid-cols-3">
        <Card title="Event info" href="#info">
          The when, where, and what to wear.
        </Card>
        <Card title="Travel" href="#travel">
          Arrange lifts and share rides.
        </Card>
        <Card title="Pictures" href="#pictures">
          Upload and browse photos from the night.
        </Card>

        <section id="info" className="md:col-span-3 rounded-2xl bg-white/5 p-6 backdrop-blur">
          <h2 className="text-2xl font-semibold">Event info</h2>
          <ul className="mt-4 space-y-3">
            {info.length === 0 && <li className="text-purple-200">Loading…</li>}
            {info.map((item) => (
              <li key={item.id} className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold">{item.title}</div>
                <div className="text-purple-100">{item.body}</div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Card({ title, href, children }) {
  return (
    <a
      href={href}
      className="rounded-2xl bg-white/5 p-6 backdrop-blur transition hover:bg-white/10"
    >
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-purple-200">{children}</p>
    </a>
  );
}
