import { BaseEdge, getBezierPath, type EdgeProps } from "reactflow";

const CustomEdge = (props: EdgeProps) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
  } = props;
  

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  
  const edgeColor = data?.condition === "correct" 
    ? "#10B981" // green
    : data?.condition === "incorrect" 
      ? "#EF4444" // red
      : "#94A3B8"; // grey

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: 3,
          strokeLinecap: "round", 
        }}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
    </>
  );
};

export default CustomEdge;