import { IExecDataProtector } from "@iexec/dataprotector";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

const CHAIN_ID = 134; // Bellecour Chain ID

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initDataUnsafe: unknown;
      };
    };
    ethereum?: any; // For MetaMask Browser Extension
  }
}

const App = () => {
  const [provider, setProvider] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [protectedData, setProtectedData] = useState<string | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // 🚀 Use MetaMask Browser Extension for Telegram Web
        console.log("Using MetaMask Extension...");
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        setProvider(window.ethereum);
        setAccount(address);
        setIsConnected(true);
        console.log("Connected with MetaMask Extension:", address);
      } else {
        // 🚀 Use WalletConnect for Telegram Mobile (MetaMask App)
        console.log("Using WalletConnect for Mobile...");
        const wcProvider = await EthereumProvider.init({
          projectId: "b2e4ce8c8c62a7815f1b264f625182dd", // Your WalletConnect Project ID
          chains: [CHAIN_ID],
          showQrModal: false, // Disable QR code inside Telegram WebView
        });

        wcProvider.on("display_uri", (uri) => {
          console.log("WalletConnect URI:", uri);
          const metamaskURL = `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`;
          window.open(metamaskURL, "_blank");
        });

        await wcProvider.connect();

        wcProvider.on("accountsChanged", (accounts: string[]) => {
          setAccount(accounts[0] || null);
          setIsConnected(!!accounts.length);
        });

        setProvider(wcProvider);
        setIsConnected(true);
        console.log("Connected with WalletConnect!");
      }
    } catch (error) {
      console.error("WalletConnect Error:", error);
    }
  };

  const protectData = async () => {
    if (!provider || !account) {
      console.error("Wallet not connected");
      return;
    }

    try {
      const iexecDataProtector = new IExecDataProtector(provider);
      const dataToProtect = {
        email: "user@example.com", // Replace with real user data
        telegramId: "12345678", // Example Telegram user ID
      };

      const { transactionHash } = await iexecDataProtector.core.protectData({ data: dataToProtect });
      console.log("Data protected successfully:", transactionHash);

      setProtectedData(transactionHash);
    } catch (error) {
      console.error("Data Protection Error:", error);
    }
  };

  return (
    <div className="container">
      <h1>Web3 Telegram Mini App</h1>
      <p>Connect your MetaMask wallet and protect your data!</p>

      {isConnected ? (
        <>
          <p>Connected Account: {account}</p>
          <button onClick={protectData}>Protect My Data</button>
          {protectedData && <p>Protected Data Hash: {protectedData}</p>}
        </>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
};

export default App;
