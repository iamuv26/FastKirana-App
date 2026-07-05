import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 32 }: LogoProps) {
  // Ratio is 140 width to 120 height
  const width = size;
  const height = (size * 120) / 140;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 140 120"
      fill="none"
    >
      <Defs>
        <LinearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#ff4d64" />
          <Stop offset="45%" stopColor="#e20a22" />
          <Stop offset="100%" stopColor="#b90214" />
        </LinearGradient>
      </Defs>

      {/* Aligned wind trails */}
      <Rect x="8" y="42" width="22" height="7" rx="3.5" fill="url(#redGrad)" />
      <Rect x="0" y="56" width="30" height="7.5" rx="3.75" fill="url(#redGrad)" />
      <Rect x="8" y="70" width="22" height="7" rx="3.5" fill="url(#redGrad)" />
      <Circle cx="2" cy="59.75" r="3.75" fill="url(#redGrad)" />

      {/* Squircle main card */}
      <Rect x="25" y="10" width="100" height="100" rx="30" fill="url(#redGrad)" />

      {/* Letter 'F' 3D shadow overlay */}
      <Path
        d="M 62.5 34.5 H 98.5 L 95.5 48.5 H 76 L 73.9 58.5 H 89.5 L 87 70.5 H 71.5 L 67.3 90.5 H 50.7 Z"
        fill="black"
        opacity="0.16"
      />

      {/* Letter 'F' white foreground */}
      <Path
        d="M 62 32 H 98 L 95 46 H 75.5 L 73.4 56 H 89 L 86.5 68 H 71 L 66.8 88 H 50.2 Z"
        fill="white"
      />
    </Svg>
  );
}
