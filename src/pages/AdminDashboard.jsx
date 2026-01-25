import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    supabase
      .from("attendance")
      .select(`
        scanned_at,
        user_id,
        qr_sessions ( created_at )
      `)
      .order("scanned_at", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <div>
      <h2>Attendance Dashboard</h2>
      <table border="1">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Session Time</th>
            <th>Scan Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.user_id}</td>
              <td>{r.qr_sessions?.created_at}</td>
              <td>{r.scanned_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
