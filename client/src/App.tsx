import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import { setNavigate } from './utils/navigation';
import { AuthProvider } from './components/auth/AuthProvider';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Browse from './pages/browse/Browse';
import Library from './pages/library/Library';
import History from './pages/history/History';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import Movies from './pages/movie/Movies';
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
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1C1C1C',
              color: '#FFFFFF',
              border: '1px solid #333333',
            },
            success: {
              iconTheme: {
                primary: '#46D369',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#F44336',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <Routes>
          {/* Auth routes without layout */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Main app routes with layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/browse" replace />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/library" element={<Library />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/movies" element={<Movies />}>
              <Route path=":id" element={<MovieDetails />} />
            </Route>
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
