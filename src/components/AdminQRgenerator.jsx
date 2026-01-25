import { useState } from "react";
import QRCode from "react-qr-code";
import { supabase } from "../supabaseClient";
import { getCurrentLocation } from "../utils/locationUtils";
import { encodeQR } from "../utils/qrUtils";

export default function AdminQRGenerator() {
  const [qr, setQr] = useState("");
  const [radius, setRadius] = useState(50);
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);

    const loc = await getCurrentLocation();

    const { data, error } = await supabase
      .from("qr_sessions")
      .insert({
        lat: loc.lat,
        lng: loc.lng,
        radius_meters: radius,
        expires_at: new Date(Date.now() + 5 * 60000),
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setQr(encodeQR({ sessionId: data.id }));
    setLoading(false);
  };

  return (
    <div className="page">
      <h2>Admin QR Generator</h2>

      <label>Distance: {radius} meters</label>
      <input
        type="range"
        min="10"
        max="200"
        value={radius}
        onChange={(e) => setRadius(+e.target.value)}
      />

      <button onClick={generateQR} disabled={loading}>
        {loading ? "Generating..." : "Generate QR"}
      </button>

      {qr && <QRCode value={qr} />}
    </div>
  );
}
