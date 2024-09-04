import React, { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.15;
const JUMP_STRENGTH = -5;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const PIPE_SPEED = 1.8;
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
    
    // Draw kite string with a slight curve
    ctx.strokeStyle = '#F5F4FF';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    const controlPoint1 = { x: x - 50, y: y + 50 };
    const controlPoint2 = { x: x - 100, y: y + 150 };
    const endPoint = { x: x - 150, y: y + 200 };
    
    ctx.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);
    ctx.stroke();

    // Draw bows/tails
    const bowColors = ['#FF69B4', '#FFD700', '#00CED1', '#FF6347'];
    stringPointsRef.current.forEach((point, index) => {
      if (index % 4 === 0 && index !== 0) {
        const bowSize = 6 - (index / 4);
        const bowColor = bowColors[index % bowColors.length];
        
        ctx.save();
        ctx.translate(x + point.x, y + point.y);
        ctx.rotate(Math.atan2(point.y - stringPointsRef.current[index-1].y, point.x - stringPointsRef.current[index-1].x));
        
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

    // Draw kite body with shadow
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation + 45) * Math.PI / 180);
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Main kite body
    const gradient = ctx.createLinearGradient(-30, -20, 30, 20);
    gradient.addColorStop(0, '#30f2a2');
    gradient.addColorStop(1, '#14cc80');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(30, -20);
    ctx.lineTo(-5, -15);
    ctx.lineTo(-30, 20);
    ctx.lineTo(5, 15);
    ctx.closePath();
    ctx.fill();

    // Remove shadow for details
    ctx.shadowColor = 'transparent';

    // Kite details
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, -20);
    ctx.lineTo(-30, 20);
    ctx.moveTo(-5, -15);
    ctx.lineTo(5, 15);
    ctx.stroke();

    // Kite bow tie
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#E0F6FF');
    gradient.addColorStop(1, '#FFF0F5');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sun
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH - 100, 100, 40, 0, Math.PI * 2);
    ctx.fill();

    // Hills
    const hillGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 100, 0, CANVAS_HEIGHT);
    hillGradient.addColorStop(0, '#14cc80');
    hillGradient.addColorStop(1, '#0f9b61');
    ctx.fillStyle = hillGradient;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let i = 0; i <= CANVAS_WIDTH; i += 30) {
      ctx.lineTo(i, CANVAS_HEIGHT - Math.sin(i * 0.02 + backgroundOffsetRef.current) * 40 - 20);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fill();

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    cloudsRef.current.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, 25, 0, Math.PI * 2);
      ctx.arc(cloud.x + 25, cloud.y - 10, 25, 0, Math.PI * 2);
      ctx.arc(cloud.x + 50, cloud.y, 25, 0, Math.PI * 2);
      ctx.fill();
    });
  }, []);

  const drawPipes = useCallback((ctx) => {
    pipesRef.current.forEach(pipe => {
      let pipeColor;
      if (pipe.passed) {
        pipeColor = '#30f2a2';
      } else if (CANVAS_WIDTH - pipe.x > CANVAS_WIDTH * 0.1) {
        pipeColor = '#FFA500';
      } else {
        pipeColor = '#808080';
      }

      // Pipe shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 0;

      // Draw main pipe body with gradient
      const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      gradient.addColorStop(0, pipeColor);
      gradient.addColorStop(1, shadeColor(pipeColor, -20));
      ctx.fillStyle = gradient;
      
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapStart);
      ctx.fillRect(pipe.x, pipe.gapStart + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapStart - PIPE_GAP);
      
      // Remove shadow for cap
      ctx.shadowColor = 'transparent';

      // Pipe cap
      const capColor = shadeColor(pipeColor, -30);
      ctx.fillStyle = capColor;
      ctx.fillRect(pipe.x - 5, pipe.gapStart - 20, PIPE_WIDTH + 10, 20);
      ctx.fillRect(pipe.x - 5, pipe.gapStart + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });
  }, []);

  // Helper function to shade colors
  const shadeColor = (color, percent) => {
    const num = parseInt(color.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
  };

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

  const drawGameStateScreen = useCallback((ctx, state) => {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Create a rounded rectangle for the message box
    const boxWidth = 500;
    const boxHeight = 400;
    const boxX = (CANVAS_WIDTH - boxWidth) / 2;
    const boxY = (CANVAS_HEIGHT - boxHeight) / 2;

    // Box shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    // Message box
    ctx.fillStyle = '#E0F6FF';
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    ctx.textAlign = 'center';
    
    // Game title (green)
    ctx.fillStyle = '#14cc80';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('Build Flight', CANVAS_WIDTH / 2, boxY + 120);

    // Other text (dark)
    ctx.fillStyle = '#333333';
    
    if (state === 'welcome') {
      ctx.font = '30px Arial';
      ctx.fillText('Click or press Space to start', CANVAS_WIDTH / 2, boxY + 250);
    } else {
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`Final Score: ${scoreRef.current}`, CANVAS_WIDTH / 2, boxY + 200);
      
      ctx.font = '30px Arial';
      ctx.fillText(`High Score: ${highScoreRef.current}`, CANVAS_WIDTH / 2, boxY + 250);
      
      ctx.font = '24px Arial';
      ctx.fillText('Click or press Space to play again', CANVAS_WIDTH / 2, boxY + 300);
    }

    // Animate the kite icon with cubic-bezier
    const time = Date.now() / 500; // Faster animation
    const t = (Math.sin(time) + 1) / 2; // Normalize to 0-1
    const yOffset = cubicBezier(0, 0.5, 0.5, 1, t) * 20 - 10; // Range: -10 to 10
    
    ctx.save();
    ctx.translate(CANVAS_WIDTH / 2, boxY + 50 + yOffset);
    ctx.rotate(30 * Math.PI / 180); // 30 degree angle
    drawCuteKite(ctx, 0, 0, 30); // Smaller kite (size 30 instead of 50)
    ctx.restore();
  }, []);

  // Add this cubic-bezier function outside of the component
  function cubicBezier(p0, p1, p2, p3, t) {
    const ct = 1 - t;
    return ct * ct * ct * p0 + 3 * ct * ct * t * p1 + 3 * ct * t * t * p2 + t * t * t * p3;
  }

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
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
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);

    // Draw game state screens
    if (gameStateRef.current === 'welcome') {
      drawGameStateScreen(ctx, 'welcome');
    } else if (gameStateRef.current === 'gameOver') {
      drawGameStateScreen(ctx, 'gameOver');
    }

    requestAnimationFrame(gameLoop);
  }, [checkCollisions, drawBackground, drawKite, drawPipes, drawGameStateScreen, updateStringPhysics]);

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameLoop]);

  // Helper function to draw rounded rectangles
  function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
  }

  // Function to draw a cute kite icon
  function drawCuteKite(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Kite body
    ctx.fillStyle = '#30f2a2';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();

    // Kite details
    ctx.strokeStyle = '#14cc80';
    ctx.lineWidth = size / 10;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();

    // Kite tail
    ctx.strokeStyle = '#F5F4FF';
    ctx.lineWidth = size / 15;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.quadraticCurveTo(size/2, size*1.5, -size/2, size*2);
    ctx.stroke();

    // Bow
    ctx.fillStyle = '#14cc80';
    ctx.beginPath();
    ctx.arc(0, 0, size/8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

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