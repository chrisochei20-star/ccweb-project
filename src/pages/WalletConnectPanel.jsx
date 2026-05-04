import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { PrimaryButton } from "../ui/PrimaryButton";
import { api, unwrap } from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { BrowserProvider } from "ethers";

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

export function WalletConnectPanel() {
  const { user, walletConnect, loading, error } = useAuthStore();
  const [status, setStatus] = useState("idle");
  const [address, setAddress] = useState("");
  const [wcProvider, setWcProvider] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    return () => {
      if (wcProvider?.disconnect) wcProvider.disconnect().catch(() => {});
    };
  }, [wcProvider]);

  async function connectMetaMask() {
    setStatus("connecting");
    setMsg(null);
    try {
      const eth = window.ethereum;
      if (!eth) throw new Error("MetaMask not detected. Install the extension or use WalletConnect.");
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      const nonceRes = await unwrap(api.post("/api/auth/wallet/nonce", { address: addr, chainType: "evm" }));
      const sig = await signer.signMessage(nonceRes.message);
      await walletConnect({
        address: addr,
        signature: sig,
        message: nonceRes.message,
        chainType: "evm",
        nonce: nonceRes.nonce,
      });
      setStatus("connected");
      setMsg("Wallet session established.");
    } catch (e) {
      setStatus("error");
      setMsg(e.message);
    }
  }

  async function connectWalletConnect() {
    if (!WC_PROJECT_ID) {
      setMsg("Set VITE_WALLETCONNECT_PROJECT_ID in .env for WalletConnect (see README).");
      setStatus("error");
      return;
    }
    setStatus("connecting");
    setMsg(null);
    try {
      const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
      const wc = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [1],
        showQrModal: true,
        metadata: {
          name: "CCWEB",
          description: "CCWEB sign-in",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      });
      setWcProvider(wc);
      await wc.connect();
      const ethersMod = await import("ethers");
      const provider = new ethersMod.BrowserProvider(wc);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
      const nonceRes = await unwrap(api.post("/api/auth/wallet/nonce", { address: addr, chainType: "evm" }));
      const sig = await signer.signMessage(nonceRes.message);
      await walletConnect({
        address: addr,
        signature: sig,
        message: nonceRes.message,
        chainType: "evm",
        nonce: nonceRes.nonce,
      });
      setStatus("connected");
      setMsg("Wallet session established.");
    } catch (e) {
      setStatus("error");
      setMsg(e.message || "WalletConnect failed");
    }
  }

  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-ccweb-text">Wallet sign-in</h3>
      <p className="mt-2 text-sm text-ccweb-muted">
        Connect with MetaMask or WalletConnect, sign the CCWEB message, and receive JWT tokens (same session as
        email login).
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <PrimaryButton type="button" disabled={loading || status === "connecting"} onClick={connectMetaMask}>
          MetaMask
        </PrimaryButton>
        <button
          type="button"
          disabled={loading || status === "connecting"}
          onClick={connectWalletConnect}
          className="inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-ccweb-text hover:bg-white/[0.1]"
        >
          WalletConnect
        </button>
      </div>
      {address ? (
        <p className="mt-3 font-mono text-xs text-ccweb-sky-200">
          Address: {address.slice(0, 6)}…{address.slice(-4)}
        </p>
      ) : null}
      {user ? (
        <p className="mt-2 text-xs text-ccweb-muted">
          Signed in as <strong>{user.displayName}</strong> ({user.id})
        </p>
      ) : null}
      {msg ? <p className={`mt-3 text-sm ${status === "error" ? "text-red-400" : "text-ccweb-green-400"}`}>{msg}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      {!WC_PROJECT_ID ? (
        <p className="mt-3 text-xs text-ccweb-muted">
          WalletConnect requires a project ID from{" "}
          <a href="https://cloud.reown.com/" className="text-ccweb-sky-300 underline" target="_blank" rel="noreferrer">
            Reown Cloud
          </a>
          .
        </p>
      ) : null}
    </GlassCard>
  );
}
