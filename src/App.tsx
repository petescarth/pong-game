import { useEffect, useRef, useState, useCallback } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Ball extends GameObject {
  velocityX: number;
  velocityY: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 15;
const PADDLE_SPEED = 8;
const INITIAL_BALL_SPEED = 5;

function App() {
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leftPaddleRef = useRef<GameObject>({ x: 30, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT });
  const rightPaddleRef = useRef<GameObject>({ x: CANVAS_WIDTH - 30 - PADDLE_WIDTH, y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2, width: PADDLE_WIDTH, height: PADDLE_HEIGHT });
  const ballRef = useRef<Ball>({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, width: BALL_SIZE, height: BALL_SIZE, velocityX: INITIAL_BALL_SPEED, velocityY: INITIAL_BALL_SPEED });
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number>();

  const isPausedRef = useRef(isPaused);
  const winnerRef = useRef(winner);
  const gameStartedRef = useRef(gameStarted);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  useEffect(() => {
    gameStartedRef.current = gameStarted;
  }, [gameStarted]);

  const resetBall = useCallback((direction: 'left' | 'right') => {
    ballRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      width: BALL_SIZE,
      height: BALL_SIZE,
      velocityX: (direction === 'left' ? -1 : 1) * INITIAL_BALL_SPEED,
      velocityY: (Math.random() - 0.5) * INITIAL_BALL_SPEED,
    };
  }, []);

  const checkCollision = (ball: Ball, paddle: GameObject): boolean => {
    return (
      ball.x < paddle.x + paddle.width &&
      ball.x + ball.width > paddle.x &&
      ball.y < paddle.y + paddle.height &&
      ball.y + ball.height > paddle.y
    );
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([20, 10]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    const leftPaddle = leftPaddleRef.current;
    const rightPaddle = rightPaddleRef.current;
    const ball = ballRef.current;

    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillRect(ball.x, ball.y, ball.width, ball.height);

    ctx.shadowBlur = 0;
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameStartedRef.current || isPausedRef.current || winnerRef.current) {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx && gameStartedRef.current && !winnerRef.current) {
        draw(ctx);
      }
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const ball = ballRef.current;
    const leftPaddle = leftPaddleRef.current;
    const rightPaddle = rightPaddleRef.current;

    if (keysPressed.current.has('a') && leftPaddle.y > 0) {
      leftPaddle.y -= PADDLE_SPEED;
    }
    if (keysPressed.current.has('z') && leftPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      leftPaddle.y += PADDLE_SPEED;
    }
    if (keysPressed.current.has('l') && rightPaddle.y > 0) {
      rightPaddle.y -= PADDLE_SPEED;
    }
    if (keysPressed.current.has('m') && rightPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      rightPaddle.y += PADDLE_SPEED;
    }

    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    if (ball.y <= 0 || ball.y + ball.height >= CANVAS_HEIGHT) {
      ball.velocityY *= -1;
    }

    if (checkCollision(ball, leftPaddle)) {
      const hitPos = (ball.y + ball.height / 2 - leftPaddle.y) / PADDLE_HEIGHT;
      ball.velocityY = (hitPos - 0.5) * 10;
      ball.velocityX = Math.abs(ball.velocityX) * 1.05;
      ball.x = leftPaddle.x + leftPaddle.width;
    }

    if (checkCollision(ball, rightPaddle)) {
      const hitPos = (ball.y + ball.height / 2 - rightPaddle.y) / PADDLE_HEIGHT;
      ball.velocityY = (hitPos - 0.5) * 10;
      ball.velocityX = -Math.abs(ball.velocityX) * 1.05;
      ball.x = rightPaddle.x - ball.width;
    }

    if (ball.x < 0) {
      setRightScore((prev) => {
        const newScore = prev + 1;
        if (newScore >= 11) {
          setWinner('Right Player');
        }
        return newScore;
      });
      resetBall('right');
    }

    if (ball.x > CANVAS_WIDTH) {
      setLeftScore((prev) => {
        const newScore = prev + 1;
        if (newScore >= 11) {
          setWinner('Left Player');
        }
        return newScore;
      });
      resetBall('left');
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      draw(ctx);
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [draw, resetBall]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['a', 'z', 'l', 'm'].includes(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
      }
      if (key === ' ') {
        e.preventDefault();
        if (gameStartedRef.current && !winnerRef.current) {
          setIsPaused((prev) => !prev);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  const startGame = () => {
    setGameStarted(true);
    setIsPaused(false);
    setWinner(null);
    setLeftScore(0);
    setRightScore(0);
    resetBall(Math.random() > 0.5 ? 'left' : 'right');
    leftPaddleRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    rightPaddleRef.current.y = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  };

  const restartGame = () => {
    startGame();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)',
      }}></div>

      <div className="relative z-10 text-center mb-8">
        <h1 className="text-6xl font-bold mb-2 tracking-wider" style={{ textShadow: '0 0 20px #fff' }}>
          PONG
        </h1>
        <div className="flex gap-16 justify-center items-center mt-6">
          <div className="text-center">
            <div className="text-sm opacity-60 mb-1">LEFT PLAYER</div>
            <div className="text-7xl font-bold" style={{ textShadow: '0 0 30px #fff' }}>
              {leftScore}
            </div>
          </div>
          <div className="text-4xl opacity-40">-</div>
          <div className="text-center">
            <div className="text-sm opacity-60 mb-1">RIGHT PLAYER</div>
            <div className="text-7xl font-bold" style={{ textShadow: '0 0 30px #fff' }}>
              {rightScore}
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative border-4 border-white shadow-2xl"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          boxShadow: '0 0 40px rgba(255, 255, 255, 0.3)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />

        {!gameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
            <button
              onClick={startGame}
              className="px-8 py-4 text-2xl border-4 border-white hover:bg-white hover:text-black transition-all mb-8"
              style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
            >
              START GAME
            </button>
            <div className="text-center space-y-4 text-lg">
              <div className="opacity-80">
                <span className="font-bold">LEFT PLAYER:</span> A (Up) / Z (Down)
              </div>
              <div className="opacity-80">
                <span className="font-bold">RIGHT PLAYER:</span> L (Up) / M (Down)
              </div>
              <div className="opacity-60 text-sm mt-6">
                Press SPACE to pause | First to 11 wins
              </div>
            </div>
          </div>
        )}

        {isPaused && !winner && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80">
            <div className="text-5xl font-bold animate-pulse" style={{ textShadow: '0 0 20px #fff' }}>
              PAUSED
            </div>
          </div>
        )}

        {winner && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90">
            <div className="text-6xl font-bold mb-8 animate-pulse" style={{ textShadow: '0 0 30px #fff' }}>
              {winner} WINS!
            </div>
            <div className="text-3xl mb-8 opacity-80">
              {leftScore} - {rightScore}
            </div>
            <button
              onClick={restartGame}
              className="px-8 py-4 text-2xl border-4 border-white hover:bg-white hover:text-black transition-all"
              style={{ boxShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm opacity-50 text-center">
        {gameStarted && !winner && (
          <div>Press SPACE to {isPaused ? 'resume' : 'pause'}</div>
        )}
      </div>
    </div>
  );
}

export default App;
