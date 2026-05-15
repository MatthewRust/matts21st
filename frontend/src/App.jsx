import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import EditCar from './pages/EditCar.jsx';
import DrinkIncrementer from './pages/drinkincrementer.jsx';
import Leaderboard from './pages/leaderboard.jsx';
import Cars from './pages/Cars.jsx';
import PublicTransport from './pages/PublicTransport.jsx';
import Announcements from './pages/Announcements.jsx';
import Schedule from './pages/Schedule.jsx';
import PackingList from './pages/PackingList.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drinks"
            element={
              <ProtectedRoute>
                <DrinkIncrementer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-car"
            element={
              <ProtectedRoute>
                <EditCar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cars"
            element={
              <ProtectedRoute>
                <Cars />
              </ProtectedRoute>
            }
          />
          <Route
            path="/public-transport"
            element={
              <ProtectedRoute>
                <PublicTransport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/packing"
            element={
              <ProtectedRoute>
                <PackingList />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
