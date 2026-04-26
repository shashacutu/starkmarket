import confetti from "canvas-confetti";

export const triggerClickEffect = (e: React.MouseEvent) => {
  const x = e.clientX / window.innerWidth;
  const y = e.clientY / window.innerHeight;
  
  confetti({
    particleCount: 15,
    spread: 70,
    origin: { x, y },
    colors: ["#ffffff", "#cccccc", "#666666"],
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
    colors: ["#ffffff", "#cccccc", "#333333"],
  });
};
