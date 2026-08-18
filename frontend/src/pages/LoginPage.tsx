import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService.js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch {
      setError("Identifiants invalides.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Mini-WMS</h1>

        {error && (
          <p className="bg-red-50 text-red-700 p-2 rounded mb-4 text-sm">
            {error}
          </p>
        )}

        <label className="block mb-4">
          <span className="block text-sm font-medium mb-1">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="admin@wms.local"
          />
        </label>

        <label className="block mb-6">
          <span className="block text-sm font-medium mb-1">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}