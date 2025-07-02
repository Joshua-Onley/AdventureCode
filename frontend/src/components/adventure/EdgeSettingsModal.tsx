import type { Edge } from "reactflow";


interface EdgeSettingsModalProps {
  edge: Edge | null;
  onClose: () => void;
  onDelete: () => void;
  onChangeCondition: (condition: string) => void;
}

const EdgeSettingsModal = ({ 
  edge, 
  onClose, 
  onDelete,
  onChangeCondition
}: EdgeSettingsModalProps) => {
  if (!edge) return null;

  return (
    <div className="edge-modal">
      <h3>Edge Settings</h3>
      
      <div className="edge-field">
        <label>Transition Condition</label>
        <select
          value={edge.data?.condition || "default"}
          onChange={(e) => onChangeCondition(e.target.value)}
        >
          <option value="correct">Correct → Harder</option>
          <option value="incorrect">Incorrect → Easier</option>
          <option value="default">Default Path</option>
        </select>
      </div>
      
      <div className="edge-actions">
        <button
          onClick={onDelete}
          className="button button-danger"
        >
          Delete Edge
        </button>
        <button
          onClick={onClose}
          className="button button-secondary"
        >
          Close
        </button>
      </div>
      
      <p className="edge-note">
        Press <kbd>Delete</kbd> to remove
      </p>
    </div>
  );
};

export default EdgeSettingsModal;