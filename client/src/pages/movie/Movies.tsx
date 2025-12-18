import { Outlet, useParams } from 'react-router-dom';

export default function Movies() {
  const { id } = useParams();

  // If there's an ID in the URL, show MovieDetails via Outlet
  // Otherwise, show the movies list page
  if (id) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Movies</h1>
        
        {/* TODO: Add movie list/grid with infinite scroll here */}
        <div className="text-text-secondary">
          <p>Movie list with infinite scroll will be implemented here.</p>
          <p className="mt-2">This page will show all available movies that users can browse and click to see details.</p>
        </div>
      </div>
    </div>
  );
}
