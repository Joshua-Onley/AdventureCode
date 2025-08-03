import { useNavigate } from "react-router-dom";

type AttemptAdventureHeaderProps = {
    adventureName: string
    adventureDescription: string | undefined
    isGuest: boolean

}

const AttemptAdventureHeader = ({adventureName, isGuest, adventureDescription}: AttemptAdventureHeaderProps) => {
    const navigate = useNavigate()
  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {adventureName}
            {isGuest && <span className="text-yellow-300 text-sm ml-2">(Guest Mode)</span>}
          </h1>
          {adventureDescription && (
            <p className="text-gray-300 mt-1">{adventureDescription}</p>
          )}
          {isGuest && (
            <p className="text-yellow-300 text-sm mt-1">
              Progress will not be saved. Create an account to save your progress.
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
  )
}

export default AttemptAdventureHeader
