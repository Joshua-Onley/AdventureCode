import { useState } from 'react'
import axios from 'axios'

const AttemptProblem = () => {
  const [accessCode, setAccessCode] = useState('')
  const [problem, setProblem] = useState<any>(null)
  const [solution, setSolution] = useState('')
  const [message, setMessage] = useState('')
  const FASTAPI_BACKEND_URL = import.meta.env.VITE_FASTAPI_BACKEND_URL;
  const fetchProblem = async () => {
    try {
      const res = await axios.get(`${FASTAPI_BACKEND_URL}/problems/access/${accessCode}`) 
      setProblem(res.data)
      setMessage('')
    } catch (err) {
      console.error(err)
      setMessage('Problem not found.')
    }
  }

  const submitSolution = async () => {
    try {
      const formData = new URLSearchParams()
      formData.append('access_code', accessCode.trim().toLowerCase())
      formData.append('code', solution)
      formData.append('language', 'python')  // TODO: add support for more languages
  
      const res = await axios.post(`${FASTAPI_BACKEND_URL}/submissions`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
  
      setMessage(res.data.message || 'Submitted successfully.')
    } catch (err) {
      console.error(err)
      setMessage('Error submitting solution.')
    }
  }

  return (
    <div>
      <h2>Attempt a Problem</h2>

      {!problem && (
        <>
          <input
            type="text"
            placeholder="Enter access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />
          <button onClick={fetchProblem}>Load Problem</button>
        </>
      )}

      {problem && (
        <>
          <h3>{problem.title}</h3>
          <p>{problem.description}</p>
          <pre>{problem.code_snippet}</pre>
          <textarea
            rows={10}
            cols={50}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Complete the code"
          />
          <br />
          <button onClick={submitSolution}>Submit</button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}

export default AttemptProblem
