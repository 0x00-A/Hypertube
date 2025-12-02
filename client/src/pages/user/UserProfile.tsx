import { useParams } from 'react-router-dom';

export default function UserProfile() {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900">Welcome to User Profile Page</h1>
      <p className="mt-4 text-gray-600">User ID: {id}</p>
    </div>
  );
}
