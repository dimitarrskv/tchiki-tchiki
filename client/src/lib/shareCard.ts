// Canvas 2D share card generator for Instagram Stories (1080x1920)

export interface ShareCardData {
  playerName: string;
  playerRank: number;
  playerScore: number;
  totalPlayers: number;
  totalRounds: number;
  isWinner: boolean;
  appUrl: string;
}

// Theme colors matching globals.css
const COLORS = {
  bg: '#0a0e27',
  bgCard: '#0f1419',
  primary: '#1ed760',
  secondary: '#ff006e',
  accent: '#9d4edd',
  text: '#e0f7ff',
  textMuted: '#8892b0',
};

const W = 1080;
const H = 1920;

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Solid background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // Grid lines (matches body::after in globals.css)
  ctx.strokeStyle = 'rgba(30, 215, 96, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Scanline overlay (matches body::before in globals.css)
  ctx.fillStyle = 'rgba(30, 215, 96, 0.03)';
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }
}

function drawNeonText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  glowSize: number,
) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = glowSize;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  // Inner layer (sharper)
  ctx.shadowBlur = glowSize * 0.4;
  ctx.fillText(text, x, y);

  // Bright core
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.3;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  borderColor: string,
) {
  // Card background
  drawRoundRect(ctx, x, y, w, h, 16);
  ctx.fillStyle = COLORS.bgCard;
  ctx.fill();

  // Card border with glow
  ctx.save();
  ctx.shadowColor = borderColor;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export async function generateShareCard(data: ShareCardData): Promise<Blob> {
  // Wait for fonts to be fully loaded
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 1. Background
  drawBackground(ctx);

  // 2. Decorative top line
  ctx.save();
  ctx.shadowColor = COLORS.primary;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 160);
  ctx.lineTo(W - 100, 160);
  ctx.stroke();
  ctx.restore();

  // 3. "TCHIKI-TCHIKI" header
  drawNeonText(
    ctx,
    'TCHIKI-TCHIKI',
    W / 2,
    240,
    '72px VT323',
    COLORS.primary,
    40,
  );

  // Subtitle
  ctx.font = '28px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('MUSIC PAIRS', W / 2, 300);

  // Decorative bottom line
  ctx.save();
  ctx.shadowColor = COLORS.primary;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 340);
  ctx.lineTo(W - 100, 340);
  ctx.stroke();
  ctx.restore();

  // 4. Player name
  ctx.font = '36px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('> ' + data.playerName.toUpperCase(), W / 2, 440);

  // 5. Ranking display
  const rankCardY = 490;
  const rankCardH = 360;
  drawCard(ctx, 80, rankCardY, W - 160, rankCardH, COLORS.primary + '60');

  // "YOUR RANKING" label
  ctx.font = '24px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText('YOUR RANKING', W / 2, rankCardY + 60);

  // Giant rank number
  const rankText = `#${data.playerRank}`;
  const rankColor = data.isWinner ? COLORS.primary : COLORS.text;
  drawNeonText(
    ctx,
    rankText,
    W / 2,
    rankCardY + 200,
    '160px VT323',
    rankColor,
    data.isWinner ? 50 : 25,
  );

  // Rank suffix (out of total)
  ctx.font = '28px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(
    `OUT OF ${data.totalPlayers} PLAYER${data.totalPlayers !== 1 ? 'S' : ''}`,
    W / 2,
    rankCardY + 310,
  );

  // 6. Winner badge (conditional)
  let nextY = rankCardY + rankCardH + 40;

  if (data.isWinner) {
    const badgeW = 320;
    const badgeH = 70;
    const badgeX = (W - badgeW) / 2;

    // Pink neon badge
    drawRoundRect(ctx, badgeX, nextY, badgeW, badgeH, 12);
    ctx.save();
    ctx.fillStyle = COLORS.secondary + '20';
    ctx.fill();
    ctx.shadowColor = COLORS.secondary;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = COLORS.secondary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    drawNeonText(
      ctx,
      'WINNER',
      W / 2,
      nextY + badgeH / 2,
      '36px VT323',
      COLORS.secondary,
      30,
    );

    nextY += badgeH + 40;
  }

  // 7. Stats card
  const statsCardY = nextY + 10;
  const statsCardH = 280;
  drawCard(ctx, 80, statsCardY, W - 160, statsCardH, COLORS.primary + '40');

  // Stats header
  ctx.font = '22px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'left';
  ctx.fillText('> GAME STATS', 130, statsCardY + 50);

  // Divider
  ctx.strokeStyle = COLORS.primary + '30';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(130, statsCardY + 70);
  ctx.lineTo(W - 130, statsCardY + 70);
  ctx.stroke();

  // Stats rows
  const stats = [
    ['SCORE', `${data.playerScore} PTS`],
    ['ROUNDS', `${data.totalRounds}`],
    ['PLAYERS', `${data.totalPlayers}`],
  ];

  stats.forEach(([label, value], i) => {
    const rowY = statsCardY + 115 + i * 60;

    ctx.font = '30px VT323';
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = 'left';
    ctx.fillText(label, 130, rowY);

    ctx.font = '30px VT323';
    ctx.fillStyle = COLORS.primary;
    ctx.textAlign = 'right';
    ctx.fillText(value, W - 130, rowY);
  });

  // 8. Bottom CTA section
  const ctaY = H - 340;

  // Decorative line
  ctx.save();
  ctx.shadowColor = COLORS.accent;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = COLORS.accent + '60';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(200, ctaY);
  ctx.lineTo(W - 200, ctaY);
  ctx.stroke();
  ctx.restore();

  // "Play with me!" text
  ctx.font = '40px VT323';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText('Play with me!', W / 2, ctaY + 70);

  // App URL
  drawNeonText(
    ctx,
    data.appUrl,
    W / 2,
    ctaY + 140,
    '32px VT323',
    COLORS.accent,
    20,
  );

  // Small tagline
  ctx.font = '22px VT323';
  ctx.fillStyle = COLORS.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Find your music match',
    W / 2,
    ctaY + 200,
  );

  // Bottom decorative line
  ctx.save();
  ctx.shadowColor = COLORS.primary;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, H - 100);
  ctx.lineTo(W - 100, H - 100);
  ctx.stroke();
  ctx.restore();

  // Convert to blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image'));
      },
      'image/png',
    );
  });
}
