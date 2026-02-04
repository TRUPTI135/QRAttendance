import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { decodeQR } from "../utils/qrUtils";
import { supabase } from "../supabaseClient";
import { calculateDistance } from "../utils/distance";

export default function Student() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(async (text) => {
      scanner.clear();

      const { sessionId } = decodeQR(text);

      const { data: session } = await supabase
        .from("qr_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const d = calculateDistance(
          session.lat,
          session.lng,
          pos.coords.latitude,
          pos.coords.longitude
        );

        const valid = d <= session.radius_meters;

        await supabase.from("attendance").insert({
          session_id: session.id,
          user_lat: pos.coords.latitude,
          user_lng: pos.coords.longitude,
          distance_meters: d,
          valid,
        });

        setMessage(
          valid
            ? "✅ Attendance Marked"
            : "❌ You are out of range"
        );
      });
    });

    return () => scanner.clear();
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Student Scanner</h2>
      <div id="reader" />
      <h3>{message}</h3>
    </div>
  );
}