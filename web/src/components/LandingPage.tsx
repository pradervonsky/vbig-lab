"use client";

import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";

export function LandingPage({ onStart }: { onStart: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
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
      const timer = setTimeout(() => setMissileEnabled(true), 1500);
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

  // Wave range controls - adjust these values to change wave positions
  const wave1Min = 47.5;
  const wave1Max = 52.5;
  const wave2Min = 47;
  const wave2Max = 52;
  const wave3Min = 47.5;
  const wave3Max = 52.5;

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const isInside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (isInside) {
        const now = Date.now();
        const timeDiff = now - lastMoveTime.current;
        lastMoveTime.current = now;

        // Calculate intensity based on mouse speed
        const speed = timeDiff < 50 ? 3 : timeDiff < 100 ? 2.5 : 2;
        setWaveIntensity(speed);
      } else {
        setWaveIntensity(1);
      }
    };

    // Decay intensity over time
    const decayInterval = setInterval(() => {
      setWaveIntensity(prev => Math.max(1, prev * 0.95));
    }, 100);

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(decayInterval);
    };
  }, []);

  const waveStyle1: CSSProperties = {
    transform: `scaleY(${1 + waveIntensity * 0.5})`,
    transition: "transform 0.3s ease-out",
  };

  const waveStyle2: CSSProperties = {
    transform: `scaleY(${0.5 + waveIntensity * 0.3})`,
    transition: "transform 0.3s ease-out",
  };

  const waveStyle3: CSSProperties = {
    transform: `scaleY(${0.75 + waveIntensity * 0.4})`,
    transition: "transform 0.3s ease-out",
  };

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

  return (
    <>
      <style>{`
        ${generateWaveKeyframes(1, wave1Min, wave1Max)}
        ${generateWaveKeyframes(2, wave2Min, wave2Max)}
        ${generateWaveKeyframes(3, wave3Min, wave3Max)}


        .wave {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform-origin: center;
        }

        .wave-blue {
          background: #3a69d6b7;
          animation: wave1 5s ease-in-out infinite;
        }

        .wave-grey {
          background: #102a61b9;
          animation: wave2 6s ease-in-out infinite;
        }

        .wave-light {
          background: #00000077;
          animation: wave3 7s ease-in-out infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .start-button {
          animation: fadeIn 0.5s ease-out;
          transition: all 0.5s ease;
        }

        .start-button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(58, 106, 214, 0.4) !important;
        }

        .start-button:not(:disabled):active {
          transform: translateY(0);
        }

        .github-button {
          transition: all 0.3s ease;
        }

        .github-button:hover {
          transform: scale(1) translateY(-2px);
        }

        .vbig-container {
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vbig-container.login-active {
          transform: translateY(-55%);
        }

        @keyframes waveLogin {
          0% {
            clip-path: polygon(
              0% 49.5%, 10% 47%, 20% 51%, 30% 49.5%, 40% 51.5%, 50% 51%, 60% 47%, 70% 49.5%, 80% 51.5%, 90% 51%, 100% 49.5%,
              100% 100%, 0% 100%
            );
          }
          50% {
            clip-path: polygon(
              0% 51.5%, 10% 51%, 20% 47%, 30% 51%, 40% 49.5%, 50% 51.5%, 60% 51%, 70% 47%, 80% 49.5%, 90% 51.5%, 100% 51%,
              100% 100%, 0% 100%
            );
          }
          100% {
            clip-path: polygon(
              0% 49.5%, 10% 47%, 20% 51%, 30% 49.5%, 40% 51.5%, 50% 51%, 60% 47%, 70% 49.5%, 80% 51.5%, 90% 51%, 100% 49.5%,
              100% 100%, 0% 100%
            );
          }
        }

        .wave-login-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #3a69d6b7;
          clip-path: polygon(
            0% 50%, 10% 50%, 20% 50%, 30% 50%, 40% 50%, 50% 50%, 60% 50%, 70% 50%, 80% 50%, 90% 50%, 100% 50%,
            100% 50%, 0% 50%
          );
          transition: clip-path 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 15;
        }

        .wave-login-bg.visible {
          clip-path: polygon(
            0% 49.5%, 10% 47%, 20% 51%, 30% 49.5%, 40% 51.5%, 50% 51%, 60% 47%, 70% 49.5%, 80% 51.5%, 90% 51%, 100% 49.5%,
            100% 100%, 0% 100%
          );
          animation: waveLogin 5s ease-in-out 0.6s infinite;
        }

        .login-form-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 77.5%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
          opacity: 0;
          transform: translateY(20px);
          pointer-events: none;
          transition: opacity 0.4s ease 0.3s, transform 0.4s ease 0.3s;
        }

        .login-form-container.visible {
          opacity: 1;
          transform: translateY(0);
          pointer-events: all;
        }

        .submarine {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          right: -25px;
          transform: translateY(120%) rotate(15deg);
          opacity: 0;
          transition: transform 0.5s ease-in-out 0.3s, opacity 0.2s ease-in-out 0.3s;
        }

        .login-form-container.visible .submarine {
          transform: translateY(0);
          opacity: 1;
          animation: subFloat 4s ease-in-out 0.8s infinite;
        }

        .sub-art {
          white-space: pre;
          font-size: 12px;
          line-height: 1.1;
          color: rgba(255, 255, 255, 0.45);
          z-index: 2;
          user-select: none;
          pointer-events: none;
          text-align: center;
          width: fit-content;
          margin: 0 auto;
        }

        .sub-art-row {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .sub-art-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 4px;
          outline: none;
          text-align: center;
          pointer-events: auto;
          user-select: auto;
          transition: all 0.2s ease;
        }

        .sub-art-input:focus {
          border-color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.15);
        }

        .sub-art-input:-webkit-autofill,
        .sub-art-input:-webkit-autofill:hover,
        .sub-art-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #fff;
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.08) inset;
          box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.08) inset;
          transition: background-color 5000s ease-in-out 0s;
        }

        .sub-art-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .sub-missile {
          position: relative;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(-25px) scale(0.95);
          pointer-events: none;
          transition: opacity 0.4s ease-in, transform 0.4s ease-in;
        }

        .sub-missile.ready {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
          animation: torpedoFloat 2s ease-in-out 0.5s infinite;
          transition: opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .sub-missile button {
          min-width: 150px;
          position: relative;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px 4px 4px 20px;
          color: #fff;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 28px 8px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 1px;
        }

        .sub-missile button::after {
          content: '+';
          position: absolute;
          right: -16px;
          top: 50%;
          font-size: 33px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.25);
          transform-origin: center;
          animation: propellerSpin 0.3s linear infinite;
        }

        .sub-missile button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateX(-3px);
        }

        .sub-missile button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sub-missile button.has-error {
          background: rgba(220, 53, 69, 0.25);
          border-color: rgba(220, 53, 69, 0.5);
          color: #ff6b6b;
          opacity: 1;
        }

        .sub-missile button.has-error::after {
          color: rgba(220, 53, 69, 0.5);
        }

        .sub-missile.aborting {
          animation: torpedoAbort 0.3s ease-in forwards !important;
          pointer-events: none;
        }

        .sub-missile.aborting button {
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(0, 0, 0, 0.2);
          color: rgba(255, 255, 255, 0.3);
        }

        .sub-missile.aborting button::after {
          color: rgba(0, 0, 0, 0.3);
        }

        @keyframes torpedoAbort {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          20% { transform: translateY(8px) rotate(-5deg); opacity: 0.8; }
          100% { transform: translateY(120px) rotate(-30deg); opacity: 0; }
        }

        .sub-missile.launched {
          animation: torpedoLaunch 0.5s ease-in forwards !important;
        }

        @keyframes torpedoLaunch {
          0% { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(-120vw, 0); opacity: 0; }
        }

        .missile-bubbles {
          position: absolute;
          right: -10px;
          top: 50%;
        }

        .missile-bubbles .mb {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.04);
        }

        .mb1 {
          width: 5px;
          height: 5px;
          animation: missileB1 1.2s ease-out infinite;
        }

        .mb2 {
          width: 3px;
          height: 3px;
          top: -4px;
          animation: missileB2 0.6s ease-out 0.2s infinite;
        }

        .mb3 {
          width: 4px;
          height: 4px;
          top: 5px;
          animation: missileB3 0.5s ease-out 0.1s infinite;
        }

        .mb4 {
          width: 3px;
          height: 3px;
          top: -8px;
          animation: missileB4 0.7s ease-out 0.4s infinite;
        }

        .mb5 {
          width: 4px;
          height: 4px;
          top: 8px;
          animation: missileB5 1s ease-out 0.3s infinite;
        }

        @keyframes torpedoFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          30% { transform: translate(-3px, -5px) rotate(-0.9deg); }
          60% { transform: translate(2px, 7px) rotate(0.9deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes propellerSpin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }

        @keyframes missileB1 {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translate(40px, -10px); opacity: 0; }
        }

        @keyframes missileB2 {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.4; }
          100% { transform: translate(30px, -18px); opacity: 0; }
        }

        @keyframes missileB3 {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.5; }
          100% { transform: translate(35px, 8px); opacity: 0; }
        }

        @keyframes missileB4 {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.5; }
          100% { transform: translate(28px, -22px); opacity: 0; }
        }

        @keyframes missileB5 {
          0% { transform: translate(0, 0); opacity: 0; }
          10% { opacity: 0.4; }
          100% { transform: translate(42px, 12px); opacity: 0; }
        }

        .sub-bubbles {
          position: absolute;
          left: calc(57.5% + 120px);
          top: 85%;
          z-index: 1;
        }

        .bubble {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }

        .b1 {
          width: 8px;
          height: 8px;
          animation: bubbleFloat1 1.5s ease-out 0.7s infinite;
        }

        .b2 {
          width: 5px;
          height: 5px;
          top: -12px;
          animation: bubbleFloat2 1s ease-out 0.5s infinite;
        }

        .b3 {
          width: 7px;
          height: 7px;
          top: 10px;
          animation: bubbleFloat3 2s ease-out 0.8s infinite;
        }

        @keyframes subFloat {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(2px, -2px) rotate(0deg); }
          50% { transform: translate(0px, -4px) rotate(0deg); }
          75% { transform: translate(-2px, -6px) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes bubbleFloat1 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.7; }
          100% { transform: translate(60px, -15px); opacity: 0; }
        }

        @keyframes bubbleFloat2 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.5; }
          100% { transform: translate(40px, -25px); opacity: 0; }
        }

        @keyframes bubbleFloat3 {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: 0.6; }
          100% { transform: translate(55px, 8px); opacity: 0; }
        }
      `}</style>

      <div style={styles.container}>
        {/* Left Container */}
        <div style={styles.leftContainer}>
          <h1 style={styles.title}>Insight Generation Platform</h1>
          <p style={styles.subtitle}>
            A platform to input human-generated insights from Tableau Public dashboards, which serves as the basis for evaluating AI-generated insights.
          </p>
          <button
            className="start-button"
            style={{
              ...styles.startButton,
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
        <div ref={containerRef} style={styles.rightContainer}>
          <div
            style={styles.vbigContainer}
            className={`vbig-container${showLogin ? " login-active" : ""}`}
          >
            <span style={styles.vbigLetter}>V</span>
            <span style={styles.vbigLetter}>B</span>
            <span style={styles.vbigLetter}>I</span>
            <span style={styles.vbigLetter}>G</span>
            <a
              href="https://github.com/pradervonsky/vbig-lab"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.githubButton}
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

const styles: Record<string, CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    background: "linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)",
  },
  leftContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "0 80px",
    color: "#fff",
  },
  title: {
    fontSize: "48px",
    fontWeight: 700,
    background: "linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-3px",
  },
  subtitle: {
    fontSize: "20px",
    color: "rgba(255, 255, 255, 0.6)",
    margin: "0 0 20px 0",
    maxWidth: "720px",
    lineHeight: "1.5",
  },
  startButton: {
    background: "linear-gradient(135deg, #3a6ad6 0%, #2a5ac6 100%)",
    color: "#fff",
    padding: "16px 48px",
    fontSize: "20px",
    fontWeight: 600,
    border: "none",
    borderRadius: "12px",
    letterSpacing: "0.5px",
    minWidth: "200px",
  },
  rightContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #1e1e1e 0%, #1a1a1a 100%)",
  },
  vbigContainer: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    gap: "20px",
  },
  vbigLetter: {
    fontSize: "180px",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "10px",
  },
  githubButton: {
    position: "absolute",
    top: "40px",
    right: "-10px",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgb(255, 255, 255)",
    borderRadius: "8px",
    textDecoration: "none",
    backdropFilter: "blur(10px)",
  },
};
