import { IExecDataProtector } from "@iexec/dataprotector";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
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
  const [protectedData, setProtectedData] = useState<string | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const protectData = async () => {
    try {
      let walletProvider;

      if (window.ethereum) {
        // 🚀 Use MetaMask Extension for Telegram Web
        console.log("Using MetaMask Extension...");
        walletProvider = window.ethereum;
        await walletProvider.request({ method: "eth_requestAccounts" });
      } else {
        // 🚀 Use WalletConnect for Telegram Mobile
        console.log("Using WalletConnect for Mobile...");
        const wcProvider = await EthereumProvider.init({
          projectId: "b2e4ce8c8c62a7815f1b264f625182dd", // Your WalletConnect Project ID
          chains: [CHAIN_ID],
          showQrModal: false, // Hide WalletConnect QR modal in Telegram WebView
        });

        let walletConnectURI = "";
        wcProvider.on("display_uri", (uri) => {
          walletConnectURI = uri;
          console.log("WalletConnect URI:", uri);
        });

        await wcProvider.connect();

        if (walletConnectURI) {
          // 🚀 Open MetaMask using deep link
          const metamaskURL = `https://metamask.app.link/wc?uri=${encodeURIComponent(walletConnectURI)}`;
          console.log("Opening MetaMask:", metamaskURL);

          // Delay opening to avoid Telegram WebView blocking
          setTimeout(() => {
            window.location.href = metamaskURL;
          }, 1000);
        } else {
          console.error("❌ WalletConnect URI not generated");
        }

        walletProvider = wcProvider;
      }

      const iexecDataProtector = new IExecDataProtector(walletProvider);
      console.log("🔄 Initiating data protection...");

      const dataToProtect = {
        email: "user@example.com", // Replace with actual data
        telegramId: "12345678", // Example Telegram user ID
      };

      // 🚀 Requires four signing steps (Smart contract + EIP-712 signatures)
      const { transactionHash } = await iexecDataProtector.core.protectData({ data: dataToProtect });

      console.log("✅ Data protected successfully:", transactionHash);
      setProtectedData(transactionHash);
    } catch (error) {
      console.error("❌ Data Protection Error:", error);
      alert("Error: " + error.message);
    }
  };


  return (
    <div className="container">
      <h1>Web3 Telegram Mini App</h1>
      <p>Protect your data on iExec using MetaMask!</p>

      <button onClick={protectData}>Protect My Data</button>
      {protectedData && <p>Protected Data Hash: {protectedData}</p>}
    </div>
  );
};

export default App;
