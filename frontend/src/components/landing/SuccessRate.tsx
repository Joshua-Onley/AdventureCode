interface successRateProps {
    successRate?: number | null;

}

export const SuccessRate = ({ successRate }: successRateProps) => (
  <>
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm text-gray-600">Success Rate</span>
      <span className="text-sm font-medium text-gray-800">
        {successRate}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-green-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${successRate}%` }}
      ></div>
    </div>
  </>
);