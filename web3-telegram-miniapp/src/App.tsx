import { IExecDataProtector } from "@iexec/dataprotector";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { useEffect, useState } from "react";

const CHAIN_ID = 0x86; // Bellecour Chain ID

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
    ethereum?: any;
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
      setErrorMessage(null); // Reset error message
      console.log("🔍 Initializing WalletConnect...");

      const wcProvider = await EthereumProvider.init({
        projectId: "b2e4ce8c8c62a7815f1b264f625182dd",
        chains: [CHAIN_ID],
        rpcMap: { [CHAIN_ID]: "https://bellecour.iex.ec" },
        showQrModal: false,
        logger: "debug",
      });

      let walletConnectURI = "";
      let uriGenerated = false;

      wcProvider.on("display_uri", (uri) => {
        walletConnectURI = uri;
        uriGenerated = true;
        console.log("🚀 WalletConnect URI Generated:", walletConnectURI);
      });

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("❌ WalletConnect session timed out!")), 15000)
      );

      await Promise.race([wcProvider.connect(), timeout]);

      if (uriGenerated) {
        const metamaskURL = `wc:${encodeURIComponent(walletConnectURI)}`;
        console.log("🔗 Opening MetaMask with WalletConnect:", metamaskURL);
        window.location.href = metamaskURL;
      } else {
        throw new Error("❌ No WalletConnect URI generated.");
      }

      const iexecDataProtector = new IExecDataProtector(wcProvider);

      console.log("🔄 Initiating data protection...");
      const dataToProtect = {
        email: "user@example.com", // Replace with actual data
        telegramId: "12345678", // Example Telegram user ID
      };

      const { transactionHash } = await iexecDataProtector.core.protectData({
        data: dataToProtect,
      });

      console.log("✅ Data protected successfully:", transactionHash);
      setProtectedData(transactionHash);
    } catch (error) {
      console.error("❌ Error during protectData process:", error);
      setErrorMessage((error as Error).message || "Unknown error occurred.");
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
