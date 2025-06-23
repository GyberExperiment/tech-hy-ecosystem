// EIP-6963 Multi-Wallet Injected Provider Discovery Types
// https://eips.ethereum.org/EIPS/eip-6963

/**
 * Represents the assets needed to display a wallet
 */
export interface EIP6963ProviderInfo {
  uuid: string; // Globally unique ID to differentiate between provider sessions
  name: string; // Human-readable name of the wallet
  icon: string; // URL to the wallet's icon
  rdns: string; // Reverse DNS identifier (e.g., 'io.metamask', 'com.coinbase.wallet')
}

/**
 * Interface for Ethereum providers based on the EIP-1193 standard
 */
export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void;
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void;
  request: (request: { method: string; params?: Array<unknown> }) => Promise<unknown>;
  
  // MetaMask specific properties
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isBraveWallet?: boolean;
  
  // Standard provider events
  on?: (event: string, listener: (...args: any[]) => void) => void;
  removeListener?: (event: string, listener: (...args: any[]) => void) => void;
}

/**
 * Interface detailing the structure of provider information and its Ethereum provider
 */
export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

/**
 * Event structure for announcing a provider based on EIP-6963
 */
export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: EIP6963ProviderDetail;
}

/**
 * Event structure for requesting providers based on EIP-6963
 */
export interface EIP6963RequestProviderEvent extends Event {
  type: 'eip6963:requestProvider';
}

/**
 * Extended WindowEventMap to include EIP-6963 events
 */
declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': EIP6963AnnounceProviderEvent;
    'eip6963:requestProvider': EIP6963RequestProviderEvent;
  }
}

/**
 * Wallet priorities for provider selection
 */
export const WALLET_PRIORITIES = {
  'io.metamask': 1,           // MetaMask (highest priority)
  'io.metamask.flask': 2,     // MetaMask Flask
  'com.coinbase.wallet': 3,   // Coinbase Wallet
  'com.trustwallet.app': 4,   // Trust Wallet
  'com.okex.wallet': 5,       // OKX Wallet
} as const;

export type WalletRDNS = keyof typeof WALLET_PRIORITIES; 