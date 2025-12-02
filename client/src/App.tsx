import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from './layouts/MainLayout';
import { setNavigate } from './utils/navigation';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Browse from './pages/browse/Browse';
import Library from './pages/library/Library';
import MovieDetails from './pages/movie/MovieDetails';
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
      <NavigationSetup />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/browse" replace />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/library" element={<Library />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
