import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import User from "./pages/User";
import QRScanner from "./components/QRScanner";
import StudentLogin from "./pages/StudentLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQRGenerator from "./components/AdminQRgenerator";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/scan" element={<QRScanner />} />
        <Route path="/admin" element={<AdminQRGenerator />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/user" element={<User />} />
      </Routes>
    </BrowserRouter>
  );
}
