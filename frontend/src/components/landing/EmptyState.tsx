import { useNavigate } from 'react-router-dom';

export const EmptyState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        No public adventures available yet
      </h3>
      <p className="text-gray-600 mb-4">
        Be the first to create and share a learning adventure!
      </p>
      <button
        onClick={() => navigate('/create-adventure')}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create Your First Adventure
      </button>
    </div>
  );
};