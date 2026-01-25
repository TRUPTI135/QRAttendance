import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";

export default function User() {
  const { user } = useAuth();
  return user ? <Navigate to="/scan" /> : <Navigate to="/student-login" />;
}
