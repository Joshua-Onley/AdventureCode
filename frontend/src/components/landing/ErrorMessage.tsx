
interface ErrorDisplayProps {
    error?: string | null;
  }
  
  export function ErrorMessage({ error }: ErrorDisplayProps) {
    if (!error) return null;
    return (
      <div className="bg-red-100 …">
        <strong>Error:</strong>
        <div className="mt-2">{error}</div>
      </div>
    );
  }
  