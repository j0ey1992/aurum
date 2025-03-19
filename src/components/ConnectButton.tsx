'use client'

import React, { useEffect, useRef } from 'react'
import { useAppKitAccount } from "@reown/appkit/react"

export default function ConnectButton() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This ensures the web component is properly initialized after the component mounts
    if (ref.current) {
      const button = document.createElement('appkit-button');
      ref.current.innerHTML = '';
      ref.current.appendChild(button);
    }
  }, []);

  return (
    <div className="reown-connect-button" ref={ref}></div>
  )
}

// Advanced usage with hooks
export function AdvancedConnectButton() {
  const { address, isConnected } = useAppKitAccount()
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isConnected && ref.current) {
      const button = document.createElement('appkit-button');
      ref.current.innerHTML = '';
      ref.current.appendChild(button);
    }
  }, [isConnected]);
  
  return (
    <div>
      {isConnected ? (
        <div>Connected: {address}</div>
      ) : (
        <div ref={ref}></div>
      )}
    </div>
  )
}
