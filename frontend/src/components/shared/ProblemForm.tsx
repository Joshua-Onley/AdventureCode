import React from "react";
import type { ProblemBase } from "./types";

interface ProblemFormProps {
  problem: ProblemBase;
  onChange: (problem: ProblemBase) => void;
  onSubmit: () => void;
  onCancel: () => void;
  title?: string;
  submitText?: string;
  showPublicOption?: boolean;
  isPublic?: boolean;
  onPublicChange?: (isPublic: boolean) => void;
  readOnlyFields?: (keyof ProblemBase)[];
}

const ProblemForm: React.FC<ProblemFormProps> = ({
  problem,
  onChange,
  onSubmit,
  onCancel,
  title = "Create Problem",
  submitText = "Create Problem",
  showPublicOption = false,
  isPublic = true,
  onPublicChange = () => {}
}) => {
  const handleChange = (field: keyof ProblemBase, value: string | number) => {
    onChange({ ...problem, [field]: value });
  };

  return (
    <div className="problem-form">
      <h2 className="form-title">{title}</h2>
      
      <div className="form-group">
        <label>Title*</label>
        <input
          type="text"
          value={problem.title}
          onChange={(e) => handleChange("title", e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={problem.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Language*</label>
        <select
          value={problem.language}
          onChange={(e) => handleChange("language", e.target.value)}
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="ruby">Ruby</option>
          <option value="go">Go</option>
          <option value="php">PHP</option>
          <option value="swift">Swift</option>
          <option value="rust">Rust</option>
          <option value="bash">Bash</option>
          <option value="kotlin">Kotlin</option>
        </select>
      </div>

      <div className="form-group">
        <label>Code Snippet*</label>
        <textarea
          value={problem.code_snippet}
          onChange={(e) => handleChange("code_snippet", e.target.value)}
          rows={5}
          className="code-editor"
          required
        />
      </div>

      <div className="form-group">
        <label>Expected Output*</label>
        <textarea
          value={problem.expected_output}
          onChange={(e) => handleChange("expected_output", e.target.value)}
          rows={2}
          required
        />
      </div>


      {showPublicOption && (
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onPublicChange(e.target.checked)}
            />
            Request to make this problem public
          </label>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit" onClick={onSubmit}>
          {submitText}
        </button>
      </div>
    </div>
  );
};

export default ProblemForm;