
import { AdventureCard } from './AdventureCard';
import { EmptyState } from './EmptyState';

import type { Adventure } from '../shared/types';

interface MainContentProps {
    loading: boolean;
    publicAdventures: Adventure[];
    calculateSuccessRate: (attempts: number, completions: number) => number;
    formatTime: (time: number) => string;
    formatDate: (date: string) => string;


}

export const MainContent = ({ 
  loading, 
  publicAdventures, 
  calculateSuccessRate, 
  formatTime, 
  formatDate 
}: MainContentProps) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Discover Public Adventures
        </h2>
        <p className="text-gray-600">
          Explore coding challenges and learning paths created by the community
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading adventures...</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">
              Public Adventures ({publicAdventures.length})
            </h3>
            <div className="text-sm text-gray-500">
              {publicAdventures.length} adventure{publicAdventures.length !== 1 ? 's' : ''} available
            </div>
          </div>

          {publicAdventures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicAdventures.map((adventure) => (
                <AdventureCard 
                  key={adventure.id}
                  adventure={adventure}
                  calculateSuccessRate={calculateSuccessRate}
                  formatTime={formatTime}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </div>
  );
};