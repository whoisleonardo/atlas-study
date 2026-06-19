import Svg, { Circle, Line, Ellipse } from 'react-native-svg';
import { Colors } from '../constants/design';

interface Props {
  size?: number;
  color?: string;
}

export function AtlasLogo({ size = 64, color = Colors.clay }: Props) {
  const sw = 5;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={30} stroke={color} strokeWidth={sw} fill="none" />
      <Line x1={20} y1={50} x2={80} y2={50} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Ellipse cx={50} cy={50} rx={11.5} ry={30} stroke={color} strokeWidth={sw} fill="none" />
    </Svg>
  );
}
