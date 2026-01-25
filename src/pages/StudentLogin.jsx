import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function StudentLogin() {
  const navigate = useNavigate();

  const login = async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return alert(error.message);
    navigate("/scan");
  };

  return (
    <div className="page">
      <h2>Student Login</h2>
      <button onClick={login}>Continue</button>
    </div>
  );
}
