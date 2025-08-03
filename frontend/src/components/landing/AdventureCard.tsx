import { useNavigate } from 'react-router-dom';
import { SuccessRate } from './SuccessRate';
import type { Adventure } from '../shared/types';

interface AdventureCardProps {
  adventure: Adventure;
  isCompleted: boolean;
  calculateSuccessRate: (attempts: number, completions: number) => number;
  formatTime: (time: number) => string;
  formatDate: (date: string) => string;
}

export const AdventureCard = ({
  adventure,
  isCompleted,
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
    <div className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col h-full">
     
      {isCompleted && (
        
        <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">
          ✓ Completed
        </span>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
            {adventure.name}
          </h4>
          <p className="text-gray-600 text-sm line-clamp-3">
            {adventure.description || "No description available"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 text-sm">
          <div className="bg-blue-50 p-2 sm:p-3 rounded min-w-0 overflow-hidden">
            <div className="text-blue-600 font-medium text-xs sm:text-sm truncate">Attempts</div>
            <div className="text-lg sm:text-xl font-bold text-blue-800 truncate" title={adventure.total_attempts.toString()}>
              {adventure.total_attempts}
            </div>
          </div>
          <div className="bg-blue-50 p-2 sm:p-3 rounded min-w-0 overflow-hidden">
            <div className="text-blue-600 font-medium text-xs sm:text-sm truncate">Completions</div>
            <div className="text-lg sm:text-xl font-bold text-blue-800 truncate" title={adventure.total_completions.toString()}>
              {adventure.total_completions}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <SuccessRate successRate={successRate} />
        </div>

        <div className="mb-4 bg-yellow-50 p-2 sm:p-3 rounded border border-yellow-200">
          <div className="flex items-center mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium text-yellow-800 truncate">Fastest Completion</span>
          </div>
          {adventure.best_completion_time ? (
            <div className="text-xs sm:text-sm">
              <div className="font-bold text-yellow-900 truncate" title={adventure.best_completion_time ? formatTime(adventure.best_completion_time) : ''}>
                {adventure.best_completion_time && (
                  formatTime(adventure.best_completion_time)
                )}
              </div>
              <div className="text-yellow-700 truncate" title={`by ${adventure.best_completion_user}`}>
                by {adventure.best_completion_user}
              </div>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-yellow-700">
              No completions yet
            </div>
          )}
        </div>

        <div className="mb-4 flex-1">
          <p className="text-xs text-gray-500">
            Created: {formatDate(adventure.created_at)}
          </p>
        </div>

        <button
          onClick={() => navigate(`/adventures/access/${adventure.access_code}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 sm:px-4 rounded transition-colors duration-200 mt-auto text-sm sm:text-base"
        >
          Start Adventure
        </button>
      </div>
    </div>
  );
};
