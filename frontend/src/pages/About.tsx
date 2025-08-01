import { useNavigate } from "react-router-dom";

export default function About() {

  const navigate = useNavigate();

  return (
    <div className="container min-h-screen min-w-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Instructions</h1>
        <div className="flex space-x-2">
            
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
     
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto border border-gray-200 space-y-8">


        
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900">AdventureCode: Turn coding into an interactive adventure!</h1>
          <p className="text-xl text-gray-700">Empowering teachers to craft tailored coding challenges and learning pathways for students.</p>
          <div className="mt-6">
            <img
              src="/images/graph.png"
              alt="Screenshot of AdventureCode graph canvas"
              className="mx-auto rounded-lg shadow-lg border border-gray-200"
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-4">Key Features</h2>
          <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Interactive Graph Designer</h3>
              <p className="text-gray-700">Drag-and-drop nodes, define problem flows, and create branching paths based on correct or incorrect answers.</p>
              <h3 className="text-xl font-semibold text-gray-800">Adaptive Difficulty</h3>
              <p className="text-gray-700">Students who struggle receive scaffolded hints; those who ace it get harder, more challenging puzzles.</p>
              <h3 className="text-xl font-semibold text-gray-800">6-Digit Sharing Code</h3>
              <p className="text-gray-700">Teachers share adventures via a short access code</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div >
              <div className="text-4xl font-bold text-blue-600">1</div>
              <h3 className="text-xl font-semibold text-gray-800">Create</h3>
              <p className="text-gray-700">Teacher logs in and designs a series of problems using the graph interface. The teacher sets expected outputs for each problem.</p>
            </div>
            <div >
              <div className="text-4xl font-bold text-blue-600">2</div>
              <h3 className="text-xl font-semibold text-gray-800">Share</h3>
              <p className="text-gray-700">Once the adventure is created, A unique 6-digit code is generated (can be found in the My Adventures page); students enter it to begin the series of problems designed in the adventure.</p>
            </div>
            <div >
              <div className="text-4xl font-bold text-blue-600">3</div>
              <h3 className="text-xl font-semibold text-gray-800">Solve</h3>
              <p className="text-gray-700">Students fill in missing code and submit. If the code is correct, the student will take the green path to the next problem. Otherwise they will take the red path.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800 border-b pb-2 mb-4">Tech Stack</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><span className="font-semibold">Frontend:</span> Typescript, React, React Flow, Tailwind CSS</li>
            <li><span className="font-semibold">Backend:</span> FastAPI, Python</li>
            <li><span className="font-semibold">Deployment:</span> GitHub Actions &rarr; Azure</li>
            <li><span className="font-semibold">Database:</span> PostgreSQL</li>
            
          </ul>
        </section>


    
      </div>
    </div>
  );
}