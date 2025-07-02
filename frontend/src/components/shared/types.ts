export interface ProblemBase {
    title: string;
    description: string;
    language: string;
    code_snippet: string;
    expected_output: string;
    difficulty: number;
  }

  
  export interface ValidationErrorItem {
    msg: string;
    [key: string]: unknown;
  }
  
  export interface ValidationErrorResponse {
    detail: ValidationErrorItem[];
  }
  
  export const isValidationErrorResponse = (
    data: unknown
  ): data is ValidationErrorResponse => {
    return (
      data !== null &&
      typeof data === "object" &&
      "detail" in data &&
      Array.isArray((data as { detail: unknown }).detail)
    );
  };

  export interface Adventure {
    id: number;
    title: string;
    description: string;
    creator_id: number;
    problems: Problem[];
    graph_data: GraphData;
  }
  
  export interface Problem {
    id: string;
    title: string;
    description: string;
    language: string;
    code_snippet: string;
    expected_output: string;
    difficulty: number;
  }
  
  export interface NodePosition {
    id: string;
    position: {
      x: number;
      y: number;
    };
  }
  
  export interface EdgeDef {
    source: string;
    target: string;
    condition: string;
  }
  
  export interface GraphData {
    nodes: NodePosition[];
    edges: EdgeDef[];
  }
  

  export interface FlowNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Problem;
    sourcePosition: string;
    targetPosition: string;
  }
  
 
  export interface FlowEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    data: { condition: string };
    animated: boolean;
  }
  
  export const SUPPORTED_LANGUAGES = [
    { value: "python", label: "Python 3.10" },
    { value: "javascript", label: "JavaScript (Node.js 18.15)" },
    { value: "typescript", label: "TypeScript" },
    { value: "java", label: "Java 15" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
    { value: "ruby", label: "Ruby" },
    { value: "go", label: "Go" },
    { value: "php", label: "PHP" },
    { value: "swift", label: "Swift" },
    { value: "rust", label: "Rust" },
    { value: "bash", label: "Bash" },
    { value: "kotlin", label: "Kotlin" },
  ];