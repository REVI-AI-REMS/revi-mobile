import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface HomeIconProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function HomeIcon({
  width = 24,
  height = 24,
  color = "#000000",
}: HomeIconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      {/* House body */}
      <Path
        d="M3 12L12 3L21 12V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V12Z"
        fill={color}
        fillOpacity="1"
      />
      {/* Door */}
      <Rect x="9" y="14" width="6" height="8" fill="white" fillOpacity="0.3" />
      {/* Roof outline */}
      <Path
        d="M3 12L12 3L21 12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
