"use client";

import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";

export function LandingPage({ onStart }: { onStart: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [waveIntensity, setWaveIntensity] = useState(1);
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
          background: #3a69d6ab;
          animation: wave1 5s ease-in-out infinite;
        }

        .wave-grey {
          background: #ffffff37;
          animation: wave2 6s ease-in-out infinite;
        }

        .wave-light {
          background: #333333b9;
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
              boxShadow: isLoaded
                ? "0 4px 20px rgba(58, 106, 214, 0.3)"
                : "none",
            }}
            onClick={isLoaded ? onStart : undefined}
            disabled={!isLoaded}
          >
            {isLoaded ? "Start →" : "Loading..."}
          </button>
        </div>

        {/* Right Container */}
        <div ref={containerRef} style={styles.rightContainer}>
          <div style={styles.vbigContainer}>
            <span style={styles.vbigLetter}>V</span>
            <span style={styles.vbigLetter}>B</span>
            <span style={styles.vbigLetter}>I</span>
            <span style={styles.vbigLetter}>G</span>
            <a
              href="https://github.com/pradervonsky/vbig-eval"
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
          <div className="wave wave-light" style={waveStyle3}></div>
          <div className="wave wave-grey" style={waveStyle2}></div>
          <div className="wave wave-blue" style={waveStyle1}></div>
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
    margin: "0 0 40px 0",
    maxWidth: "720px",
    lineHeight: "1.25",
  },
  startButton: {
    background: "linear-gradient(135deg, #3a6ad6 0%, #2a5ac6 100%)",
    color: "#fff",
    padding: "16px 48px",
    fontSize: "20px",
    fontWeight: 600,
    border: "none",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(58, 106, 214, 0.3)",
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
    background: "linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 100%)",
  },
  vbigContainer: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    gap: "20px",
  },
  vbigLetter: {
    fontSize: "140px",
    fontWeight: 900,
    color: "#fff",
    letterSpacing: "10px",
  },
  githubButton: {
    position: "absolute",
    top: "24px",
    right: "-10px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgb(255, 255, 255)",
    borderRadius: "8px",
    textDecoration: "none",
    backdropFilter: "blur(10px)",
  },
};
