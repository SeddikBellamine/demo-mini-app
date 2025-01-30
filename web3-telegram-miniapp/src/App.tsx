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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const protectData = async () => {
    try {
      console.log("🔍 Protect Data function started...");

      setErrorMessage(null); // Reset errors before starting
      let walletProvider;

      if (window.ethereum) {
        console.log("🔍 Using MetaMask Extension...");
        walletProvider = window.ethereum;
        await walletProvider.request({ method: "eth_requestAccounts" });
      } else {
        console.log("🔍 Using WalletConnect for Mobile...");
        const wcProvider = await EthereumProvider.init({
          projectId: "b2e4ce8c8c62a7815f1b264f625182dd", // WalletConnect Project ID
          chains: [CHAIN_ID],
          showQrModal: false, // Hide WalletConnect QR modal inside Telegram WebView
        });

        let walletConnectURI = "";
        wcProvider.on("display_uri", (uri) => {
          walletConnectURI = uri;
          console.log("🚀 WalletConnect URI Generated:", uri);
        });

        await wcProvider.connect();
        alert("WalletConnect Session Started! ✅");
        if (walletConnectURI) {
          const metamaskURL = `https://metamask.app.link/wc?uri=${encodeURIComponent(walletConnectURI)}`;
          console.log("Opening MetaMask:", metamaskURL);

          setTimeout(() => {
            alert("Opening MetaMask via: " + metamaskURL);
            window.location.href = metamaskURL;
          }, 1000);
        } else {
          throw new Error("❌ WalletConnect URI not generated. Please try again.");
        }

        walletProvider = wcProvider;
      }

      const iexecDataProtector = new IExecDataProtector(walletProvider);
      console.log("🔄 Initiating data protection...");

      const dataToProtect = {
        email: "user@example.com", // Replace with actual data
        telegramId: "12345678", // Example Telegram user ID
      };

      const { transactionHash } = await iexecDataProtector.core.protectData({ data: dataToProtect });

      console.log("✅ Data protected successfully:", transactionHash);
      setProtectedData(transactionHash);
    } catch (error) {
      const message = (error as Error).message || "Unknown error occurred.";
      console.error("❌ Data Protection Error:", error);
      setErrorMessage(message);
    }
  };

  return (
    <div className="container">
      <h1>Web3 Telegram Mini App</h1>
      <p>Protect your data on iExec using MetaMask!</p>

      <button onClick={protectData}>Protect My Data</button>

      {protectedData && (
        <p style={{ color: "green" }}>
          ✅ Protected Data Hash: {protectedData}
        </p>
      )}

      {errorMessage && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          ❌ Error: {errorMessage}
        </p>
      )}
    </div>
  );
};

export default App;
