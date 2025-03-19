import { Hero } from "@/components/hero";
import EthersExample from "@/components/EthersExample";

export default function Home() {
  return (
    <div className="pt-16">
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">AppKit Integration Example</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Connect with AppKit</h3>
            <div className="p-4 bg-white rounded-lg shadow-md">
              <p className="mb-4">Click the button below to connect your wallet using AppKit:</p>
              <appkit-button />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Ethers Integration</h3>
            <EthersExample />
          </div>
        </div>
      </div>
    </div>
  );
}
