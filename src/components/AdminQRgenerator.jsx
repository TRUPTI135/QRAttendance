import { useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "../supabaseClient";

export default function AdminQRGenerator() {
  const [qrValue, setQrValue] = useState(null);

  const generateQR = async () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 1000); // 30s

      await supabase.from("qr_sessions").insert({
        id: sessionId,
        expires_at: expiresAt,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        radius_meters: 50
      });

      setQrValue(sessionId);
    });
  };

  return (
    <div>
      <button onClick={generateQR}>Generate Dynamic QR</button>

      {qrValue && (
        <div style={{ marginTop: 20 }}>
          <QRCode value={qrValue} />
          <p>Valid for 30 seconds</p>
        </div>
      )}
    </div>
  );
}

