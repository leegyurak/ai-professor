import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  animationDelay: string;
  backgroundColor: string;
}

export function Confetti() {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

    const newPieces: ConfettiPiece[] = [];
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        animationDelay: `${Math.random() * 3}s`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setPieces(newPieces);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {pieces.map(piece => (
        <div
          key={piece.id}
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            backgroundColor: piece.backgroundColor,
            left: `${piece.left}%`,
            top: '-10px',
            opacity: 0.8,
            animation: `confettiFall 3s linear ${piece.animationDelay} forwards`,
            transform: 'rotate(45deg)'
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
