

const EdgeLegend = () => {
  return (
    
      <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Legend:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-1 bg-green-500 mr-2"></div>
                      <span><strong>Green:</strong> Correct path</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-1 bg-red-500 mr-2"></div>
                      <span><strong>Red:</strong> Incorrect path</span>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span><strong>Blue Node:</strong> Current problem</span>
                    </div>
                  </div>
    </div>
  )
}

export default EdgeLegend
