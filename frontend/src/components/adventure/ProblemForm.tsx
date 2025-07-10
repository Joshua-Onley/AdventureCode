import { SUPPORTED_LANGUAGES, type ProblemBase } from "../shared/types";



interface ProblemFormProps {
  problem: ProblemBase;
  onChange: (problem: ProblemBase) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const ProblemForm = ({ problem, onChange, onSubmit, onCancel }: ProblemFormProps) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({ ...problem, [name]: value });
  };


  return (
    <div className="problem-form">
      <h3>Create New Problem</h3>
      
      <div className="form-grid">
        <div className="form-field">
          <label>Title</label>
          <input
            type="text"
            name="title"
            placeholder="Problem title"
            value={problem.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-field">
          <label>Language</label>
          <select
            name="language"
            value={problem.language}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select language</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-field">
          <label>Description</label>
          <input
            type="text"
            name="description"
            placeholder="Problem description"
            value={problem.description}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-field">
          <label>
            Difficulty: {problem.difficulty}
          </label>
          <div className="difficulty-labels">
            <span>Easy</span>
            <span>Medium</span>
            <span>Hard</span>
          </div>
        </div>
        
        <div className="form-field full-width">
          <label>Code Snippet</label>
          <textarea
            name="code_snippet"
            placeholder="Incomplete code snippet"
            value={problem.code_snippet}
            onChange={handleChange}
            rows={3}
            required
          />
        </div>
        
        <div className="form-field full-width">
          <label>Expected Output</label>
          <input
            type="text"
            name="expected_output"
            placeholder="Expected output"
            value={problem.expected_output}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="button button-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="button button-primary"
        >
          Add to Adventure
        </button>
      </div>
    </div>
  );
};

export default ProblemForm;