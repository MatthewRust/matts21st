import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

const STORAGE_KEY = 'matts21st.user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  async function login(username, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || 'Login failed');
    }
    const data = await res.json();
    setUser(data);
    return data;
  }

  async function signup({ username, password, driver, car }) {
    // 1. Create the user
    const userRes = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, driver }),
    });
    if (!userRes.ok) {
      const { error } = await userRes.json().catch(() => ({}));
      throw new Error(error || 'Could not create user');
    }
    let createdUser = await userRes.json();

    // 2. If driver, create the car and link it
    if (driver && car) {
      const carRes = await fetch(`${API_URL}/api/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: createdUser.user_id,
          max_num_passenger: Number(car.max_num_passenger),
          description: car.description || null,
          departure_time: car.departure_time || null,
          departure_location: car.departure_location || null,
        }),
      });
      if (!carRes.ok) {
        const { error } = await carRes.json().catch(() => ({}));
        throw new Error(error || 'Could not create car');
      }
      const createdCar = await carRes.json();
      createdUser = { ...createdUser, car_id: createdCar.car_id };
    }

    setUser(createdUser);
    return createdUser;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
