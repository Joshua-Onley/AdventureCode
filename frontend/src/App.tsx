import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Me from "./pages/Me";
import CreateProblem from "./pages/CreateProblem";
import AttemptProblem from "./pages/AttemptProblem";



const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/me" element={<Me />} />
        <Route path="/problems" element={<CreateProblem />} />
        <Route path="/attempt" element={<AttemptProblem />} />
      </Routes>
    </Router>
  );
};

export default App;
