import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { setNavigate } from './utils/navigation';
import { AuthProvider } from './components/auth/AuthProvider';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Browse from './pages/browse/Browse';
import Library from './pages/library/Library';
import Watchlist from './pages/watchlist/Watchlist';
import History from './pages/history/History';
import Downloads from './pages/downloads/Downloads';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import MovieDetails from './pages/movie/MovieDetails';
import UserProfile from './pages/user/UserProfile';
import EditProfile from './pages/user/EditProfile';
import NotFound from './pages/notFound/NotFound';

function NavigationSetup() {
  const navigate = useNavigate();
  
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavigationSetup />
        <Routes>
          {/* Auth routes without layout */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />

          {/* Main app routes with layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/browse" replace />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/library" element={<Library />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/history" element={<History />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/user/:id" element={<UserProfile />} />
            <Route path="/user/edit" element={<EditProfile />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
