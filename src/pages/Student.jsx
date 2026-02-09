import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { decodeQR } from "../utils/qrUtils";
import { supabase } from "../supabaseClient";
import { calculateDistance } from "../utils/distance";
import { getDeviceId } from "../utils/device";

export default function Student() {
  const [message, setMessage] = useState("Requesting permissions...");
  const [locationReady, setLocationReady] = useState(false);
  const [coords, setCoords] = useState(null);

  // ✅ STEP 1 — Request location immediately (Fix for iOS)
  useEffect(() => {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords);
        setLocationReady(true);
        setMessage("Ready to scan QR");
      },
      () => {
        setMessage("❌ Location permission required");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // ✅ STEP 2 — Start scanner ONLY after location granted
  useEffect(() => {
    if (!locationReady) return;

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(async (text) => {
      scanner.clear();
      setMessage("Processing scan...");

      try {
        const { sessionId } = decodeQR(text);

        const { data: session, error } = await supabase
          .from("qr_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (error || !session) {
          setMessage("Invalid session");
          return;
        }

        const deviceId = getDeviceId();

        // 🔒 One scan per device check
        const { data: existing } = await supabase
          .from("attendance")
          .select("id")
          .eq("session_id", session.id)
          .eq("device_id", deviceId)
          .maybeSingle();

        if (existing) {
          setMessage("⚠️ Already scanned on this device");
          return;
        }

        const distance = calculateDistance(
          session.lat,
          session.lng,
          coords.latitude,
          coords.longitude
        );

        const valid = distance <= session.radius_meters;

        await supabase.from("attendance").insert({
          session_id: session.id,
          device_id: deviceId,
          user_lat: coords.latitude,
          user_lng: coords.longitude,
          distance_meters: distance,
          valid,
        });

        setMessage(
          valid
            ? "✅ Attendance Marked"
            : "❌ Outside allowed range"
        );

      } catch (err) {
        console.error(err);
        setMessage("Scan failed");
      }
    });

    return () => scanner.clear();
  }, [locationReady, coords]);

  return (
    <div style={{ padding: 40 }}>
      <h2>Student Scanner</h2>
      <div id="reader" />
      <h3>{message}</h3>
    </div>
  );
}
