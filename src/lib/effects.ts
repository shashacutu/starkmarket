import confetti from "canvas-confetti";

export const triggerClickEffect = (e: React.MouseEvent) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  confetti({
    particleCount: 15,
    spread: 70,
    origin: { x, y },
    colors: ["#6366f1", "#06b6d4", "#ffffff"],
    shapes: ["circle"],
    ticks: 50,
    gravity: 1.2,
    scalar: 0.7,
    startVelocity: 20
  });
};

export const triggerSuccessBurst = () => {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#6366f1", "#06b6d4", "#ffffff"],
  });
};
