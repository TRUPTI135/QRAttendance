import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { decodeQR } from "../utils/qrUtils";
import { supabase } from "../supabaseClient";
import { calculateDistance } from "../utils/distance";
import { getDeviceId } from "../utility/device";

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
      const deviceId = getDeviceId();

      // 🔹 Fetch session
      const { data: session } = await supabase
        .from("qr_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (!session) {
        setMessage("❌ Invalid Session");
        return;
      }

      // 🔹 Expiry check
      if (new Date(session.expires_at) < new Date()) {
        setMessage("⏱ Session Expired");
        return;
      }

      // 🔹 Duplicate scan check
      const { data: existing } = await supabase
        .from("attendance")
        .select("id")
        .eq("session_id", sessionId)
        .eq("device_id", deviceId)
        .maybeSingle();

      if (existing) {
        setMessage("⚠️ Already scanned on this device");
        return;
      }

      // 🔹 Geo validation
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
          device_id: deviceId,
          user_lat: pos.coords.latitude,
          user_lng: pos.coords.longitude,
          distance_meters: d,
          valid,
        });

        setMessage(
          valid
            ? "✅ Attendance Marked"
            : "❌ Outside allowed radius"
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
