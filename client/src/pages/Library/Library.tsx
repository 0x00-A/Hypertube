import { Link } from "react-router-dom";

function Library() {
  // placeholder grid
  const movies = [
    { id: "1", title: "Sample Movie 1" },
    { id: "2", title: "Sample Movie 2" },
    { id: "3", title: "Sample Movie 3" },
  ];

  return (
    <div>
      <h2>Library</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {movies.map((m) => (
          <Link
            key={m.id}
            to={`/movie/${m.id}`}
            style={{ border: "1px solid #ddd", padding: 12 }}
          >
            {m.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Library;
