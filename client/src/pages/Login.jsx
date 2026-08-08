import { Link } from "react-router-dom";
import { ShieldCheck, GitBranch, Lock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

// Simulated scan feed — real content, not decoration. Swap for a live
// websocket/log feed later if you want it to reflect actual scan activity.
const scanFeed = [
  { text: "$ guardrail scan --repo acme/payments-api", tone: "cmd" },
  { text: "✓ Repository cloned", tone: "ok" },
  { text: "✓ Semgrep analysis started", tone: "ok" },
  { text: "⚠ SQL Injection • routes/orders.js:88", tone: "warn" },
  { text: "⚠ Hardcoded Secret • config/env.default.js:14", tone: "warn" },
  { text: "✓ Security report generated", tone: "ok" },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      login(response.data.token, response.data.data);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-[#0A0C10] text-[#E8EAED] flex items-center justify-center px-6 overflow-hidden">
      {/* Ambient background: faint dot grid + top glow, no motion */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1B2029 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 20%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, #4C6FFF, transparent 70%)",
        }}
      />

      <div className="relative grid w-full max-w-6xl grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Section */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#4C6FFF]/10 border border-[#4C6FFF]/30">
              <ShieldCheck
                className="h-4.5 w-4.5 text-[#4C6FFF]"
                strokeWidth={2}
              />
            </div>
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Guardrail
            </span>
          </div>

          <h1
            className="mt-8 text-4xl font-medium tracking-tight leading-[1.15] text-[#F4F5F7]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Static analysis for
            <br />
            codebases that can't fail.
          </h1>

          <p className="mt-4 text-[15px] text-[#8B92A0] max-w-sm leading-relaxed">
            Scan repositories, surface vulnerabilities before they ship, and
            generate audit-ready reports your security team will actually read.
          </p>

          {/* Signature element: live scan terminal */}
          <div className="mt-10 rounded-lg border border-[#20242E] bg-[#0D1016] overflow-hidden shadow-[0_0_0_1px_rgba(76,111,255,0.05)]">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#20242E] bg-[#0F1218]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#2B303C]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#2B303C]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#2B303C]" />
              </div>
              <span
                className="text-[11px] text-[#565D6D] tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                scan.log
              </span>
            </div>
            <div className="px-4 py-4 space-y-2">
              {scanFeed.map((line, i) => (
                <div
                  key={i}
                  className="text-[12.5px] leading-relaxed animate-fadeInLine"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    animationDelay: `${i * 140}ms`,
                    color:
                      line.tone === "warn"
                        ? "#F0B429"
                        : line.tone === "ok"
                          ? "#2DD4A7"
                          : line.tone === "cmd"
                            ? "#8FA2FF"
                            : "#6B7280",
                  }}
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          {/* Trust row */}
          <div className="mt-8 flex items-center gap-6 text-[#565D6D]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4A7] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2DD4A7]" />
              </span>
              <span
                className="text-[11.5px] tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ALL SYSTEMS OPERATIONAL
              </span>
            </div>
            <div className="h-3 w-px bg-[#20242E]" />
            <div
              className="flex items-center gap-1.5 text-[11.5px]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <GitBranch className="h-3 w-3" />
              Powered by Semgrep • GitHub • OWASP
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-center lg:justify-end">
          <Card className="w-full max-w-md bg-[#12151C] border-[#20242E] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-20px_rgba(0,0,0,0.6)]">
            <CardHeader className="space-y-1.5 pb-6">
              <div className="flex items-center gap-2 mb-1 lg:hidden">
                <ShieldCheck className="h-4 w-4 text-[#4C6FFF]" />
                <span
                  className="text-sm font-semibold tracking-tight text-[#F4F5F7]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Guardrail
                </span>
              </div>
              <CardTitle
                className="text-[22px] font-medium tracking-tight text-[#F4F5F7]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Sign in
              </CardTitle>
              <CardDescription className="text-[#8B92A0]">
                Access your security dashboard
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-[#8B92A0] tracking-wide"
                  >
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0D1016] border-[#20242E] text-[#E8EAED] placeholder:text-[#4A5060] h-10 focus-visible:ring-1 focus-visible:ring-[#4C6FFF] focus-visible:border-[#4C6FFF]"
                  />
                </div>

                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-xs font-medium text-[#8B92A0] tracking-wide"
                    >
                      PASSWORD
                    </Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#0D1016] border-[#20242E] text-[#E8EAED] placeholder:text-[#4A5060] h-10 focus-visible:ring-1 focus-visible:ring-[#4C6FFF] focus-visible:border-[#4C6FFF]"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#4C6FFF] hover:bg-[#3D5EEB] text-white font-medium"
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />

                  {loading ? "Signing In..." : "Sign In"}
                </Button>

                <p className="text-center text-sm text-[#565D6D]">
                  Don't have an account?{" "}
                  <Link
                    to="/register"
                    className="text-[#8FA2FF] hover:text-[#B0BEFF] transition-colors"
                  >
                    Create one
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`

        @keyframes fadeInLine {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInLine {
          opacity: 0;
          animation: fadeInLine 0.4s ease-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fadeInLine, .animate-ping {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
