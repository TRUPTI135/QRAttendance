import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../supabaseClient";
import { useAuth } from "../auth/AuthProvider";

// Haversine distance calculation
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // meters
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
}

// Get user location with proper permission handling
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        reject(
          new Error(
            "Location permission denied or unavailable. Please allow location access."
          )
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export default function QRScanner() {
  const scannerRef = useRef(null);
  const [message, setMessage] = useState("Align QR inside the box");
  const [loading, setLoading] = useState(false);
  const scannedIdsRef = useRef(new Set());
  const { user } = useAuth(); // logged-in user

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setMessage("No camera found");
          return;
        }

        const config = { fps: 20, qrbox: 250 };

        await scanner.start(
          { facingMode: "environment" },
          config,
          async (sessionId) => {
            if (scannedIdsRef.current.has(sessionId)) return;
            scannedIdsRef.current.add(sessionId);

            scanner.pause();
            setLoading(true);
            setMessage("Validating QR...");

            try {
              if (!user) {
                setMessage("You must be logged in to scan QR");
                setLoading(false);
                scanner.resume();
                return;
              }

              // Get QR session
              const { data: session, error } = await supabase
                .from("qr_sessions")
                .select("*")
                .eq("id", sessionId)
                .single();

              if (error || !session) {
                setMessage("Invalid QR session");
                setLoading(false);
                scanner.resume();
                return;
              }

              // Check expiry
              if (new Date(session.expires_at) < new Date()) {
                setMessage("QR expired");
                setLoading(false);
                scanner.resume();
                return;
              }

              // Get user location
              let userLoc;
              try {
                userLoc = await getCurrentLocation();
              } catch (err) {
                setMessage(err.message);
                setLoading(false);
                scanner.resume();
                return;
              }

              // Calculate distance
              const distance = getDistance(
                session.lat,
                session.lng,
                userLoc.lat,
                userLoc.lng
              );

              const isValid = distance <= session.radius_meters;

              // Insert attendance
              const { error: insertError } = await supabase.from("attendance").insert({
                session_id: session.id,
                user_id: user.id,
                user_lat: userLoc.lat,
                user_lng: userLoc.lng,
                distance_meters: distance,
                valid: isValid,
              });

              if (insertError) {
                setMessage("Failed to mark attendance: " + insertError.message);
                setLoading(false);
                scanner.resume();
                return;
              }

              setMessage(
                `Attendance marked successfully! Distance: ${distance.toFixed(
                  2
                )} meters`
              );
              setLoading(false);
              // ✅ Do not resume scanner; QR already used

            } catch (err) {
              setMessage("Something went wrong: " + err.message);
              setLoading(false);
              scanner.resume();
            }
          }
        );
      } catch (err) {
        setMessage("Camera initialization failed: " + err.message);
      }
    };

    startScanner();

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [user]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "1rem",
      }}
    >
      <div style={{ maxWidth: 400, width: "100%" }}>
        <h2>User QR Scanner</h2>
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          Please allow location access for QR validation
        </p>
        <div
          id="qr-reader"
          style={{
            width: "100%",
            margin: "auto",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        />
        <p>{message}</p>
        {loading && <p>Processing...</p>}
      </div>
    </div>
  );
}
