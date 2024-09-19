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

const FlappyKite = ({ buildStatus }) => {
  // Color variables
  const SKY_COLOR = '#7FDBFF';
  const SUN_COLOR = '#FFD700';
  const HILL_COLOR = '#00B368';
  const CLOUD_COLOR = '#FFFFFF';
  const KITE_LIGHT_GREEN = '#4B19D5';
  const KITE_DARK_GREEN = '#4B19D5';
  const KITE_BODY_COLOR = '#4B19D5';
  const KITE_DETAIL_COLOR = '#04e186';
  const KITE_STRING_COLOR = 'rgb(75 25 213 / 90%)';
  const KITE_BOW_COLOR = '#07ff85';
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
  const [canRestart, setCanRestart] = useState(true);

  // Modify these constants for the ribbon
  const RIBBON_SEGMENTS = 20;
  const RIBBON_WIDTH = 15;
  const RIBBON_LENGTH = 80;
  const RIBBON_STIFFNESS = 0.3;
  const RIBBON_DAMPING = 0.8;

  const endGame = useCallback(() => {
    gameStateRef.current = 'gameOver';
    highScoreRef.current = Math.max(highScoreRef.current, scoreRef.current);
    setCanRestart(false);
    setTimeout(() => setCanRestart(true), 200); // 200ms delay
  }, []);

  const checkCollisions = useCallback(() => {
    const kite = kiteRef.current;
    const pipes = pipesRef.current;

    // Check if kite is out of bounds
    if (kite.y < 0 || kite.y > CANVAS_HEIGHT) {
      endGame();
      return true;
    }

    // Define kite corners (rotated quadrilateral)
    const kiteSize = 30;
    const kiteCorners = [
      { x: kiteSize * Math.cos(Math.PI / 4), y: kiteSize * Math.sin(Math.PI / 4) },
      { x: kiteSize * Math.cos(3 * Math.PI / 4), y: kiteSize * Math.sin(3 * Math.PI / 4) },
      { x: kiteSize * Math.cos(5 * Math.PI / 4), y: kiteSize * Math.sin(5 * Math.PI / 4) },
      { x: kiteSize * Math.cos(7 * Math.PI / 4), y: kiteSize * Math.sin(7 * Math.PI / 4) }
    ];

    // Rotate kite corners
    const rotatedCorners = kiteCorners.map(corner => {
      const rotatedX = corner.x * Math.cos(kite.rotation * Math.PI / 180) - corner.y * Math.sin(kite.rotation * Math.PI / 180);
      const rotatedY = corner.x * Math.sin(kite.rotation * Math.PI / 180) + corner.y * Math.cos(kite.rotation * Math.PI / 180);
      return { x: kite.x + rotatedX, y: kite.y + rotatedY };
    });

    // Check collision with pipes and update passed status
    const collisionDetected = pipes.some(pipe => {
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

    if (collisionDetected) {
      endGame();
      return true;
    }

    return false;
  }, [endGame]);

  const jump = useCallback(() => {
    if (gameStateRef.current === 'playing') {
      kiteRef.current.velocity = JUMP_STRENGTH;
    } else if (gameStateRef.current === 'welcome' || (gameStateRef.current === 'gameOver' && canRestart)) {
      startGame();
    }
  }, [canRestart]);

  const initializeRibbon = useCallback(() => {
    return Array(RIBBON_SEGMENTS).fill().map((_, i) => ({
      x: 0,
      y: i * (RIBBON_LENGTH / RIBBON_SEGMENTS),
      prevX: 0,
      prevY: i * (RIBBON_LENGTH / RIBBON_SEGMENTS),
      vx: 0,
      vy: 0,
    }));
  }, []);

  const startGame = useCallback(() => {
    gameStateRef.current = 'playing';
    scoreRef.current = 0;
    kiteRef.current = { x: 100, y: 300, velocity: 0, rotation: 0 };
    prevKitePositionRef.current = { x: 100, y: 300 };
    pipesRef.current = [];
    cloudsRef.current = Array(5).fill().map(() => ({
      x: Math.random() * CANVAS_WIDTH * 1.5,  // Spread clouds across 1.5x canvas width
      y: Math.random() * CANVAS_HEIGHT / 2,
      speed: Math.random() * 0.5 + 0.1
    }));
    stringPointsRef.current = initializeRibbon();
    forceUpdate({});
  }, [initializeRibbon]);

  const pixelSize = 4.5; // Adjust this for desired blockiness

  const drawPixelatedRect = useCallback((ctx, x, y, width, height, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(x / pixelSize) * pixelSize,
      Math.floor(y / pixelSize) * pixelSize,
      Math.ceil(width / pixelSize) * pixelSize,
      Math.ceil(height / pixelSize) * pixelSize
    );
  }, []);

  const drawKite = useCallback((ctx) => {
    const { x, y, rotation } = kiteRef.current;
    const points = stringPointsRef.current;

    if (!points || points.length === 0) {
      stringPointsRef.current = initializeRibbon();
      return;
    }
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation + 45) * Math.PI / 180);

    const kiteWidth = 48;
    const kiteHeight = 56;

    // Draw main kite shape (quadrilateral with concave sides)
    const drawConcaveQuad = (ctx, width, height, color) => {
      const controlPointOffset = -0.6; // Keep this value as it's perfect

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      
      // Top right edge (concave)
      ctx.quadraticCurveTo(
        width / 2 * (1 + controlPointOffset), -height / 2 * (1 + controlPointOffset),
        width / 2, 0
      );
      
      // Bottom right edge (concave)
      ctx.quadraticCurveTo(
        width / 2 * (1 + controlPointOffset), height / 2 * (1 + controlPointOffset),
        0, height / 2
      );
      
      // Bottom left edge (concave)
      ctx.quadraticCurveTo(
        -width / 2 * (1 + controlPointOffset), height / 2 * (1 + controlPointOffset),
        -width / 2, 0
      );
      
      // Top left edge (concave)
      ctx.quadraticCurveTo(
        -width / 2 * (1 + controlPointOffset), -height / 2 * (1 + controlPointOffset),
        0, -height / 2
      );

      ctx.closePath();
      ctx.fill();
    };

    // Main kite body
    drawConcaveQuad(ctx, kiteWidth, kiteHeight, KITE_BODY_COLOR);

    // Kite details
    ctx.strokeStyle = KITE_DETAIL_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -kiteHeight / 2);
    ctx.lineTo(0, kiteHeight / 2);
    ctx.moveTo(-kiteWidth / 2, 0);
    ctx.lineTo(kiteWidth / 2, 0);
    ctx.stroke();

    // Kite bow
    const bowSize = 6;
    ctx.fillStyle = KITE_BOW_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, bowSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Calculate the ribbon anchor point (bottom right corner)
    const cornerAngle = Math.PI / 4; // 45 degrees in radians
    const ribbonAnchorX = x + Math.cos((rotation + 5 + 135) * Math.PI / 180) * (kiteWidth / 2 / Math.cos(cornerAngle));
    const ribbonAnchorY = y + Math.sin((rotation + 5 + 135) * Math.PI / 180) * (kiteWidth / 2 / Math.cos(cornerAngle));

    // Draw pixelated ribbon
    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i];
      const nextPoint = points[i + 1];
      
      const dx = nextPoint.x - point.x;
      const dy = nextPoint.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.ceil(distance / pixelSize);
      
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const px = point.x + dx * t;
        const py = point.y + dy * t;
        
        drawPixelatedRect(ctx, ribbonAnchorX + px, ribbonAnchorY + py, pixelSize, pixelSize, KITE_STRING_COLOR);
      }
    }
  }, [initializeRibbon]);

  const drawBackground = useCallback((ctx) => {
    // Sky
    ctx.fillStyle = SKY_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sun
    drawPixelatedRect(ctx, CANVAS_WIDTH - 120, 80, 40, 40, SUN_COLOR);

    // Smooth hills
    ctx.fillStyle = HILL_COLOR;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT);
    
    for (let x = 0; x <= CANVAS_WIDTH; x += 5) {
      const height = Math.sin(x * 0.02 + backgroundOffsetRef.current) * 40 + 60;
      ctx.lineTo(x, CANVAS_HEIGHT - height);
    }
    
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Pixelated clouds (reduce number of clouds)
  //   cloudsRef.current.slice(0, 3).forEach(cloud => {
  //     for (let i = 0; i < 3; i++) {
  //       drawPixelatedRect(ctx, cloud.x + i * 20, cloud.y, 30, 20, CLOUD_COLOR);
  //     }
  //     drawPixelatedRect(ctx, cloud.x + 10, cloud.y - 10, 30, 10, CLOUD_COLOR);
  //   });
  // }, [drawPixelatedRect]);

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
      drawPixelatedRect(ctx, pipe.x, 0, PIPE_WIDTH, pipe.gapStart, pipeColor);
      drawPixelatedRect(ctx, pipe.x, pipe.gapStart + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.gapStart - PIPE_GAP, pipeColor);
      
      // Pipe cap
      const capColor = shadeColor(pipeColor, -30);
      drawPixelatedRect(ctx, pipe.x - 5, pipe.gapStart - 10, PIPE_WIDTH + 10, 20, capColor);
      drawPixelatedRect(ctx, pipe.x - 5, pipe.gapStart + PIPE_GAP, PIPE_WIDTH + 10, 20, capColor);
    });
  }, [drawPixelatedRect]);

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
    const kite = kiteRef.current;
    const prevKite = prevKitePositionRef.current;

    if (!points || points.length === 0) {
      stringPointsRef.current = initializeRibbon();
      return;
    }

    const kiteVelocityX = kite.x - prevKite.x;
    const kiteVelocityY = kite.y - prevKite.y;
    const time = Date.now() * 0.001;
    const windEffect = Math.sin(time * 0.5) * 2 + Math.cos(time * 0.7) * 1.5;

    // Update ribbon physics
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const t = i / (points.length - 1); // Normalized position along the ribbon

      // Calculate forces
      const kiteForceX = -kiteVelocityX * (1 - t) * 3; // Increased trailing effect
      const kiteForceY = -kiteVelocityY * (1 - t) * 2;
      const windForceX = windEffect * t * 0.5;
      const windForceY = Math.cos(time * 2 + i * 0.2) * t * 0.5;
      const gravityForce = 0.2 * t;

      // Update velocity
      point.vx += (kiteForceX + windForceX) * RIBBON_STIFFNESS;
      point.vy += (kiteForceY + windForceY + gravityForce) * RIBBON_STIFFNESS;

      // Apply damping
      point.vx *= RIBBON_DAMPING;
      point.vy *= RIBBON_DAMPING;

      // Update position
      point.x += point.vx;
      point.y += point.vy;

      // Ensure the ribbon always trails behind the kite
      const minX = -i * (RIBBON_LENGTH / RIBBON_SEGMENTS) * 0.8; // Adjust this factor to control how far back the ribbon trails
      point.x = Math.max(point.x, minX);

      // Limit vertical movement
      const maxY = i * (RIBBON_LENGTH / RIBBON_SEGMENTS) * 0.5;
      point.y = Math.min(Math.max(point.y, -maxY), maxY);
    }

    // Reduce physics iterations
    for (let i = 0; i < 3; i++) {
      constrainPoints();
    }

    // Keep first point attached to kite
    points[0].x = 0;
    points[0].y = 0;
    points[0].vx = 0;
    points[0].vy = 0;

    // Update previous kite position
    prevKitePositionRef.current = { x: kite.x, y: kite.y };
  }, [initializeRibbon]);

  const constrainPoints = useCallback(() => {
    const points = stringPointsRef.current;
    const segmentLength = RIBBON_LENGTH / RIBBON_SEGMENTS;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const difference = segmentLength - distance;
      const percent = difference / distance / 2;
      const offsetX = dx * percent;
      const offsetY = dy * percent;

      if (i > 0) {
        p1.x -= offsetX;
        p1.y -= offsetY;
      }
      p2.x += offsetX;
      p2.y += offsetY;

      // Ensure each segment is behind the previous one
      p2.x = Math.min(p2.x, p1.x);
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
      ctx.fillText('PRESS SPACE OR', CANVAS_WIDTH / 2, boxY + 250);
      ctx.fillText('CLICK MOUSE TO START', CANVAS_WIDTH / 2, boxY + 280);
    } else {
      ctx.font = 'bold 24px "Press Start 2P", cursive';
      ctx.fillText(`PIPELINES FIXED: ${scoreRef.current}`, CANVAS_WIDTH / 2, boxY + 200);
      
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText(`HI-SCORE: ${highScoreRef.current}`, CANVAS_WIDTH / 2, boxY + 250);
      
      ctx.font = '16px "Press Start 2P", cursive';
      ctx.fillText('PRESS SPACE OR', CANVAS_WIDTH / 2, boxY + 320);
      ctx.fillText('CLICK MOUSE TO PLAY AGAIN', CANVAS_WIDTH / 2, boxY + 350);
    }

    // Commented out animated retro kites
    /*
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
    */
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

  const [frameCount, setFrameCount] = useState(0);
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (gameStateRef.current === 'playing') {
      const prevKiteX = kiteRef.current.x;
      const prevKiteY = kiteRef.current.y;
      
      // Update game state
      kiteRef.current.y += kiteRef.current.velocity;
      kiteRef.current.velocity += GRAVITY;

      // Update kite rotation (increased angle deviation and faster response)
      const targetRotation = kiteRef.current.velocity * 6; // Increased multiplier
      const rotationSpeed = kiteRef.current.velocity > 0 ? 0.3 : 0.1; // Faster rotation when falling
      kiteRef.current.rotation += (targetRotation - kiteRef.current.rotation) * rotationSpeed;
      kiteRef.current.rotation = Math.max(-60, Math.min(60, kiteRef.current.rotation)); // Increased max rotation

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

      // Update clouds less frequently
      if (frameCount % 2 === 0) {
        cloudsRef.current = cloudsRef.current.map(cloud => {
          let newX = cloud.x - cloud.speed;
          // If the cloud has moved completely off the left side, wrap it to the right
          if (newX + 90 < 0) {  // 90 is an estimate of max cloud width
            newX = CANVAS_WIDTH;
          }
          return {
            ...cloud,
            x: newX
          };
        });
      }

      // Update background continuously
      backgroundOffsetRef.current += 0.02;

      // Check for collisions
      checkCollisions();
    }

    // Clear canvas (only clear the necessary areas)
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw game elements
    drawBackground(ctx);
    drawPipes(ctx);
    drawKite(ctx);

    // Draw score and build status (pixelated font)
    ctx.fillStyle = 'white';
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.textAlign = 'left';
    ctx.fillText(`PIPELINES FIXED: ${scoreRef.current}`, 20, 40);
    ctx.textAlign = 'right';
    ctx.fillText(`STATUS: ${buildStatus.toUpperCase()}`, CANVAS_WIDTH - 20, 40);

    // Draw game state screens
    if (gameStateRef.current === 'welcome') {
      drawGameStateScreen(ctx, 'welcome');
    } else if (gameStateRef.current === 'gameOver') {
      drawGameStateScreen(ctx, 'gameOver');
    }

    setFrameCount(prevCount => (prevCount + 1) % 1000);
    requestAnimationFrame(gameLoop);
  }, [checkCollisions, drawBackground, drawKite, drawPipes, drawGameStateScreen, updateStringPhysics, buildStatus]);

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

    const handleClick = () => {
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvasRef.current?.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvasRef.current?.removeEventListener('click', handleClick);
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

  useEffect(() => {
    stringPointsRef.current = initializeRibbon();
  }, [initializeRibbon]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        border: '4px solid #4b19d5',
        imageRendering: 'pixelated',
      }}
    />
  );
};

export default FlappyKite;