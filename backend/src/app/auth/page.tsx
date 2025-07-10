// Enhanced Animated Auth Page with API Integration, Spinner & Success Message
"use client";

import { useState, useEffect } from "react";
import { LogIn, UserPlus, Mail, Lock } from "lucide-react";
import { Inter } from "next/font/google";
import { loginUser, registerUser } from "@/api/auth";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");
    setSuccess("");

    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      setLoading(true);
      if (tab === "login") {
        const res = await loginUser(email, password);
        localStorage.setItem("access_token", res.access_token);
        router.push("/dashboard");
        setSuccess("Login successful 🎉");
      } else {
        await registerUser(email, password);
        setSuccess("Registration successful ✅");
      }
    } catch (err: any) {
      setApiError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${inter.className} relative flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-white to-gray-100 overflow-hidden`}
    >
      {/* Floating Bubbles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute w-96 h-96 bg-black opacity-5 rounded-full top-10 left-10 animate-float-slow"></div>
        <div className="absolute w-60 h-60 bg-gray-700 opacity-10 rounded-full top-1/2 left-1/4 animate-float"></div>
        <div className="absolute w-72 h-72 bg-gray-900 opacity-5 rounded-full bottom-10 right-10 animate-float-delay"></div>
      </div>

      {/* Left Section */}
      <div className="md:w-1/2 w-full flex items-center justify-center p-12 z-10">
        <div className="max-w-md space-y-6 animate-fade-in-up">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            TrackFast
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Manage your logistics like a pro. Monitor your shipments, update
            status, and notify your customers in real-time.
          </p>
          <ul className="space-y-3 text-sm text-gray-500">
            <li>🚀 Lightning-fast tracking experience</li>
            <li>📊 Smart analytics & shipment insights</li>
            <li>🔐 Secure & user-friendly platform</li>
          </ul>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-black w-full animate-expand-bar"></div>
          </div>
        </div>
      </div>

      {/* Right Section - Auth Card */}
      <div className="md:w-1/2 w-full flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-white/70 border border-gray-200 p-6 rounded-xl shadow-xl animate-fade-in-up">
          <div className="flex gap-6 border-b border-gray-200 text-sm font-medium text-gray-600 mb-6">
            <button
              className={`flex items-center gap-2 pb-2 transition-all ${
                tab === "login"
                  ? "text-gray-900 border-b-2 border-black"
                  : "hover:text-gray-900"
              }`}
              onClick={() => setTab("login")}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              className={`flex items-center gap-2 pb-2 transition-all ${
                tab === "register"
                  ? "text-gray-900 border-b-2 border-black"
                  : "hover:text-gray-900"
              }`}
              onClick={() => setTab("register")}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-black bg-white">
                <Mail size={16} className="text-gray-400 mr-2" />
                <input
                  id="email"
                  type="email"
                  className="w-full text-sm outline-none bg-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 animate-shake">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-black bg-white">
                <Lock size={16} className="text-gray-400 mr-2" />
                <input
                  id="password"
                  type="password"
                  className="w-full text-sm outline-none bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 animate-shake">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-black text-white hover:bg-gray-900 rounded-md transition duration-300 flex justify-center items-center"
            >
              {loading ? (
                <span className="loader"></span>
              ) : tab === "login" ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>

            {apiError && (
              <p className="text-xs text-red-600 text-center animate-shake">
                {apiError}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 text-center animate-fade-in-up">
                {success}
              </p>
            )}

            <div className="text-sm text-gray-500 text-center">
              {tab === "login" ? (
                <>
                  Don’t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("register")}
                    className="text-black hover:underline"
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => setTab("login")}
                    className="text-black hover:underline"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          50% {
            transform: translateX(4px);
          }
          75% {
            transform: translateX(-2px);
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0);
          }
        }
        @keyframes expandBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 1s ease-out forwards;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 10s ease-in-out infinite 2s;
        }
        .animate-float-slow {
          animation: float 12s ease-in-out infinite;
        }
        .animate-expand-bar {
          animation: expandBar 2s ease-in-out forwards;
        }
        .loader {
          width: 16px;
          height: 16px;
          border: 3px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
