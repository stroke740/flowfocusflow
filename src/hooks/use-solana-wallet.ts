import { useState, useCallback, useEffect } from 'react';
import { transact, type MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol';
import { Connection, PublicKey, Transaction, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

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
}

export function useSolanaWallet() {
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    account: null,
    authToken: null,
    balance: null,
  });

  const connection = new Connection(clusterApiUrl(CLUSTER), 'confirmed');

  const fetchBalance = useCallback(async (publicKey: PublicKey) => {
    try {
      const balance = await connection.getBalance(publicKey);
      setState(prev => ({ ...prev, balance: balance / LAMPORTS_PER_SOL }));
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true }));
    
    try {
      const result = await transact(async (wallet: MobileWallet) => {
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
      }));

      // Fetch balance after connecting
      fetchBalance(account.publicKey);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [fetchBalance]);

  const disconnect = useCallback(async () => {
    if (!state.authToken) return;

    try {
      await transact(async (wallet: MobileWallet) => {
        await wallet.deauthorize({ auth_token: state.authToken! });
      });
    } catch (error) {
      console.error('Deauthorization failed:', error);
    } finally {
      setState({
        connected: false,
        connecting: false,
        account: null,
        authToken: null,
        balance: null,
      });
    }
  }, [state.authToken]);

  const signMessage = useCallback(async (message: Uint8Array): Promise<Uint8Array> => {
    if (!state.account || !state.authToken) {
      throw new Error('Wallet not connected');
    }

    const signedMessage = await transact(async (wallet: MobileWallet) => {
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
  }, [state.account, state.authToken]);

  const signTransaction = useCallback(async (transaction: Transaction): Promise<Transaction> => {
    if (!state.account || !state.authToken) {
      throw new Error('Wallet not connected');
    }

    const signedTx = await transact(async (wallet: MobileWallet) => {
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
  }, [state.account, state.authToken, connection]);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!state.account || !state.authToken) {
      throw new Error('Wallet not connected');
    }

    const signature = await transact(async (wallet: MobileWallet) => {
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

    // Refresh balance after transaction
    fetchBalance(state.account.publicKey);
    
    return signature;
  }, [state.account, state.authToken, connection, fetchBalance]);

  // Refresh balance periodically when connected
  useEffect(() => {
    if (!state.connected || !state.account) return;
    
    const interval = setInterval(() => {
      fetchBalance(state.account!.publicKey);
    }, 30000);

    return () => clearInterval(interval);
  }, [state.connected, state.account, fetchBalance]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction,
    signAndSendTransaction,
    refreshBalance: () => state.account && fetchBalance(state.account.publicKey),
  };
}
