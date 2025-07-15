export interface ProblemBase {
    title: string;
    description: string;
    language: string;
    code_snippet: string;
    expected_output: string;
  }
  
  export interface ValidationErrorItem {
    msg: string;
    [key: string]: unknown;
  }
  
  export interface ValidationErrorResponse {
    detail: ValidationErrorItem[];
  }

  export interface AdventureCreate {
    name: string;              
    description?: string;
    problems: ProblemBase[];   
    graph_data: GraphData;
    is_public?: boolean;
    request_public?: boolean;
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
  
  export interface NodeData {
    id: string;
    position: {
      x: number;
      y: number;
    };
    data: ProblemBase;
    type?: string;
  }
  
  export interface EdgeData {
    id: string;
    source: string;
    target: string;
    data: { condition: string };
    type?: string
  }
  
  export interface GraphData {
    nodes: NodeData[];
    edges: EdgeData[];
  }
  
  export interface ProblemData {
    id: string;
    title: string;
    description: string;
    code_snippet: string;
    expected_output: string;
    language: string;
  }

  export interface GraphNode {
    id: string;
    position: { x: number; y: number };
    data: ProblemData;
    type?: string;
  }

  export interface GraphEdge {
    id: string;
    source: string;
    target: string;
    data: { condition: string };
    type?: string;
  }

  export interface AdventureAttempt {
    id: number;
    current_node_id: string;
    path_taken: Array<{ node_id: string; outcome: string; code?: string }>;
    completed: boolean;
  }

  export interface Adventure {
    id: number;
    name: string;
    description: string;
    creator_id: number;
    created_at: string;
    is_public: boolean;
    approval_status: string;
    total_attempts: number;
    total_completions: number;
    access_code: string | null;
    start_node_id: string;
    end_node_id: string;
    fastest_completion_time: number | null; 
    fastest_completion_user: string | null; 
  }
  
  export interface PublicAdventuresResponse {
    adventures: Adventure[];
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