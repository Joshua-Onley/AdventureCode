import { useNavigate } from 'react-router-dom';
import { SuccessRate } from './SuccessRate';
import type { Adventure } from '../shared/types';


interface AdventureCardProps {
    adventure: Adventure;
    calculateSuccessRate: (attempts: number, completions: number) => number;
    formatTime: (time: number) => string;
    formatDate: (date: string) => string;


}

export const AdventureCard = ({ 
  adventure, 
  calculateSuccessRate, 
  formatTime, 
  formatDate 
}: AdventureCardProps) => {
  const navigate = useNavigate();
  const successRate = calculateSuccessRate(
    adventure.total_attempts, 
    adventure.total_completions
  );

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            {adventure.name}
          </h4>
          <p className="text-gray-600 text-sm line-clamp-3">
            {adventure.description || "No description available"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-blue-600 font-medium">Attempts</div>
            <div className="text-xl font-bold text-blue-800">
              {adventure.total_attempts}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-blue-600 font-medium">Completions</div>
            <div className="text-xl font-bold text-blue-800">
              {adventure.total_completions}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <SuccessRate successRate={successRate} />
        </div>
        
        <div className="mb-4 bg-yellow-50 p-3 rounded border border-yellow-200">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-yellow-800">Fastest Completion</span>
          </div>
          {adventure.fastest_completion_time && adventure.fastest_completion_user ? (
            <div className="text-sm">
              <div className="font-bold text-yellow-900">
                {formatTime(adventure.fastest_completion_time)}
              </div>
              <div className="text-yellow-700">
                by {adventure.fastest_completion_user}
              </div>
            </div>
          ) : (
            <div className="text-sm text-yellow-700">
              No completions yet
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500">
            Created: {formatDate(adventure.created_at)}
          </p>
        </div>

        <button
          onClick={() => navigate(`/adventures/access/${adventure.access_code}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
          Start Adventure
        </button>
      </div>
    </div>
  );
};