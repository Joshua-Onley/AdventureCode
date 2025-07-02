import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <h1 >Welcome to the landing page</h1>

      <button onClick={() => navigate("/signup")}>Signup</button>
      <button onClick={() => navigate("/login")}>Login</button>
      <button onClick={() => navigate("/about")}>About</button>
      <button onClick={() => navigate("/me")}>Me</button>
      <button onClick={() => navigate("/problems")}>Create Problem</button>
      <button onClick={() => navigate("/attempt")}>Attempt Problem</button>
      <button onClick={() => navigate("/create-adventure")}>Create an Adventure</button>
      <button onClick={() => navigate("/my-adventures")}>My Adventures</button>
    </div>
  );
};

export default Landing;
