import { create } from 'zustand';

interface ConnectedWallet {
  ecosystem: 'evm' | 'solana' | 'sui';
  address: string;
  chainRef: string;
  label?: string;
}

interface WalletState {
  connected: ConnectedWallet[];
  isConnecting: boolean;
  pendingAccount: ConnectedWallet | null;
  addConnected: (wallet: ConnectedWallet) => void;
  removeConnected: (address: string) => void;
  setConnecting: (v: boolean) => void;
  setPendingAccount: (account: ConnectedWallet | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  connected: [],
  isConnecting: false,
  pendingAccount: null,
  addConnected: (wallet) => set((s) => ({ connected: [...s.connected, wallet] })),
  removeConnected: (address) => set((s) => ({ connected: s.connected.filter((w) => w.address !== address) })),
  setConnecting: (v) => set({ isConnecting: v }),
  setPendingAccount: (account) => set({ pendingAccount: account }),
}));
