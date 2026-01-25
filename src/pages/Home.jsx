import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page">
      <h1>QR Attendance</h1>
      <Link to="/admin">Admin</Link>
      <Link to="/user">User</Link>
    </div>
  );
}
