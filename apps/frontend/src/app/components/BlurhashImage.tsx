import React, { useState } from 'react';
import { Blurhash } from 'react-blurhash';

type BlurhashImageProps = {
  src: string;
  blurhash?: string | null;
  alt: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
};

export function BlurhashImage({
  src,
  blurhash,
  alt,
  width = '100%',
  height = '100%',
  style = {},
}: BlurhashImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        ...style,
      }}
    >
      {/* Blurhash placeholder - shown while image is loading */}
      {blurhash && !isLoaded && (
        <Blurhash
          hash={blurhash}
          width="100%"
          height="100%"
          resolutionX={32}
          resolutionY={32}
          punch={1}
        />
      )}

      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
          position: blurhash ? 'absolute' : 'relative',
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}
