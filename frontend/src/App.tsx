import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Me from "./pages/Me";
import CreateProblem from "./pages/CreateProblem";
import AttemptProblem from "./pages/AttemptProblem";
import CreateAdventure from "./pages/CreateAdventure";
import FetchUserAdventures from "./pages/MyAdventures";
import AdventureDetail from "./components/adventure/AdventureDetail"
import AttemptAdventure from "./pages/AttemptAdventure";
import EditAdventure from "./pages/EditAdventure";
import MyProblems from "./pages/MyProblems";
import Instructions from "./pages/Instructions";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/me" element={<Me />} />
        <Route path="/problems/access/:code" element={<AttemptProblem />} />
        <Route path="/problems" element={<CreateProblem />} />
        <Route path="/my-problems" element={<MyProblems />}/>
        <Route path="/attempt" element={<AttemptProblem />} />
        <Route path="/create-adventure" element={<CreateAdventure />} />
        <Route path="/my-adventures" element={<FetchUserAdventures />}/>
        <Route path="/adventures/edit/:id" element={<EditAdventure />} />
        <Route path="/adventures/:id" element={<AdventureDetail />} />
        <Route path="/adventures/access/:code" element={<AttemptAdventure />} />

        
 
      </Routes>
    </Router>
  );
};

export default App;
