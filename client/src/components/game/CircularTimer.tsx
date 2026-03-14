interface CircularTimerProps {
  timeRemaining: number; // in milliseconds
  totalDuration: number; // in milliseconds
}

export function CircularTimer({ timeRemaining, totalDuration }: CircularTimerProps) {
  const percentage = totalDuration > 0 ? (timeRemaining / totalDuration) * 100 : 0;
  const seconds = Math.ceil(timeRemaining / 1000);

  // Calculate stroke dash offset for circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on time remaining
  const getColor = () => {
    if (percentage > 50) {
      return {
        stroke: 'rgb(0, 255, 128)', // success green
        glow: 'rgba(0, 255, 128, 0.4)',
        text: 'text-success'
      };
    } else if (percentage > 25) {
      return {
        stroke: 'rgb(255, 193, 7)', // warning yellow
        glow: 'rgba(255, 193, 7, 0.4)',
        text: 'text-yellow-400'
      };
    } else {
      return {
        stroke: 'rgb(255, 87, 87)', // error red
        glow: 'rgba(255, 87, 87, 0.4)',
        text: 'text-red-400'
      };
    }
  };

  const colors = getColor();
  const isLowTime = seconds <= 10 && seconds > 0;
  const isCritical = seconds <= 5 && seconds > 0;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        animation: isLowTime ? 'timerPulse 0.5s ease-in-out infinite' : 'none',
        ['--timer-scale' as string]: isCritical ? '1.08' : '1.05',
      }}
    >
      <svg className="transform -rotate-90" width="180" height="180">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="rgba(0, 240, 255, 0.1)"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke={colors.stroke}
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
            filter: `drop-shadow(0 0 calc(8px + 12px * var(--beat-intensity, 0)) ${colors.glow})`,
          }}
        />
      </svg>
      {/* Timer text in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-5xl font-bold font-mono ${colors.text} transition-colors duration-300`}
            style={{
              textShadow: `0 0 calc(20px + 15px * var(--beat-intensity, 0)) ${colors.glow}`,
            }}
          >
            {seconds}
          </div>
          <div className="text-xs text-text-muted font-mono uppercase tracking-wide mt-1">
            seconds
          </div>
        </div>
      </div>

      {/* Pulse animation for low time */}
      <style>{`
        @keyframes timerPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(var(--timer-scale, 1.05));
          }
        }
      `}</style>
    </div>
  );
}
