import { useState, useCallback, useEffect, useMemo } from 'react';
import { Connection, PublicKey, Transaction, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

let bs58: any;
try {
  bs58 = require('bs58');
} catch {
  bs58 = { encode: (b: Uint8Array) => '', decode: (s: string) => new Uint8Array() };
}

const APP_IDENTITY = {
  name: 'FlowFocus',
  uri: 'https://flowfocusflow.lovable.app',
  icon: 'favicon.ico',
};

const CLUSTER = 'mainnet-beta';

interface WalletAccount {
  address: string;
  publicKey: PublicKey;
  label?: string;
}

interface WalletState {
  connected: boolean;
  connecting: boolean;
  account: WalletAccount | null;
  authToken: string | null;
  balance: number | null;
  walletType: 'mwa' | 'browser' | null;
}

// Check if Phantom or other Solana wallet is available in browser
function getPhantomProvider() {
  if (typeof window !== 'undefined' && 'solana' in window) {
    const provider = (window as any).solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  return null;
}

function getSolflareProvider() {
  if (typeof window !== 'undefined' && 'solflare' in window) {
    return (window as any).solflare;
  }
  return null;
}

function getBrowserWalletProvider() {
  return getPhantomProvider() || getSolflareProvider() || (typeof window !== 'undefined' ? (window as any).solana : null);
}

export function useSolanaWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    account: null,
    authToken: null,
    balance: null,
    walletType: null,
  });

  const connection = useMemo(() => new Connection(clusterApiUrl(CLUSTER), 'confirmed'), []);

  const fetchBalance = useCallback(async (publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey);
      setState(prev => ({ ...prev, balance: balance / LAMPORTS_PER_SOL }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [connection]);

  // Check if MWA is available (native Android app)
  const isMwaAvailable = useCallback(async () => {
    try {
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol');
      return typeof transact === 'function';
    } catch {
      return false;
    }
  }, []);

  // Browser wallet connection
  const connectBrowserWallet = useCallback(async () => {
    const provider = getBrowserWalletProvider();
    if (!provider) {
      throw new Error('No Solana wallet found. Please install Phantom or another Solana wallet.');
    }

    try {
      const resp = await provider.connect();
      const publicKey = new PublicKey(resp.publicKey.toString());
      
      const account: WalletAccount = {
        address: publicKey.toBase58(),
        publicKey,
        label: provider.isPhantom ? 'Phantom' : provider.isSolflare ? 'Solflare' : 'Wallet',
      };

      setState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        account,
        walletType: 'browser',
      }));

      fetchBalance(publicKey);
    } catch (error) {
      console.error('Browser wallet connection failed:', error);
      throw error;
    }
  }, [fetchBalance]);

  // MWA connection (for native mobile apps)
  const connectMwa = useCallback(async () => {
    const mwa = await import('@solana-mobile/mobile-wallet-adapter-protocol');
    
    const result = await mwa.transact(async (wallet) => {
      const authResult = await wallet.authorize({
        cluster: CLUSTER,
        identity: APP_IDENTITY,
      });
      return authResult;
    });

    const account: WalletAccount = {
      address: result.accounts[0].address,
      publicKey: new PublicKey(bs58.decode(result.accounts[0].address)),
      label: result.accounts[0].label,
    };

    setState(prev => ({
      ...prev,
      connected: true,
      connecting: false,
      account,
      authToken: result.auth_token,
      walletType: 'mwa',
    }));

    fetchBalance(account.publicKey);
  }, [fetchBalance]);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true }));
    
    try {
      // Try browser wallet first (works on web)
      const browserProvider = getBrowserWalletProvider();
      if (browserProvider) {
        await connectBrowserWallet();
        return;
      }

      // Fall back to MWA (native Android)
      const mwaAvailable = await isMwaAvailable();
      if (mwaAvailable) {
        await connectMwa();
        return;
      }

      throw new Error('No wallet available. Please install Phantom or another Solana wallet.');
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [connectBrowserWallet, connectMwa, isMwaAvailable]);

  const disconnect = useCallback(async () => {
    if (state.walletType === 'browser') {
      const provider = getBrowserWalletProvider();
      if (provider) {
        try {
          await provider.disconnect();
        } catch (error) {
          console.error('Browser wallet disconnect failed:', error);
        }
      }
    } else if (state.walletType === 'mwa' && state.authToken) {
      try {
        const mwa = await import('@solana-mobile/mobile-wallet-adapter-protocol');
        await mwa.transact(async (wallet) => {
          await wallet.deauthorize({ auth_token: state.authToken! });
        });
      } catch (error) {
        console.error('MWA deauthorization failed:', error);
      }
    }

    setState({
      connected: false,
      connecting: false,
      account: null,
      authToken: null,
      balance: null,
      walletType: null,
    });
  }, [state.authToken, state.walletType]);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    if (state.walletType === 'browser') {
      const provider = getBrowserWalletProvider();
      if (!provider) throw new Error('Wallet not found');
      const { signature } = await provider.signMessage(message, 'utf8');
      return signature;
    }

    // MWA signing
    const mwa = await import('@solana-mobile/mobile-wallet-adapter-protocol');
    const signedMessage = await mwa.transact(async (wallet) => {
      await wallet.reauthorize({
        auth_token: state.authToken!,
        identity: APP_IDENTITY,
      });
      const result = await wallet.signMessages({
        addresses: [state.account!.address],
        payloads: [bs58.encode(message)],
      });
      return bs58.decode(result[0]);
    });

    return signedMessage;
  }, [state.account, state.authToken, state.walletType]);

  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    if (state.walletType === 'browser') {
      const provider = getBrowserWalletProvider();
      if (!provider) throw new Error('Wallet not found');
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = state.account.publicKey;
      
      return await provider.signTransaction(transaction);
    }

    // MWA signing
    const mwa = await import('@solana-mobile/mobile-wallet-adapter-protocol');
    const signedTx = await mwa.transact(async (wallet) => {
      await wallet.reauthorize({
        auth_token: state.authToken!,
        identity: APP_IDENTITY,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = state.account!.publicKey;

      const serializedTx = transaction.serialize({ requireAllSignatures: false });
      const result = await wallet.signTransactions({
        payloads: [bs58.encode(serializedTx)],
      });

      return Transaction.from(bs58.decode(result[0]));
    });

    return signedTx;
  }, [state.account, state.authToken, state.walletType, connection]);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!state.account) {
      throw new Error('Wallet not connected');
    }

    if (state.walletType === 'browser') {
      const provider = getBrowserWalletProvider();
      if (!provider) throw new Error('Wallet not found');
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = state.account.publicKey;
      
      const { signature } = await provider.signAndSendTransaction(transaction);
      fetchBalance(state.account.publicKey);
      return signature;
    }

    // MWA signing and sending
    const mwa = await import('@solana-mobile/mobile-wallet-adapter-protocol');
    const signature = await mwa.transact(async (wallet) => {
      await wallet.reauthorize({
        auth_token: state.authToken!,
        identity: APP_IDENTITY,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = state.account!.publicKey;

      const serializedTx = transaction.serialize({ requireAllSignatures: false });
      const result = await wallet.signAndSendTransactions({
        payloads: [bs58.encode(serializedTx)],
      });

      return bs58.encode(result[0]);
    });

    fetchBalance(state.account.publicKey);
    return signature;
  }, [state.account, state.authToken, state.walletType, connection, fetchBalance]);

  // Listen for browser wallet events
  useEffect(() => {
    const provider = getBrowserWalletProvider();
    if (!provider) return;

    const handleDisconnect = () => {
      setState({
        connected: false,
        connecting: false,
        account: null,
        authToken: null,
        balance: null,
        walletType: null,
      });
    };

    const handleAccountChange = (publicKey: PublicKey | null) => {
      if (publicKey) {
        const account: WalletAccount = {
          address: publicKey.toBase58(),
          publicKey,
        };
        setState(prev => ({ ...prev, account }));
        fetchBalance(publicKey);
      } else {
        handleDisconnect();
      }
    };

    provider.on?.('disconnect', handleDisconnect);
    provider.on?.('accountChanged', handleAccountChange);

    return () => {
      provider.removeListener?.('disconnect', handleDisconnect);
      provider.removeListener?.('accountChanged', handleAccountChange);
    };
  }, [fetchBalance]);

  // Refresh balance periodically when connected
  useEffect(() => {
    if (!state.connected || !state.account) return;
    
    const interval = setInterval(() => {
      fetchBalance(state.account!.publicKey);
    }, 30000);

    return () => clearInterval(interval);
  }, [state.connected, state.account, fetchBalance]);

  // Check for existing browser wallet connection on mount
  useEffect(() => {
    const provider = getBrowserWalletProvider();
    if (provider?.isConnected && provider.publicKey) {
      const publicKey = new PublicKey(provider.publicKey.toString());
      const account: WalletAccount = {
        address: publicKey.toBase58(),
        publicKey,
        label: provider.isPhantom ? 'Phantom' : provider.isSolflare ? 'Solflare' : 'Wallet',
      };
      setState(prev => ({
        ...prev,
        connected: true,
        account,
        walletType: 'browser',
      }));
      fetchBalance(publicKey);
    }
  }, [fetchBalance]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    signAndSendTransaction,
    refreshBalance: () => state.account && fetchBalance(state.account.publicKey),
    hasBrowserWallet: !!getBrowserWalletProvider(),
  };
}
