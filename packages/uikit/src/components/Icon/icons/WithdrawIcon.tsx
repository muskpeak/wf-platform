import React from 'react';
import { DepositIcon } from './DepositIcon';

export function WithdrawIcon({ style, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <DepositIcon
      style={{ transform: 'rotate(180deg)', ...style }}
      {...props}
    />
  );
}
