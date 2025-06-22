import type { User } from "../api/users";

interface Props {
  users: User[];
}

export default function UserList({ users }: Props) {
  if (users.length === 0) return <p>No users yet.</p>;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} ({user.email}) - {user.role}
        </li>
      ))}
    </ul>
  );
}
