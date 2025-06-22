import { useUsers } from "./hooks/useUsers";
import UserList from "./components/UserList";

function App() {
  const { users, loading, error } = useUsers();

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Users</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <UserList users={users} />
    </div>
  );
}

export default App;
