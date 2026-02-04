import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>QR Attendance System</h1>
      <Link to="/admin">Admin</Link>
      <br />
      <Link to="/student">Student</Link>
    </div>
  );
}