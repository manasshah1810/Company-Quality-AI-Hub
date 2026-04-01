import { useEffect, useState } from "react";

export function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    delay: number;
    duration: number;
  }>>([]);

  useEffect(() => {
    // Generate random confetti particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 3 + Math.random() * 1,
    }));
    setParticles(newParticles);

    // Clean up after animation
    const timer = setTimeout(() => setParticles([]), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 animate-confetti"
          style={{
            left: `${particle.left}%`,
            top: "-10px",
            backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][Math.floor(Math.random() * 5)],
            animation: `confetti-fall ${particle.duration}s ease-in forwards`,
            animationDelay: `${particle.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translate(-50%, 0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 100vh) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
