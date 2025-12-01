import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layouts/Layout";
import Login from "./pages/Auth/Login";
import Library from "./pages/Library/Library";
import MoviePlayer from "./pages/Movie/MoviePlayer";

function App() {
  const isAuthenticated = false;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Protected Routes */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/library" />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/library" element={<Library />} />
          <Route path="/movie/:id" element={<MoviePlayer />} />
          <Route path="/profile/:id" element={<div>Profile</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
