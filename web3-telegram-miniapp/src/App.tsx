import { IExecDataProtector } from "@iexec/dataprotector";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { useEffect, useState } from "react";


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
        const wcProvider = await EthereumProvider.init({
          projectId: "b2e4ce8c8c62a7815f1b264f625182dd", // Your WalletConnect Project ID
          chains: [0x86], // Bellecour Chain ID
          rpcMap: { 0x86: "https://bellecour.iex.ec" },
          showQrModal: false,
          logger: "debug",
        });

        // Store URI manually when it's generated
        let walletConnectURI = "";
        wcProvider.on("display_uri", (uri) => {
          walletConnectURI = uri;
          console.log("🚀 WalletConnect URI Generated:", walletConnectURI);

          // 🚀 Force MetaMask to open using deep link
          const metamaskURL = `ethereum:${encodeURIComponent(walletConnectURI)}`;
          alert(`${metamaskURL}`);
          setTimeout(() => {
            window.location.href = metamaskURL;
          }, 1000);
        });

        await wcProvider.connect();
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
