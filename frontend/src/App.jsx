import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import EditCar from './pages/EditCar.jsx';
// Drinks tally + leaderboard are shelved for now — see the routes below.
// import DrinkIncrementer from './pages/drinkincrementer.jsx';
// import Leaderboard from './pages/leaderboard.jsx';
import Travel from './pages/Travel.jsx';
import Announcements from './pages/Announcements.jsx';
import Schedule from './pages/Schedule.jsx';
import PackingList from './pages/PackingList.jsx';
import Rules from './pages/Rules.jsx';
import Gallery from './pages/Gallery.jsx';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        {/* Shelved — restore these two lines (and the imports above) to bring
            the drinks tally and leaderboard back, then drop the redirects. */}
        {/* <Route path="/drinks" element={<ProtectedRoute><DrinkIncrementer /></ProtectedRoute>} /> */}
        {/* <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} /> */}
        <Route path="/drinks" element={<Navigate to="/" replace />} />
        <Route path="/leaderboard" element={<Navigate to="/" replace />} />
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/edit-car" element={<ProtectedRoute><EditCar /></ProtectedRoute>} />
        <Route path="/travel" element={<ProtectedRoute><Travel /></ProtectedRoute>} />
        <Route path="/cars" element={<Navigate to="/travel" replace />} />
        <Route path="/public-transport" element={<Navigate to="/travel" replace />} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/packing" element={<ProtectedRoute><PackingList /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
        <Route path="/photos" element={<Navigate to="/gallery" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
