"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import "./style/LandingPage.css";

export function LandingPage({ onStart }: { onStart: () => void }) {
  const [isLoaded] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [waveIntensity, setWaveIntensity] = useState(1);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [missileEnabled, setMissileEnabled] = useState(false);
  const prevReady = useRef(false);

  useEffect(() => {
    if (showLogin) {
      const timer = setTimeout(() => setMissileEnabled(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [showLogin]);

  const isReady = missileEnabled && !!(email && password.length >= 3);

  useEffect(() => {
    if (prevReady.current && !isReady && !launched) {
      setAborting(true);
      const timer = setTimeout(() => setAborting(false), 500);
      return () => clearTimeout(timer);
    }
    prevReady.current = isReady;
  }, [isReady, launched]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("invalid");
      setLoading(false);
      return;
    }

    setLaunched(true);
    setTimeout(() => onStart(), 600);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (error) setError("");
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (error) setError("");
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTime = useRef(Date.now());
  const lastSetTime = useRef(0);

  // Wave range controls - adjust these values to change wave positions
  const wave1Min = 47.5;
  const wave1Max = 52.5;
  const wave2Min = 47;
  const wave2Max = 52;
  const wave3Min = 47.5;
  const wave3Max = 52.5;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const now = Date.now();
      // Throttle state updates to ~20fps (every 50ms)
      if (now - lastSetTime.current < 50) return;
      lastSetTime.current = now;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (isInside) {
        const timeDiff = now - lastMoveTime.current;
        lastMoveTime.current = now;
        const speed = timeDiff < 50 ? 3 : timeDiff < 100 ? 2.5 : 2;
        setWaveIntensity(speed);
      } else {
        setWaveIntensity(1);
      }
    };

    // Decay intensity over time — skip setState when already at minimum
    const decayInterval = setInterval(() => {
      setWaveIntensity(prev => prev <= 1 ? prev : Math.max(1, prev * 0.95));
    }, 100);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(decayInterval);
    };
  }, []);

  const waveStyle1 = useMemo(() => ({
    transform: `scaleY(${1 + waveIntensity * 0.5})`,
    transition: "transform 0.3s ease-out",
  }), [waveIntensity]);

  const waveStyle2 = useMemo(() => ({
    transform: `scaleY(${0.5 + waveIntensity * 0.3})`,
    transition: "transform 0.3s ease-out",
  }), [waveIntensity]);

  const waveStyle3 = useMemo(() => ({
    transform: `scaleY(${0.75 + waveIntensity * 0.4})`,
    transition: "transform 0.3s ease-out",
  }), [waveIntensity]);

  // Generate dynamic wave keyframes based on range controls
  const generateWaveKeyframes = (waveNum: number, min: number, max: number) => {
    const mid = (min + max) / 2;
    const amplitude = (max - min) / 2;

    if (waveNum === 1) {
      return `
        @keyframes wave1 {
          0% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              10% ${min}%,
              20% ${mid + 1}%,
              30% ${mid - 0.5}%,
              40% ${mid + 1.5}%,
              50% ${mid + 1}%,
              60% ${min}%,
              70% ${mid - 0.5}%,
              80% ${mid + 1.5}%,
              90% ${mid + 1}%,
              100% ${mid - 0.5}%,
              100% ${mid + 0.5}%,
              90% ${max}%,
              80% ${mid - 0.5}%,
              70% ${mid + 0.5}%,
              60% ${max}%,
              50% ${max}%,
              40% ${mid - 0.5}%,
              30% ${mid + 0.5}%,
              20% ${max}%,
              10% ${max}%,
              0% ${mid + 0.5}%
            );
          }
          50% {
            clip-path: polygon(
              0% ${mid + 1.5}%,
              10% ${mid + 1}%,
              20% ${min}%,
              30% ${mid + 1}%,
              40% ${mid - 0.5}%,
              50% ${mid + 1.5}%,
              60% ${mid + 1}%,
              70% ${min}%,
              80% ${mid - 0.5}%,
              90% ${mid + 1.5}%,
              100% ${mid + 1}%,
              100% ${mid - 0.5}%,
              90% ${max}%,
              80% ${mid + 0.5}%,
              70% ${mid - 0.5}%,
              60% ${mid - 1}%,
              50% ${max}%,
              40% ${mid + 0.5}%,
              30% ${mid - 0.5}%,
              20% ${max}%,
              10% ${mid - 1}%,
              0% ${mid - 0.5}%
            );
          }
          100% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              10% ${min}%,
              20% ${mid + 1}%,
              30% ${mid - 0.5}%,
              40% ${mid + 1.5}%,
              50% ${mid + 1}%,
              60% ${min}%,
              70% ${mid - 0.5}%,
              80% ${mid + 1.5}%,
              90% ${mid + 1}%,
              100% ${mid - 0.5}%,
              100% ${mid + 0.5}%,
              90% ${max}%,
              80% ${mid - 0.5}%,
              70% ${mid + 0.5}%,
              60% ${max}%,
              50% ${max}%,
              40% ${mid - 0.5}%,
              30% ${mid + 0.5}%,
              20% ${max}%,
              10% ${max}%,
              0% ${mid + 0.5}%
            );
          }
        }
      `;
    } else if (waveNum === 2) {
      return `
        @keyframes wave2 {
          0% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              8% ${min}%,
              16% ${mid + 1.5}%,
              24% ${mid - 0.5}%,
              32% ${mid + 2}%,
              40% ${mid + 1}%,
              48% ${mid + 2.5}%,
              56% ${mid + 1.5}%,
              64% ${min}%,
              72% ${mid + 1}%,
              80% ${min}%,
              88% ${mid - 0.5}%,
              96% ${mid + 2}%,
              100% ${mid + 1}%,
              100% ${max}%,
              96% ${max - 1}%,
              88% ${mid + 0.5}%,
              80% ${max}%,
              72% ${max}%,
              64% ${max}%,
              56% ${max - 1.5}%,
              48% ${max - 2.5}%,
              40% ${max}%,
              32% ${max - 1}%,
              24% ${mid + 0.5}%,
              16% ${max - 1.5}%,
              8% ${max}%,
              0% ${mid + 0.5}%
            );
          }
          33% {
            clip-path: polygon(
              0% ${mid + 2}%,
              8% ${mid - 0.5}%,
              16% ${min}%,
              24% ${mid + 1.5}%,
              32% ${mid - 0.5}%,
              40% ${mid + 2.5}%,
              48% ${mid + 1}%,
              56% ${min}%,
              64% ${mid + 2}%,
              72% ${mid - 0.5}%,
              80% ${mid + 1}%,
              88% ${mid + 2}%,
              96% ${mid - 0.5}%,
              100% ${min}%,
              100% ${max}%,
              96% ${mid + 0.5}%,
              88% ${max - 1}%,
              80% ${max}%,
              72% ${mid + 0.5}%,
              64% ${max - 1}%,
              56% ${max}%,
              48% ${max}%,
              40% ${max - 2.5}%,
              32% ${mid + 0.5}%,
              24% ${max - 1.5}%,
              16% ${max}%,
              8% ${mid + 0.5}%,
              0% ${max - 1}%
            );
          }
          66% {
            clip-path: polygon(
              0% ${min}%,
              8% ${mid + 2}%,
              16% ${mid - 0.5}%,
              24% ${mid + 2}%,
              32% ${min}%,
              40% ${mid - 0.5}%,
              48% ${mid + 2}%,
              56% ${mid + 1}%,
              64% ${min}%,
              72% ${mid + 2}%,
              80% ${mid - 0.5}%,
              88% ${min}%,
              96% ${mid + 1}%,
              100% ${mid + 2}%,
              100% ${max - 1}%,
              96% ${max}%,
              88% ${max}%,
              80% ${mid + 0.5}%,
              72% ${max - 1}%,
              64% ${max}%,
              56% ${max}%,
              48% ${max - 1}%,
              40% ${mid + 0.5}%,
              32% ${max}%,
              24% ${max - 1}%,
              16% ${mid + 0.5}%,
              8% ${max - 1}%,
              0% ${max}%
            );
          }
          100% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              8% ${min}%,
              16% ${mid + 1.5}%,
              24% ${mid - 0.5}%,
              32% ${mid + 2}%,
              40% ${mid + 1}%,
              48% ${mid + 2.5}%,
              56% ${mid + 1.5}%,
              64% ${min}%,
              72% ${mid + 1}%,
              80% ${min}%,
              88% ${mid - 0.5}%,
              96% ${mid + 2}%,
              100% ${mid + 1}%,
              100% ${max}%,
              96% ${max - 1}%,
              88% ${mid + 0.5}%,
              80% ${max}%,
              72% ${max}%,
              64% ${max}%,
              56% ${max - 1.5}%,
              48% ${max - 2.5}%,
              40% ${max}%,
              32% ${max - 1}%,
              24% ${mid + 0.5}%,
              16% ${max - 1.5}%,
              8% ${max}%,
              0% ${mid + 0.5}%
            );
          }
        }
      `;
    } else {
      return `
        @keyframes wave3 {
          0% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              8% ${min}%,
              16% ${mid + 1.5}%,
              24% ${mid - 0.5}%,
              32% ${mid + 2.5}%,
              40% ${mid + 1.5}%,
              48% ${mid + 3.5}%,
              56% ${mid + 2.5}%,
              64% ${mid - 0.5}%,
              72% ${mid + 1.5}%,
              80% ${min}%,
              88% ${mid - 0.5}%,
              96% ${mid + 2.5}%,
              100% ${mid + 1.5}%,
              100% ${mid + 0.5}%,
              96% ${max - 2.5}%,
              88% ${mid + 0.5}%,
              80% ${max}%,
              72% ${mid + 0.5}%,
              64% ${mid + 0.5}%,
              56% ${max - 2.5}%,
              48% ${max - 3.5}%,
              40% ${mid + 0.5}%,
              32% ${max - 2.5}%,
              24% ${mid + 0.5}%,
              16% ${mid + 0.5}%,
              8% ${max}%,
              0% ${mid + 0.5}%
            );
          }
          40% {
            clip-path: polygon(
              0% ${mid + 2.5}%,
              8% ${mid - 0.5}%,
              16% ${min}%,
              24% ${mid + 1.5}%,
              32% ${mid - 0.5}%,
              40% ${mid + 3.5}%,
              48% ${mid + 1.5}%,
              56% ${min}%,
              64% ${mid + 2.5}%,
              72% ${mid - 0.5}%,
              80% ${mid + 1.5}%,
              88% ${mid + 2.5}%,
              96% ${mid - 0.5}%,
              100% ${min}%,
              100% ${max}%,
              96% ${mid + 0.5}%,
              88% ${max - 2.5}%,
              80% ${mid + 0.5}%,
              72% ${mid + 0.5}%,
              64% ${max - 2.5}%,
              56% ${max}%,
              48% ${mid + 0.5}%,
              40% ${max - 3.5}%,
              32% ${mid + 0.5}%,
              24% ${mid + 0.5}%,
              16% ${max}%,
              8% ${mid + 0.5}%,
              0% ${max - 2.5}%
            );
          }
          80% {
            clip-path: polygon(
              0% ${min}%,
              8% ${mid + 2.5}%,
              16% ${mid - 0.5}%,
              24% ${mid + 2.5}%,
              32% ${min}%,
              40% ${mid - 0.5}%,
              48% ${mid + 2.5}%,
              56% ${mid + 1.5}%,
              64% ${min}%,
              72% ${mid + 2.5}%,
              80% ${mid - 0.5}%,
              88% ${min}%,
              96% ${mid + 1.5}%,
              100% ${mid + 2.5}%,
              100% ${max - 2.5}%,
              96% ${max}%,
              88% ${max}%,
              80% ${mid + 0.5}%,
              72% ${max - 2.5}%,
              64% ${max}%,
              56% ${mid + 0.5}%,
              48% ${max - 2.5}%,
              40% ${mid + 0.5}%,
              32% ${max}%,
              24% ${max - 2.5}%,
              16% ${mid + 0.5}%,
              8% ${max - 2.5}%,
              0% ${max}%
            );
          }
          100% {
            clip-path: polygon(
              0% ${mid - 0.5}%,
              8% ${min}%,
              16% ${mid + 1.5}%,
              24% ${mid - 0.5}%,
              32% ${mid + 2.5}%,
              40% ${mid + 1.5}%,
              48% ${mid + 3.5}%,
              56% ${mid + 2.5}%,
              64% ${mid - 0.5}%,
              72% ${mid + 1.5}%,
              80% ${min}%,
              88% ${mid - 0.5}%,
              96% ${mid + 2.5}%,
              100% ${mid + 1.5}%,
              100% ${mid + 0.5}%,
              96% ${max - 2.5}%,
              88% ${mid + 0.5}%,
              80% ${max}%,
              72% ${mid + 0.5}%,
              64% ${mid + 0.5}%,
              56% ${max - 2.5}%,
              48% ${max - 3.5}%,
              40% ${mid + 0.5}%,
              32% ${max - 2.5}%,
              24% ${mid + 0.5}%,
              16% ${mid + 0.5}%,
              8% ${max}%,
              0% ${mid + 0.5}%
            );
          }
        }
      `;
    }
  };

  // Wave min/max are compile-time constants — memoize so keyframes only generate once
  const waveKeyframes = useMemo(
    () =>
      generateWaveKeyframes(1, wave1Min, wave1Max) +
      generateWaveKeyframes(2, wave2Min, wave2Max) +
      generateWaveKeyframes(3, wave3Min, wave3Max),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <>
      <style>{waveKeyframes}</style>

      <div className="landing-container">
        {/* Left Container */}
        <div className="landing-left">
          <h1 className="landing-title">Insight Generation Platform</h1>
          <p className="landing-subtitle">
            A platform to input human-generated insights from Tableau Public dashboards, which serves as the basis for evaluating VLM-generated insights.
          </p>
          <button
            className="start-button"
            style={{
              background: isLoaded
                ? "linear-gradient(135deg, #3a6ad6 0%, #2a5ac6 100%)"
                : "rgba(128, 128, 128, 0.3)",
              cursor: isLoaded ? "pointer" : "not-allowed",
            }}
            onClick={isLoaded ? () => setShowLogin(true) : undefined}
            disabled={!isLoaded}
          >
            {isLoaded ? "Start →" : "Loading..."}
          </button>
        </div>

        {/* Right Container */}
        <div ref={containerRef} className="landing-right">
          <div className={`vbig-container${showLogin ? " login-active" : ""}`}>
            <span className="landing-vbig-letter">V</span>
            <span className="landing-vbig-letter">B</span>
            <span className="landing-vbig-letter">I</span>
            <span className="landing-vbig-letter">G</span>
            <a
              href="https://github.com/pradervonsky/vbig-lab"
              target="_blank"
              rel="noopener noreferrer"
              className="github-button"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ display: "block" }}
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>

          {/* Login Form - Submarine */}
          <div className={`login-form-container${showLogin ? " visible" : ""}`}>
            <div className="submarine">
              {/* Bubbles - behind submarine */}
              <div className="sub-bubbles">
                <span className="bubble b1"></span>
                <span className="bubble b2"></span>
                <span className="bubble b3"></span>
              </div>

              {/* Submarine art with embedded inputs */}
              <div className="sub-art">
                <div>{`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢣⣤⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠻⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢀⣠⣤⣤⣤⣤⣤⣤⣤⣿⣿⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣿⣿⣧⣤⣤⣤⣤⣤⣄⣀⣀⡀⠀⠀⣼⣿⡟⠀⣿⣿⠁⠀⠀⠀
⠀⠀⠀⢠⣾⣿⡿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣤⣀⣿⣿⠀⠀⠀⠀
⠀⠀⢰⣿⡿⠋⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣄⠀⠀`}</div>
                <div className="sub-art-row">
                  <span>⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</span>
                  <input type="email" value={email} onChange={handleEmailChange} className="sub-art-input" placeholder="email" required autoFocus={showLogin} form="login-form" />
                  <span>⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀</span>
                </div>
                <div>⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀</div>
                <div className="sub-art-row">
                  <span>⠀⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿</span>
                  <input type="password" value={password} onChange={handlePasswordChange} className="sub-art-input" placeholder="password" required form="login-form" />
                  <span>⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀⠀</span>
                </div>
                <div>{`⠀⠀⠻⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠀⠀
⠀       ⠻⣿⣷⣶⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣴⣶⣶⣶⣿⣿⣿⢿⣿⣿⠛⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀   ⠉⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠉⠉⠉⠀⠀⠀⢻⣿⣧  ⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀`}</div>
              </div>
            </div>

            {/* Missile button - below submarine */}
            <form id="login-form" onSubmit={handleLogin}>
              <div className={`sub-missile${isReady ? " ready" : ""}${aborting ? " aborting" : ""}${launched ? " launched" : ""}`}>
                <button type="submit" disabled={loading || launched} className={error ? "has-error" : ""}>
                  {error ? error : loading ? "launching!" : "sign in"}
                </button>
                <div className="missile-bubbles">
                  <span className="mb mb1"></span>
                  <span className="mb mb2"></span>
                  <span className="mb mb3"></span>
                  <span className="mb mb4"></span>
                  <span className="mb mb5"></span>
                </div>
              </div>
            </form>
          </div>

          <div className="wave wave-light" style={waveStyle3}></div>
          <div className="wave wave-grey" style={waveStyle2}></div>
          <div className="wave wave-blue" style={waveStyle1}></div>

          {/* Login background wave */}
          <div className={`wave-login-bg${showLogin ? " visible" : ""}`}></div>
        </div>
      </div>
    </>
  );
}
