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
  // Color variables
  const SKY_COLOR = '#7FDBFF';
  const SUN_COLOR = '#FFD700';
  const HILL_COLOR = '#00B368';
  const CLOUD_COLOR = '#FFFFFF';
  const KITE_LIGHT_GREEN = '#4B19D5';
  const KITE_DARK_GREEN = '#4B19D5';
  const KITE_BODY_COLOR = '#14CC80';
  const KITE_DETAIL_COLOR = '#A195EF';
  const KITE_STRING_COLOR = 'rgba(255, 255, 255, 0.6)';
  const KITE_BOW_COLOR = '#4B19D5';
  const PIPE_COLOR = '#F83F23';
  const PIPE_PASSED_COLOR = '#00BE13';
  const GAME_SCREEN_BLUE = '#4B19D5';
  const GAME_SCREEN_TEXT_COLOR = '#00ff86';

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

    // Check if kite is out of bounds
    if (kite.y < 0 || kite.y > CANVAS_HEIGHT) {
      return true;
    }

    // Define kite corners (diamond shape)
    const kiteSize = 30;
    const kiteCorners = [
      { x: kiteSize, y: 0 },
      { x: 0, y: kiteSize },
      { x: -kiteSize, y: 0 },
      { x: 0, y: -kiteSize }
    ];

    // Rotate kite corners
    const rotatedCorners = kiteCorners.map(corner => {
      const rotatedX = corner.x * Math.cos(kite.rotation * Math.PI / 180) - corner.y * Math.sin(kite.rotation * Math.PI / 180);
      const rotatedY = corner.x * Math.sin(kite.rotation * Math.PI / 180) + corner.y * Math.cos(kite.rotation * Math.PI / 180);
      return { x: kite.x + rotatedX, y: kite.y + rotatedY };
    });

    // Check collision with pipes and update passed status
    return pipes.some(pipe => {
      // Update passed status when the front of the kite aligns with the start of the pipe
      if (!pipe.passed && kite.x >= pipe.x) {
        pipe.passed = true;
        scoreRef.current += 1;
      }

      // Check if any corner is inside the pipe
      return rotatedCorners.some(corner => {
        const inXRange = corner.x > pipe.x && corner.x < pipe.x + PIPE_WIDTH;
        const inYRange = corner.y < pipe.gapStart || corner.y > pipe.gapStart + PIPE_GAP;
        return inXRange && inYRange;
      });
    });
  }, []);

  const drawKite = useCallback((ctx) => {
    const { x, y, rotation } = kiteRef.current;
    
    // Draw string connecting bows/tails
    ctx.strokeStyle = KITE_STRING_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    stringPointsRef.current.forEach((point) => {
      ctx.lineTo(x + point.x, y + point.y);
    });
    ctx.stroke();

    // Draw bows/tails
    stringPointsRef.current.forEach((point, index) => {
      if (index % 4 === 0 && index !== 0) {
        const bowSize = 6 - (index / 4);
        
        ctx.save();
        ctx.translate(x + point.x, y + point.y);
        ctx.rotate(Math.atan2(point.y - stringPointsRef.current[index-1].y, point.x - stringPointsRef.current[index-1].x));
        
        ctx.fillStyle = KITE_BOW_COLOR;
        ctx.fillRect(-bowSize, -bowSize/2, bowSize*1.5, bowSize);
        
        ctx.restore();
      }
    });

    // Draw kite body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation + 45) * Math.PI / 180);

    // Main kite body with different colored quadrants
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(30, -20);
    ctx.lineTo(0, -15);
    ctx.closePath();
    ctx.fillStyle = KITE_LIGHT_GREEN;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -15);
    ctx.lineTo(-30, 20);
    ctx.closePath();
    ctx.fillStyle = KITE_DARK_GREEN;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-30, 20);
    ctx.lineTo(0, 15);
    ctx.closePath();
    ctx.fillStyle = KITE_LIGHT_GREEN;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 15);
    ctx.lineTo(30, -20);
    ctx.closePath();
    ctx.fillStyle = KITE_DARK_GREEN;
    ctx.fill();

    // Kite outline
    ctx.strokeStyle = KITE_DETAIL_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, -20);
    ctx.lineTo(-30, 20);
    ctx.lineTo(30, -20);
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();

    // Kite center
    ctx.fillStyle = '#14e984';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  const drawBackground = useCallback((ctx) => {
    // Sky
    ctx.fillStyle = SKY_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sun
    ctx.fillStyle = SUN_COLOR;
    ctx.fillRect(CANVAS_WIDTH - 120, 80, 40, 40);

    // Smooth hills
    ctx.fillStyle = HILL_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x++) {
      const height = Math.sin(x * 0.02 + backgroundOffsetRef.current) * 40 + 60;
      ctx.lineTo(x, CANVAS_HEIGHT - height);
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Clouds
    ctx.fillStyle = CLOUD_COLOR;
    cloudsRef.current.forEach(cloud => {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(cloud.x + i * 20, cloud.y, 30, 20);
      }
      ctx.fillRect(cloud.x + 10, cloud.y - 10, 30, 10);
    });
  }, []);

  const drawPipes = useCallback((ctx) => {
    pipesRef.current.forEach(pipe => {
      const pipeColor = pipe.passed ? PIPE_PASSED_COLOR : PIPE_COLOR;

      // Draw main pipe body
      ctx.fillStyle = pipeColor;
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapStart);
      ctx.fillRect(pipe.x, pipe.gapStart + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapStart - PIPE_GAP);
      
      // Pipe cap
      ctx.fillStyle = shadeColor(pipeColor, -30);
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

    // Create a pixelated border for the message box
    const boxWidth = 500;
    const boxHeight = 400;
    const boxX = (CANVAS_WIDTH - boxWidth) / 2;
    const boxY = (CANVAS_HEIGHT - boxHeight) / 2;

    // Pixelated border
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(boxX - 10, boxY - 10, boxWidth + 20, boxHeight + 20);
    ctx.fillStyle = '#000000';
    ctx.fillRect(boxX - 5, boxY - 5, boxWidth + 10, boxHeight + 10);
    ctx.fillStyle = GAME_SCREEN_BLUE;
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Game title (yellow with "shadow")
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 62px "Press Start 2P", cursive';
    ctx.fillText('KITEY FLIGHT', CANVAS_WIDTH / 2 + 4, boxY + 104);
    ctx.fillStyle = GAME_SCREEN_TEXT_COLOR;
    ctx.font = 'bold 60px "Press Start 2P", cursive';
    ctx.fillText('KITEY FLIGHT', CANVAS_WIDTH / 2, boxY + 100);

    // Other text (white)
    ctx.fillStyle = '#FFFFFF';
    
    if (state === 'welcome') {
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText('PRESS SPACE', CANVAS_WIDTH / 2, boxY + 250);
      ctx.fillText('TO START', CANVAS_WIDTH / 2, boxY + 280);
    } else {
      ctx.font = 'bold 24px "Press Start 2P", cursive';
      ctx.fillText(`SCORE: ${scoreRef.current}`, CANVAS_WIDTH / 2, boxY + 200);
      
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText(`HI-SCORE: ${highScoreRef.current}`, CANVAS_WIDTH / 2, boxY + 250);
      
      ctx.font = '16px "Press Start 2P", cursive';
      ctx.fillText('PRESS SPACE', CANVAS_WIDTH / 2, boxY + 320);
      ctx.fillText('TO PLAY AGAIN', CANVAS_WIDTH / 2, boxY + 350);
    }

    // Animate the kite icons with a simple up-down motion
    const time = Date.now() / 300;
    const yOffset = Math.sin(time) * 10;
    
    // Left kite
    ctx.save();
    ctx.translate(boxX + 100, boxY + 320 + yOffset);
    drawRetroKite(ctx, 0, 0, 20);
    ctx.restore();

    // Right kite
    ctx.save();
    ctx.translate(boxX + boxWidth - 100, boxY + 320 + yOffset);
    drawRetroKite(ctx, 0, 0, 20);
    ctx.restore();
  }, []);

  // New function to draw a retro-style kite
  function drawRetroKite(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Kite body (pixelated diamond shape)
    ctx.fillStyle = GAME_SCREEN_TEXT_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();

    // Kite details (pixelated cross)
    ctx.fillStyle = '#000000';
    ctx.fillRect(-size/2, -2, size, 4);
    ctx.fillRect(-2, -size/2, 4, size);

    // Kite tail (pixelated)
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-4, size + i * 8, 8, 4);
    }

    ctx.restore();
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
    }

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw game elements
    drawBackground(ctx);
    drawPipes(ctx);
    drawKite(ctx);

    // Draw score (pixelated font)
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${scoreRef.current}`, 20, 40);

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
    ctx.fillStyle = '#14cc80';
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
    ctx.strokeStyle = '#ffffff';
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

  // Add this to your component's return statement
  useEffect(() => {
    // Load the "Press Start 2P" font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#87CEEB' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        style={{
          border: '4px solid #000000',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export default FlappyKite;