import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>QR Attendance System</h1>

      <button onClick={() => navigate("/admin")}>
        Admin
      </button>

      <button onClick={() => navigate("/user")}>
        User
      </button>
    </div>
  );
}
