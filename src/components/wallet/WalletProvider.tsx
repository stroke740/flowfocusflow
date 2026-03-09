import React, { createContext, useContext, ReactNode } from 'react';
import { useSolanaWallet } from '@/hooks/use-solana-wallet';

type WalletContextType = ReturnType<typeof useSolanaWallet>;

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useSolanaWallet();
  
  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
