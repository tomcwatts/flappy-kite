import React, { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.15;
const JUMP_STRENGTH = -5;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const PIPE_SPEED = 1.5;
const STRING_SEGMENTS = 15;
const SEGMENT_LENGTH = 4;

const FlappyKite = () => {
  const canvasRef = useRef(null);
  const gameStateRef = useRef('welcome');
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);
  const kiteRef = useRef({ x: 100, y: 300, velocity: 0, rotation: 0 });
  const pipesRef = useRef([]);
  const cloudsRef = useRef([]);
  const backgroundOffsetRef = useRef(0);
  const stringPointsRef = useRef([]);
  const prevKitePositionRef = useRef({ x: 100, y: 300 });

  const [, forceUpdate] = useState({});

  const jump = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      kiteRef.current.velocity = JUMP_STRENGTH;
    } else if (gameStateRef.current === 'welcome' || gameStateRef.current === 'gameOver') {
      startGame();
    }
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current = 'playing';
    scoreRef.current = 0;
    kiteRef.current = { x: 100, y: 300, velocity: 0, rotation: 0 };
    prevKitePositionRef.current = { x: 100, y: 300 };
    pipesRef.current = [];
    cloudsRef.current = Array(5).fill().map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT / 2,
      speed: Math.random() * 0.5 + 0.1
    }));
    stringPointsRef.current = Array(STRING_SEGMENTS).fill().map((_, i) => ({ 
      x: -i * SEGMENT_LENGTH, 
      y: i * SEGMENT_LENGTH * 0.45,
      oldX: -i * SEGMENT_LENGTH, 
      oldY: i * SEGMENT_LENGTH * 0.45 
    }));
    forceUpdate({});
  }, []);

  const checkCollisions = useCallback(() => {
    const kite = kiteRef.current;
    const pipes = pipesRef.current;

    if (kite.y < 0 || kite.y > CANVAS_HEIGHT) {
      return true;
    }

    return pipes.some(pipe => {
      const inXRange = kite.x + 30 > pipe.x && kite.x - 40 < pipe.x + PIPE_WIDTH;
      const inYRange = kite.y - 30 < pipe.gapStart || kite.y + 30 > pipe.gapStart + PIPE_GAP;
      return inXRange && inYRange;
    });
  }, []);

  const drawKite = useCallback((ctx) => {
    const { x, y, rotation } = kiteRef.current;
    
    // Draw kite string first (behind the kite)
    ctx.strokeStyle = '#F5F4FF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Draw string
    stringPointsRef.current.forEach((point) => {
      ctx.lineTo(x + point.x, y + point.y);
    });
    ctx.stroke();

    // Draw bows/tails
    stringPointsRef.current.forEach((point, index) => {
      // Add bows/tails at every 4th point
      if (index % 4 === 0 && index !== 0) {
        const bowSize = 8 - (index / 4); // Decreasing size for farther bows
        const bowColor = '#14cc80'; // Purple color for all bows/tails
        
        ctx.save();
        ctx.translate(x + point.x, y + point.y);
        ctx.rotate(Math.atan2(point.y - stringPointsRef.current[index-1].y, point.x - stringPointsRef.current[index-1].x));
        
        // Draw bow/tail
        ctx.fillStyle = bowColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-bowSize, -bowSize/2);
        ctx.lineTo(-bowSize*1.5, 0);
        ctx.lineTo(-bowSize, bowSize/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      }
    });

    // Draw kite body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation + 45) * Math.PI / 180);
    
    // Main kite body
    ctx.fillStyle = '#30f2a2';
    ctx.beginPath();
    ctx.moveTo(30, -20);  // Top point
    ctx.lineTo(-5, -15);  // Left point
    ctx.lineTo(-30, 20);  // Bottom point
    ctx.lineTo(5, 15);    // Right point
    ctx.closePath();
    ctx.fill();

    // Kite details
    ctx.strokeStyle = '#14cc80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, -20);
    ctx.lineTo(-30, 20);
    ctx.moveTo(-5, -15);
    ctx.lineTo(5, 15);
    ctx.stroke();

    // Kite bow tie
    ctx.fillStyle = '#14cc80';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Hills
    ctx.fillStyle = '#14cc80';
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
      ctx.lineTo(i, CANVAS_HEIGHT - Math.sin(i * 0.01 + backgroundOffsetRef.current) * 50 - 20);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cloudsRef.current.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
      ctx.arc(cloud.x + 15, cloud.y - 10, 15, 0, Math.PI * 2);
      ctx.arc(cloud.x + 35, cloud.y, 20, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawPipes = useCallback((ctx) => {
    pipesRef.current.forEach(pipe => {
      // Determine pipe color based on its position and passed status
      let pipeColor;
      if (pipe.passed) {
        pipeColor = '#30f2a2'; // Green if passed
      } else {
        pipeColor = '#FFA500'; // Orange if 10% into the viewport
      }

      // Draw main pipe body
      ctx.fillStyle = pipeColor;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapStart);
      ctx.fillRect(pipe.x, pipe.gapStart + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapStart - PIPE_GAP);
      
      // Pipe cap (slightly darker shade)
      ctx.fillStyle = pipeColor === '#30f2a2' ? '#14cc80' : 
                      pipeColor === '#FFA500' ? '#FF8C00' : 
                      '#606060';
      ctx.fillRect(pipe.x - 5, pipe.gapStart - 20, PIPE_WIDTH + 10, 20);
      ctx.fillRect(pipe.x - 5, pipe.gapStart + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });
  }, []);

  const updateStringPhysics = useCallback(() => {
    const points = stringPointsRef.current;
    const time = Date.now() * 0.001;
    const windEffect = Math.sin(time * 0.5) * 3 + Math.cos(time * 0.7) * 2;
    const kiteVelocity = kiteRef.current.velocity;
    const kiteMovement = kiteRef.current.x - prevKitePositionRef.current.x;

    // Apply forces
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const vx = (point.x - point.oldX) * 0.98;
      const vy = (point.y - point.oldY) * 0.98;

      point.oldX = point.x;
      point.oldY = point.y;

      // Adjust position based on kite movement
      point.x += kiteMovement;
      point.y += kiteVelocity * 0.03;

      point.x += vx;
      point.y += vy + 0.25;

      // Backward force
      const backwardForce = 0.9 + (Math.abs(kiteVelocity) * 0.04);
      point.x -= backwardForce * (i / points.length);

      // Slightly increase downward angle
      point.y += i * 0.025;

      // Dynamic wave effect
      const waveAmplitude = 0.25 * (i / points.length);
      const waveFrequencyX = 0.8;
      const waveFrequencyY = 0.6;
      const phaseShift = i * 0.2;
      point.x += Math.sin(time * waveFrequencyX + phaseShift) * waveAmplitude;
      point.y += Math.cos(time * waveFrequencyY + phaseShift) * waveAmplitude * 0.4;

      // Add some noise for more natural movement
      point.x += (Math.random() - 0.5) * 0.1;
      point.y += (Math.random() - 0.5) * 0.1;

      // Wind effect
      point.x += windEffect * (i / points.length) * 0.02;
      point.y += windEffect * (i / points.length) * 0.015;

      // Limit upward movement
      point.y = Math.max(point.y, -i * 0.5);

      // Limit forward movement
      point.x = Math.min(point.x, 0);
    }

    // Constrain string length
    for (let i = 0; i < 5; i++) {
      constrainPoints();
    }

    // Keep first point attached to kite
    points[0].x = 0;
    points[0].y = 0;
  }, []);

  const constrainPoints = useCallback(() => {
    const points = stringPointsRef.current;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const difference = SEGMENT_LENGTH - distance;
      const percent = difference / distance / 2;
      const offsetX = dx * percent * 0.5;
      const offsetY = dy * percent * 0.5;

      if (i > 0) {
        p1.x -= offsetX;
        p1.y -= offsetY;
      }
      p2.x += offsetX;
      p2.y += offsetY;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const gameLoop = () => {
      if (gameStateRef.current === 'playing') {
        const prevKiteX = kiteRef.current.x;
        const prevKiteY = kiteRef.current.y;
        
        // Update game state
        kiteRef.current.y += kiteRef.current.velocity;
        kiteRef.current.velocity += GRAVITY;

        // Update kite rotation (increased angle deviation)
        const targetRotation = kiteRef.current.velocity * 4;
        kiteRef.current.rotation += (targetRotation - kiteRef.current.rotation) * 0.2;
        kiteRef.current.rotation = Math.max(-45, Math.min(45, kiteRef.current.rotation));

        // Update string physics
        updateStringPhysics();

        // Update previous kite position
        prevKitePositionRef.current = { x: prevKiteX, y: prevKiteY };

        pipesRef.current = pipesRef.current
          .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
          .filter(pipe => pipe.x + PIPE_WIDTH > 0);

        if (pipesRef.current.length === 0 || pipesRef.current[pipesRef.current.length - 1].x < CANVAS_WIDTH - 350) {
          const gapStart = Math.random() * (CANVAS_HEIGHT - PIPE_GAP - 200) + 100;
          pipesRef.current.push({ x: CANVAS_WIDTH, gapStart, passed: false });
        }

        // Update clouds
        cloudsRef.current = cloudsRef.current.map(cloud => ({
          ...cloud,
          x: (cloud.x - cloud.speed + CANVAS_WIDTH) % CANVAS_WIDTH
        }));

        // Update background
        backgroundOffsetRef.current += 0.02;

        // Check for collisions
        if (checkCollisions()) {
          gameStateRef.current = 'gameOver';
          highScoreRef.current = Math.max(highScoreRef.current, scoreRef.current);
        }

        // Update score
        const passedPipe = pipesRef.current.find(pipe => pipe.x + PIPE_WIDTH < kiteRef.current.x && !pipe.passed);
        if (passedPipe) {
          scoreRef.current += 1;
          passedPipe.passed = true;
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw game elements
      drawBackground(ctx);
      drawPipes(ctx);
      drawKite(ctx);

      // Draw score
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Score: ${scoreRef.current}`, 10, 30);

      // Draw game state messages
      if (gameStateRef.current === 'welcome') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('Flappy Kite', CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText('Click or press Space to start', CANVAS_WIDTH / 2 - 120, CANVAS_HEIGHT / 2 + 40);
      } else if (gameStateRef.current === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('Game Over', CANVAS_WIDTH / 2 - 70, CANVAS_HEIGHT / 2 - 40);
        ctx.font = '24px Arial';
        ctx.fillText(`Final Score: ${scoreRef.current}`, CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 + 40);
        ctx.fillText(`High Score: ${highScoreRef.current}`, CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 + 80);
        ctx.fillText('Click or press Space to play again', CANVAS_WIDTH / 2 - 140, CANVAS_HEIGHT / 2 + 120);
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [checkCollisions, drawBackground, drawKite, drawPipes, updateStringPhysics]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [jump]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#87CEEB' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        style={{ border: '2px solid black', borderRadius: '10px' }}
      />
    </div>
  );
};

export default FlappyKite;