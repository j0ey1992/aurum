'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'
import { ReactNode, useEffect } from 'react'

// Define Cronos Chain
const cronos = {
  id: 25,
  name: 'Cronos',
  network: 'cronos',
  nativeCurrency: {
    decimals: 18,
    name: 'Cronos',
    symbol: 'CRO',
  },
  rpcUrls: {
    public: { http: ['https://evm.cronos.org'] },
    default: { http: ['https://evm.cronos.org'] },
  },
  blockExplorers: {
    default: { name: 'Cronoscan', url: 'https://cronoscan.com' },
  },
}

// 1. Get projectId at https://cloud.reown.com
const projectId = '7b7cd4d698d7ca7ddab6825056af50ef'

// 2. Create a metadata object
const metadata = {
  name: 'AurumTrust',
  description: 'Gold-backed deflationary token experiment on Cronos Chain',
  url: 'https://aurumtrust.finance',
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// Create the AppKit instance
// Initialize AppKit outside of any component
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [cronos, mainnet],
  projectId,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeMode: 'dark', // Override system settings with 'light' or 'dark'
  themeVariables: {
    '--w3m-color-mix': '#F59E0B', // Amber color to match Aurum theme
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#F59E0B',
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-z-index': 9999
  }
});

console.log('AppKit initialized');

export function AppKit({ children }: { children: ReactNode }) {

  return (
    <>
      {children}
    </>
  )
}
