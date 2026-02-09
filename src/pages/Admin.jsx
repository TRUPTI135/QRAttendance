import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { encodeQR } from "../utils/qrUtils";
import QRCode from "react-qr-code";

export default function Admin() {
  const [radius, setRadius] = useState(100);
  const [qrValue, setQrValue] = useState(null);
  const [attendance, setAttendance] = useState([]);

  async function generateQR() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const MINUTE = 60 * 1000;
        const expiresAt = new Date(Date.now() + 2 * MINUTE);

        const { data, error } = await supabase
          .from("qr_sessions")
          .insert({
            lat: latitude,
            lng: longitude,
            radius_meters: radius,
            active: true,
            expires_at: expiresAt,
          })
          .select()
          .single();

        console.log("QR SESSION DATA:", data);
        console.log("QR SESSION ERROR:", error);

        if (error) {
          alert(`Failed to generate QR: ${error.message}`);
          return;
        }

        setQrValue(encodeQR({ sessionId: data.id }));
      },
      (err) => {
        console.error(err);
        alert("Location permission denied");
      },
      { enableHighAccuracy: true }
    );
  }

  useEffect(() => {
    const loadAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("scanned_at", { ascending: false });

      if (!error) setAttendance(data || []);
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

      <label>
        Radius (meters):{" "}
        <input
          type="number"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
      </label>

      <br /><br />

      <button onClick={generateQR}>Generate QR</button>

      <br /><br />

      {qrValue && <QRCode value={qrValue} />}

      <h3>Attendance</h3>
      <table border="1">
        <thead>
        <tr>
          <th>Time</th>
          <th>Distance (m)</th>
          <th>Device</th>
          <th>Status</th>
        </tr>
      </thead>

       <tbody>
        {attendance.length === 0 && (
          <tr>
            <td colSpan="4">No attendance yet</td>
          </tr>
        )}

        {attendance.map((a) => (
          <tr key={a.id}>
            <td>{new Date(a.scanned_at).toLocaleString()}</td>
            <td>{a.distance_meters?.toFixed(1)}</td>
            <td>{a.device_id}</td>
            <td>{a.valid ? "✅ Present" : "❌ Out"}</td>
          </tr>
        ))}
      </tbody>

      </table>
    </div>
  );
}