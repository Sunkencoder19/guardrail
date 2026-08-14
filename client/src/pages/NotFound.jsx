import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0C10] text-[#F5F6F8]">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(#252B36 1px, transparent 1px), linear-gradient(90deg, #252B36 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at center, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black, transparent 75%)",
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4C6FFF]/[0.035] blur-3xl" />

      {/* Main */}
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <section className="w-full max-w-[620px] text-center">
          {/* Brand */}
          <Link
            to="/dashboard"
            className="mx-auto inline-flex items-center gap-2.5"
          >
            <span className="grid h-9 w-9 place-items-center rounded-md border border-[#4C6FFF]/30 bg-[#4C6FFF]/[0.08]">
              <ShieldCheck
                className="h-[18px] w-[18px] text-[#8FA2FF]"
                strokeWidth={1.8}
              />
            </span>

            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#F5F6F8]">
              Guardrail
            </span>
          </Link>

          {/* Error */}
          <div className="mt-16">
            <p className="font-mono text-[11px] font-medium tracking-[0.2em] text-[#68738A]">
              ROUTE_NOT_FOUND
            </p>

            <div className="relative mt-3">
              <h1 className="select-none font-mono text-[110px] font-medium leading-none tracking-[-0.09em] text-[#F1F3F7] sm:text-[150px]">
                404
              </h1>

              <span className="absolute left-1/2 top-1/2 h-px w-[180px] -translate-x-1/2 rotate-[-7deg] bg-[#4C6FFF]/30" />
            </div>

            <h2 className="mt-4 text-[18px] font-medium tracking-[-0.02em] text-[#E7EAF0]">
              Page not found
            </h2>

            <p className="mx-auto mt-3 max-w-[430px] text-[13px] leading-relaxed text-[#7F899A]">
              The route you're looking for doesn't exist, may have been
              moved, or is no longer available.
            </p>
          </div>

          {/* Requested route */}
          <div className="mx-auto mt-8 max-w-[480px] border border-[#28303D] bg-[#101319] px-4 py-3 text-left">
            <p className="font-mono text-[9px] tracking-[0.14em] text-[#626C7D]">
              REQUESTED ROUTE
            </p>

            <p className="mt-1 truncate font-mono text-[11px] text-[#AAB3C2]">
              {location.pathname}
              {location.search}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#303847] bg-[#101319] px-4 font-mono text-[10px] font-medium tracking-[0.08em] text-[#C1C8D4] transition-colors hover:bg-[#191E27] hover:text-[#F5F6F8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              GO BACK
            </button>

            <Link
              to="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 border border-[#4C6FFF]/40 bg-[#4C6FFF]/10 px-4 font-mono text-[10px] font-medium tracking-[0.08em] text-[#B5C0FF] transition-colors hover:border-[#4C6FFF]/60 hover:bg-[#4C6FFF]/15"
            >
              BACK TO DASHBOARD
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Footer status */}
          <div className="mt-16 flex items-center justify-center gap-2 font-mono text-[9px] tracking-[0.12em] text-[#535D6D]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6DD6A8]" />
            GUARDRAIL SYSTEM ONLINE
          </div>
        </section>
      </main>
    </div>
  );
};

export default NotFound;