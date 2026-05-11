import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Home() {
  const { user, logout } = useAuth();
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
          onClick={logout}
          className="font-invite uppercase tracking-widest text-xs px-3 py-1 border border-white/40 rounded hover:bg-white/10"
        >
          Log out
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
