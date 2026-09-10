import React from 'react';
import { iconCache } from './constants';
import type { IconNameType } from './type';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconNameType;
  size?: number | string;
}

export function Icon({ name, size, className, style, ...props }: IconProps) {
  const IconComponent = iconCache[name];

  if (!IconComponent) {
    // 找不到图标时的降级显示
    return <div style={{ width: size || 24, height: size || 24, ...style }} className={className} />;
  }

  return (
    <IconComponent
      width={size || '1em'}
      height={size || '1em'}
      className={className}
      style={{ boxSizing: 'content-box', verticalAlign: 'middle', fill: 'currentColor', ...style }}
      {...props}
    />
  );
}
