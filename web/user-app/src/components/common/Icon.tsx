import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  fill = false,
  className = '',
  style = {},
}) => {
  return (
    <span
      className={`material-symbols-rounded inline-flex items-center justify-center shrink-0 leading-none ${
        fill ? 'fill-1' : ''
      } ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
