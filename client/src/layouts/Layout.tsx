import { Outlet, Link } from "react-router-dom";

function Layout() {
  return (
    <div className="app-layout">
      <header style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/library">Library</Link>
          <Link to="/profile/1">Profile</Link>
        </nav>
      </header>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
      <footer style={{ padding: "12px", borderTop: "1px solid #eee" }}>
        <small>Hypertube © {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

export default Layout;
