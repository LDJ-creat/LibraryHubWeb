'use client';

import Image from 'next/image';
import type { ImageProps } from 'next/image';
import { useState } from 'react';

interface BookCoverImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc: string;
}

export default function BookCoverImage({ src, alt, width, height, className, fallbackSrc, ...props }: BookCoverImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    setCurrentSrc(fallbackSrc);
  };

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
    />
  );
}
