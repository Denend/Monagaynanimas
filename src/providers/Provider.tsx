import React from 'react';
import { ProvidersProps } from '../types.ts';
import { FrameMultiplierProvider } from './FrameMultiplierProvider.tsx';

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <FrameMultiplierProvider>
      {children}
    </FrameMultiplierProvider>
  );
};

export default Providers; 