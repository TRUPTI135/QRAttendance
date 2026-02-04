import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { encodeQR } from "../utils/qrUtils";
import QRCode from "react-qr-code";

export default function Admin() {
  const [radius, setRadius] = useState(100);
  const [qrValue, setQrValue] = useState(null);
  const [attendance, setAttendance] = useState([]);

  async function generateQR() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

      const { data } = await supabase
        .from("qr_sessions")
        .insert({
          lat: latitude,
          lng: longitude,
          radius_meters: radius,
          active: true,
        })
        .select()
        .single();

      setQrValue(encodeQR({ sessionId: data.id }));
    });
  }

  useEffect(() => {
    const loadAttendance = async () => {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .order("scanned_at", { ascending: false });
      setAttendance(data || []);
    };

    loadAttendance();

    const channel = supabase
      .channel("attendance-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        loadAttendance
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Panel</h2>

      <input
        type="number"
        value={radius}
        onChange={(e) => setRadius(+e.target.value)}
      />
      <button onClick={generateQR}>Generate QR</button>

      {qrValue && <QRCode value={qrValue} />}

      <h3>Attendance</h3>
      <table border="1">
        <thead>
          <tr>
            <th>Time</th>
            <th>Distance (m)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendance.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.scanned_at).toLocaleString()}</td>
              <td>{a.distance_meters.toFixed(1)}</td>
              <td>{a.valid ? "✅ Present" : "❌ Out"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}