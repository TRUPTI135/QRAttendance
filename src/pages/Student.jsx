import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { decodeQR } from "../utils/qrUtils";
import { supabase } from "../supabaseClient";
import { calculateDistance } from "../utils/distance";
import { getDeviceId } from "../utils/device";

export default function Student() {
  const [coords, setCoords] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [message, setMessage] = useState(
    "Tap button to enable location"
  );

  // ✅ USER TAP REQUIRED FOR iOS
  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords);
        setScannerReady(true);
        setMessage("Location enabled — Scan QR");
      },
      () => {
        setMessage("❌ Please allow location access");
      },
      { enableHighAccuracy: true }
    );
  };

  // ✅ Start scanner AFTER permission
  useEffect(() => {
    if (!scannerReady) return;

    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: 250,
    });

    scanner.render(async (text) => {
      scanner.clear();
      setMessage("Processing...");

      try {
        const { sessionId } = decodeQR(text);

        const { data: session } = await supabase
          .from("qr_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        const deviceId = getDeviceId();

        // One scan per device
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
  }, [scannerReady]);

  return (
    <div style={{ padding: 40 }}>
      <h2>Student Scanner</h2>

      {!scannerReady && (
        <button onClick={requestLocation}>
          Enable Location
        </button>
      )}

      <div id="reader" />
      <h3>{message}</h3>
    </div>
  );
}
