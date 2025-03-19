'use client'

import React, { useState } from 'react'
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react"
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import { AUT_TOKEN_ADDRESS } from '@/services/tokenService'

// The ERC-20 Contract ABI, which is a common contract interface
// for tokens (this is the Human-Readable ABI format)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address) view returns (uint)',
  'function transfer(address to, uint amount)',
  'event Transfer(address indexed from, address indexed to, uint amount)'
]

export default function EthersExample() {
  const { address, caipAddress, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider('eip155')
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function getBalance() {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setLoading(true)
      // Type assertion for walletProvider
      const ethersProvider = new BrowserProvider(walletProvider as any)
      const signer = await ethersProvider.getSigner()
      
      // The Contract object
      const tokenContract = new Contract(AUT_TOKEN_ADDRESS, ERC20_ABI, signer)
      const tokenBalance = await tokenContract.balanceOf(address)
      
      setBalance(formatUnits(tokenBalance, 18))
    } catch (error) {
      console.error('Error getting balance:', error)
      alert('Error getting balance. See console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Ethers Integration Example</h2>
      
      {isConnected ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Connected Address:</p>
            <p className="font-mono text-sm">{address}</p>
          </div>
          
          <button 
            onClick={getBalance}
            disabled={loading}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get AUT Balance'}
          </button>
          
          {balance !== null && (
            <div>
              <p className="text-sm text-gray-600">AUT Balance:</p>
              <p className="text-xl font-bold text-amber-500">{balance} AUT</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4">Connect your wallet to interact with the AUT token</p>
          <appkit-button />
        </div>
      )}
    </div>
  )
}
