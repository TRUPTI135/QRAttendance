import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../supabaseClient";

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QRScanner() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      async (sessionId) => {
        scanner.stop();

        const { data: session } = await supabase
          .from("qr_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (!session) {
          setStatus("❌ Invalid QR");
          return;
        }

        if (new Date() > new Date(session.expires_at)) {
          setStatus("❌ QR expired");
          return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
          const distance = getDistance(
            session.lat,
            session.lng,
            pos.coords.latitude,
            pos.coords.longitude
          );

          const valid = distance <= session.radius_meters;

          await supabase.from("attendance").insert({
            session_id: sessionId,
            user_lat: pos.coords.latitude,
            user_lng: pos.coords.longitude,
            distance_meters: distance,
            valid
          });

          setStatus(valid ? "✅ Attendance marked" : "❌ Outside location");
        });
      }
    );

    return () => scanner.stop().catch(() => {});
  }, []);

  return (
    <>
      <div id="qr-reader" style={{ width: 300 }} />
      <p>{status}</p>
    </>
  );
}

