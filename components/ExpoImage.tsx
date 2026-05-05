import { Image as OriginalImage, ImageProps } from 'expo-image';
import React from 'react';

// Wrap the legacy expo-image class component in a function component
// This satisfies React 19's strict JSX Element Type constraints.
export function Image(props: ImageProps) {
  // Use React.createElement directly with an 'any' cast to completely 
  // bypass the React 19 JSX element class compiler errors.
  return React.createElement(OriginalImage as any, props);
}
