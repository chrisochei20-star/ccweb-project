import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";

const CHAINS = [
  { id: "ethereum", label: "Ethereum", wallet: "metamask" },
  { id: "polygon", label: "Polygon", wallet: "metamask" },
  { id: "bnb", label: "BNB Chain", wallet: "metamask" },
  { id: "solana", label: "Solana", wallet: "phantom" },
];

const PALETTE = [
  { type: "wallet-connect", label: "Wallet connect", hint: "MetaMask / Phantom", icon: "🔗" },
  { type: "token-display", label: "Token display", hint: "Name, balance, symbol", icon: "🪙" },
  { type: "nft-mint", label: "NFT mint button", hint: "Mint flow CTA", icon: "✨" },
  { type: "payment", label: "Payment module", hint: "Amount + pay CTA", icon: "💳" },
];

const VISUAL_TEMPLATES = [
  {
    id: "token-launcher",
    title: "Token launcher",
    description: "ERC-20 style launch page with wallet, metrics, and pay-to-deploy.",
    contractTemplateId: "erc20",
    defaultBlocks: ["wallet-connect", "token-display", "payment"],
    allowedChains: ["ethereum", "polygon", "bnb"],
  },
  {
    id: "nft-mint-site",
    title: "NFT mint site",
    description: "Collection mint experience with wallet gate and mint CTA.",
    contractTemplateId: "erc721",
    defaultBlocks: ["wallet-connect", "nft-mint", "payment"],
    allowedChains: ["ethereum", "polygon", "bnb"],
  },
  {
    id: "dao-dashboard",
    title: "DAO dashboard",
    description: "Governance-focused layout: connect, token context, and treasury pay.",
    contractTemplateId: "dao",
    defaultBlocks: ["wallet-connect", "token-display", "payment"],
    allowedChains: ["ethereum", "polygon"],
  },
  {
    id: "payment-app",
    title: "Payment app",
    description: "Simple checkout-style flow for on-chain settlement.",
    contractTemplateId: "erc20",
    defaultBlocks: ["wallet-connect", "payment", "token-display"],
    allowedChains: ["ethereum", "polygon", "bnb"],
  },
  {
    id: "solana-token-app",
    title: "Solana token app",
    description: "SPL-focused layout with Phantom wallet flow.",
    contractTemplateId: "spl-token",
    defaultBlocks: ["wallet-connect", "token-display", "payment"],
    allowedChains: ["solana"],
  },
];

function uid() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultChainForTemplate(tpl) {
  return tpl.allowedChains[0] || "ethereum";
}

function generateReactSource({ appName, chainLabel, blocks }) {
  const lines = [
    `// CCWEB Visual DApp Builder — generated preview (${new Date().toISOString().slice(0, 10)})`,
    `// Replace mock handlers with ethers.js / @solana/web3.js in production.`,
    `import { useState } from "react";`,
    ``,
    `export default function ${appName.replace(/[^a-zA-Z0-9]/g, "") || "Generated"}Dapp() {`,
    `  const [connected, setConnected] = useState(false);`,
    `  const chain = "${chainLabel}";`,
    ``,
  ];

  for (const b of blocks) {
    if (b.type === "wallet-connect") {
      lines.push(`  const connectWallet = () => setConnected(true);`);
      break;
    }
  }
  lines.push(``);

  lines.push(`  return (`);
  lines.push(`    <main style={{ maxWidth: 480, margin: "0 auto", padding: 24, fontFamily: "system-ui" }}>`);
  lines.push(`      <p style={{ opacity: 0.7, fontSize: 13 }}>Chain: {chain}</p>`);

  for (const b of blocks) {
    const key = b.id;
    if (b.type === "wallet-connect") {
      lines.push(`      <section key="${key}" style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid #223" }}>`);
      lines.push(`        <h2 style={{ margin: "0 0 8px" }}>${escapeJs(b.title || "Connect wallet")}</h2>`);
      lines.push(`        <button type="button" onClick={connectWallet}>{connected ? "Connected" : "Connect wallet"}</button>`);
      lines.push(`      </section>`);
    }
    if (b.type === "token-display") {
      lines.push(`      <section key="${key}" style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid #223" }}>`);
      lines.push(`        <h2 style={{ margin: "0 0 8px" }}>${escapeJs(b.title || "Token")}</h2>`);
      lines.push(`        <p style={{ margin: 0 }}>Symbol · Balance · Price (bind to contract read)</p>`);
      lines.push(`      </section>`);
    }
    if (b.type === "nft-mint") {
      lines.push(`      <section key="${key}" style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid #334" }}>`);
      lines.push(`        <h2 style={{ margin: "0 0 8px" }}>${escapeJs(b.title || "Mint NFT")}</h2>`);
      lines.push(`        <button type="button">Mint (1)</button>`);
      lines.push(`      </section>`);
    }
    if (b.type === "payment") {
      lines.push(`      <section key="${key}" style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: "1px solid #223" }}>`);
      lines.push(`        <h2 style={{ margin: "0 0 8px" }}>${escapeJs(b.title || "Pay")}</h2>`);
      lines.push(`        <button type="button">Confirm payment</button>`);
      lines.push(`      </section>`);
    }
  }

  lines.push(`    </main>`);
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);
  return lines.join("\n");
}

function escapeJs(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\u003c");
}

function BlockPreview({ block, preview }) {
  const wrap = "rounded-xl border border-white/15 bg-black/35 px-4 py-3 text-left text-white shadow-inner";
  switch (block.type) {
    case "wallet-connect":
      return (
        <div className={wrap}>
          <p className="text-xs font-medium uppercase tracking-wide text-ccweb-cyan">{block.title || "Wallet"}</p>
          <button
            type="button"
            disabled={preview}
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-ccweb-cyan to-ccweb-violet py-2 text-sm font-semibold text-[#061329] disabled:opacity-80"
          >
            {preview ? "Connect wallet" : "Connect (design)"}
          </button>
        </div>
      );
    case "token-display":
      return (
        <div className={wrap}>
          <p className="text-xs text-ccweb-muted">{block.title || "Token"}</p>
          <p className="mt-1 text-lg font-semibold">CCWEB</p>
          <p className="text-sm text-ccweb-muted">$0.00 · 0 tokens</p>
        </div>
      );
    case "nft-mint":
      return (
        <div className={wrap}>
          <p className="text-xs text-ccweb-muted">{block.title || "Mint"}</p>
          <button
            type="button"
            disabled={preview}
            className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 py-2 text-sm font-medium text-white disabled:opacity-90"
          >
            Mint NFT
          </button>
        </div>
      );
    case "payment":
      return (
        <div className={wrap}>
          <p className="text-xs text-ccweb-muted">{block.title || "Payment"}</p>
          <p className="mt-1 text-2xl font-bold text-ccweb-green">$99.00</p>
          <button
            type="button"
            disabled={preview}
            className="mt-2 w-full rounded-lg bg-ccweb-green/90 py-2 text-sm font-semibold text-[#061329] disabled:opacity-90"
          >
            Pay now
          </button>
        </div>
      );
    default:
      return null;
  }
}

export function VisualDappBuilderPage() {
  const [viewMode, setViewMode] = useState("design");
  const [visualTemplateId, setVisualTemplateId] = useState("token-launcher");
  const [blocks, setBlocks] = useState(() =>
    VISUAL_TEMPLATES[0].defaultBlocks.map((type) => ({ id: uid(), type, title: "" })),
  );
  const [selectedId, setSelectedId] = useState(null);
  const [chainId, setChainId] = useState("ethereum");
  const [appName, setAppName] = useState("My CCWEB DApp");

  const [templates, setTemplates] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [prices, setPrices] = useState({});
  const [contractName, setContractName] = useState("My Token");
  const [contractSymbol, setContractSymbol] = useState("WEB");
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletType, setWalletType] = useState("");
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [error, setError] = useState("");
  const [deployOpen, setDeployOpen] = useState(false);

  const visualTpl = useMemo(() => VISUAL_TEMPLATES.find((t) => t.id === visualTemplateId) || VISUAL_TEMPLATES[0], [visualTemplateId]);

  const serverTemplate = useMemo(() => templates.find((t) => t.id === visualTpl.contractTemplateId), [templates, visualTpl]);

  const allowedNetworks = useMemo(() => {
    if (!networks.length) return [];
    return networks.filter((n) => visualTpl.allowedChains.includes(n.id));
  }, [networks, visualTpl]);

  const currentNetwork = useMemo(() => allowedNetworks.find((n) => n.id === chainId) || allowedNetworks[0], [allowedNetworks, chainId]);

  useEffect(() => {
    fetch("/api/dapp/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []));
    fetch("/api/dapp/networks")
      .then((r) => r.json())
      .then((d) => setNetworks(d.networks || []));
    fetch("/api/dapp/prices")
      .then((r) => r.json())
      .then((d) => setPrices(d.prices || {}));
  }, []);

  useEffect(() => {
    const first = visualTpl.allowedChains.includes(chainId) ? chainId : defaultChainForTemplate(visualTpl);
    if (first !== chainId) setChainId(first);
  }, [visualTpl, chainId]);

  useEffect(() => {
    const net = allowedNetworks.find((n) => n.id === chainId);
    if (net?.wallet === "phantom") setSelectedToken("SOL");
    else if (selectedToken === "SOL") setSelectedToken("ETH");
  }, [chainId, allowedNetworks, selectedToken]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  const chainLabel = CHAINS.find((c) => c.id === chainId)?.label || chainId;

  const generatedCode = useMemo(
    () => generateReactSource({ appName, chainLabel, blocks }),
    [appName, chainLabel, blocks],
  );

  const connectWallet = useCallback((type) => {
    const mockAddress =
      type === "phantom"
        ? `${[...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, "0")).join("")}...sol`
        : `0x${[...crypto.getRandomValues(new Uint8Array(20))].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
    setWalletAddress(mockAddress);
    setWalletConnected(true);
    setWalletType(type);
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress("");
    setWalletConnected(false);
    setWalletType("");
  }, []);

  const onPaletteDragStart = (e, type) => {
    e.dataTransfer.setData("application/ccweb-component", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const onCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const onCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/ccweb-component");
    if (!type) return;
    setBlocks((prev) => [...prev, { id: uid(), type, title: "" }]);
    setDeployResult(null);
  };

  const onBlockDragStart = (e, index) => {
    e.dataTransfer.setData("application/ccweb-reorder", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const onBlockDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onBlockDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const from = e.dataTransfer.getData("application/ccweb-reorder");
    if (from === "") return;
    const fromIndex = Number(from);
    if (Number.isNaN(fromIndex) || fromIndex === targetIndex) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const applyVisualTemplate = (tpl) => {
    setVisualTemplateId(tpl.id);
    setBlocks(tpl.defaultBlocks.map((type) => ({ id: uid(), type, title: "" })));
    setSelectedId(null);
    setDeployResult(null);
    setChainId(defaultChainForTemplate(tpl));
    setAppName(tpl.title);
    setContractName(tpl.title.replace(/\s+/g, " "));
    setContractSymbol(tpl.contractTemplateId === "erc721" ? "NFT" : tpl.contractTemplateId === "dao" ? "GOV" : "TKN");
  };

  const updateBlockTitle = (id, title) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
  };

  const tokenOptions = currentNetwork?.wallet === "phantom" ? ["SOL"] : ["ETH", "MATIC", "USDC", "BNB"];
  const feeUsd = serverTemplate?.baseFeeUsd ?? 0;
  const tokenPrice = prices[selectedToken];
  const feeInToken = tokenPrice ? (feeUsd / tokenPrice.priceUsd).toFixed(6) : "—";

  async function handleDeploy() {
    if (!serverTemplate) {
      setError("Templates are still loading. Try again in a moment.");
      return;
    }
    if (!walletConnected) {
      setError("Connect a wallet to continue.");
      return;
    }
    if (!contractName.trim() || !contractSymbol.trim()) {
      setError("Contract name and symbol are required.");
      return;
    }

    setDeploying(true);
    setError("");
    const idempotencyKey = `visual-${walletAddress}-${serverTemplate.id}-${chainId}-${Date.now()}`;

    try {
      const resp = await fetch("/api/dapp/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: serverTemplate.id,
          network: chainId,
          paymentToken: selectedToken,
          contractName: contractName.trim(),
          contractSymbol: contractSymbol.trim().toUpperCase(),
          walletAddress,
          parameters: { visualLayout: visualTpl.id, blocks: blocks.map((b) => ({ type: b.type, title: b.title })) },
          idempotencyKey,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Deployment failed.");
        setDeploying(false);
        return;
      }
      setDeployResult(data);
    } catch {
      setError("Network error.");
    }
    setDeploying(false);
  }

  const estimatedGas = serverTemplate?.estimatedGas || "—";

  return (
    <div className="min-h-screen bg-gradient-to-b from-ccweb-bg via-[#061229] to-[#020814] px-4 py-8 text-white md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-ccweb-border bg-ccweb-card p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-cyan">Visual DApp Builder</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">Design, preview, and deploy</h1>
              <p className="mt-2 max-w-2xl text-sm text-ccweb-muted">
                Drag components onto the canvas, pick a product template, then connect MetaMask (EVM) or Phantom (Solana) for a
                guided deploy. Generated code is a starting point — wire real RPC calls before mainnet use.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/dapp-dashboard"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-ccweb-muted transition hover:border-ccweb-cyan/40 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => setDeployOpen(true)}
                className="rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet px-4 py-2 text-sm font-semibold text-[#061329]"
              >
                Deploy flow
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === "design" ? "bg-white/15 text-white" : "text-ccweb-muted"}`}
                onClick={() => setViewMode("design")}
              >
                Design
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium ${viewMode === "preview" ? "bg-white/15 text-white" : "text-ccweb-muted"}`}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-ccweb-muted">Chain</span>
              <select
                value={chainId}
                onChange={(e) => setChainId(e.target.value)}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {CHAINS.filter((c) => visualTpl.allowedChains.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {walletConnected ? (
                <>
                  <span className="rounded-lg bg-black/40 px-3 py-1.5 font-mono text-xs text-ccweb-green">
                    {walletType === "phantom" ? "Phantom" : "MetaMask"} · {walletAddress.slice(0, 8)}…{walletAddress.slice(-4)}
                  </span>
                  <button
                    type="button"
                    onClick={disconnectWallet}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-ccweb-muted hover:text-white"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => connectWallet("metamask")}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:border-ccweb-cyan/50"
                  >
                    MetaMask
                  </button>
                  {visualTpl.allowedChains.includes("solana") && (
                    <button
                      type="button"
                      onClick={() => {
                        setChainId("solana");
                        connectWallet("phantom");
                      }}
                      className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium hover:border-ccweb-violet/50"
                    >
                      Phantom (Solana)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="space-y-4 lg:col-span-3">
            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-white">Components</h2>
              <p className="mt-1 text-xs text-ccweb-muted">Drag onto the canvas ({viewMode === "preview" ? "switch to Design to edit" : ""})</p>
              <ul className="mt-3 space-y-2">
                {PALETTE.map((p) => (
                  <li key={p.type}>
                    <div
                      draggable={viewMode === "design"}
                      onDragStart={(e) => onPaletteDragStart(e, p.type)}
                      className={`flex cursor-grab items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 active:cursor-grabbing ${viewMode === "preview" ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{p.label}</p>
                        <p className="text-xs text-ccweb-muted">{p.hint}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <h2 className="text-sm font-semibold text-white">Templates</h2>
              <p className="mt-1 text-xs text-ccweb-muted">Resets canvas to a curated layout</p>
              <div className="mt-3 space-y-2">
                {VISUAL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyVisualTemplate(tpl)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      visualTpl.id === tpl.id
                        ? "border-ccweb-cyan/60 bg-ccweb-cyan/10 text-white"
                        : "border-white/10 bg-black/25 text-ccweb-muted hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold">{tpl.title}</span>
                    <span className="mt-0.5 block text-xs opacity-80">{tpl.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <main className="lg:col-span-5">
            <div
              onDragOver={viewMode === "design" ? onCanvasDragOver : undefined}
              onDrop={viewMode === "design" ? onCanvasDrop : undefined}
              className={`min-h-[420px] rounded-2xl border-2 border-dashed p-4 backdrop-blur-xl md:min-h-[520px] ${
                viewMode === "design" ? "border-ccweb-cyan/35 bg-ccweb-card" : "border-white/10 bg-black/25"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ccweb-muted">Canvas</p>
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    disabled={viewMode === "preview"}
                    className="mt-1 w-full max-w-xs border-none bg-transparent text-lg font-semibold text-white outline-none ring-0 disabled:opacity-90"
                    placeholder="App name"
                  />
                </div>
                <span className="rounded-lg bg-black/40 px-2 py-1 text-xs text-ccweb-muted">{chainLabel}</span>
              </div>

              <div className="mx-auto flex max-w-md flex-col gap-3">
                {blocks.length === 0 && (
                  <p className="py-16 text-center text-sm text-ccweb-muted">
                    {viewMode === "design" ? "Drop components here to build your layout." : "Nothing to preview yet."}
                  </p>
                )}
                {blocks.map((block, index) => (
                  <div
                    key={block.id}
                    draggable={viewMode === "design"}
                    onDragStart={(e) => onBlockDragStart(e, index)}
                    onDragOver={viewMode === "design" ? onBlockDragOver : undefined}
                    onDrop={viewMode === "design" ? (e) => onBlockDrop(e, index) : undefined}
                    onClick={() => viewMode === "design" && setSelectedId(block.id)}
                    className={`relative rounded-2xl transition ${
                      selectedId === block.id && viewMode === "design" ? "ring-2 ring-ccweb-cyan/70 ring-offset-2 ring-offset-[#061229]" : ""
                    }`}
                  >
                    {viewMode === "design" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#0a1428] text-xs font-bold text-white shadow-lg hover:bg-red-500/80"
                        aria-label="Remove block"
                      >
                        ×
                      </button>
                    )}
                    <BlockPreview block={block} preview={viewMode === "preview"} />
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside className="space-y-4 lg:col-span-4">
            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <h2 className="text-sm font-semibold">Generated code</h2>
              <p className="mt-1 text-xs text-ccweb-muted">React snippet from your canvas</p>
              <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/50 p-3 text-[11px] leading-relaxed text-ccweb-muted">
                <code>{generatedCode}</code>
              </pre>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(generatedCode)}
                className="mt-2 w-full rounded-xl border border-white/15 py-2 text-sm font-medium text-white hover:bg-white/5"
              >
                Copy code
              </button>
            </section>

            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <h2 className="text-sm font-semibold">Selection</h2>
              {selectedBlock && viewMode === "design" ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-ccweb-muted">
                    Component: <span className="text-white">{selectedBlock.type}</span>
                  </p>
                  <label className="block text-xs text-ccweb-muted">Block title (optional)</label>
                  <input
                    value={selectedBlock.title}
                    onChange={(e) => updateBlockTitle(selectedBlock.id, e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                    placeholder="Headline on canvas"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-ccweb-muted">Select a block on the canvas to edit its label.</p>
              )}
            </section>

            <section className="rounded-2xl border border-ccweb-border bg-ccweb-card p-4 backdrop-blur-xl">
              <h2 className="text-sm font-semibold">Contract & gas</h2>
              <p className="mt-1 text-xs text-ccweb-muted">
                Maps to <span className="text-ccweb-cyan">{serverTemplate?.name || "…"}</span> · Est. gas {estimatedGas}
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <input
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                  placeholder="Contract name"
                />
                <input
                  value={contractSymbol}
                  onChange={(e) => setContractSymbol(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                  placeholder="SYMBOL"
                  maxLength={10}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {deployOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ccweb-border bg-[#061329] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-white">Deploy smart contract</h3>
                <p className="mt-1 text-xs text-ccweb-muted">One-click deploy (simulated). Includes fee estimate.</p>
              </div>
              <button type="button" className="text-ccweb-muted hover:text-white" onClick={() => setDeployOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex justify-between text-ccweb-muted">
                  <span>Network</span>
                  <span className="text-white">{currentNetwork?.name || chainId}</span>
                </div>
                <div className="mt-2 flex justify-between text-ccweb-muted">
                  <span>Platform fee</span>
                  <span className="text-white">${feeUsd} USD</span>
                </div>
                <div className="mt-2 flex justify-between text-ccweb-muted">
                  <span>Est. gas (template)</span>
                  <span className="text-white">{estimatedGas}</span>
                </div>
              </div>

              <label className="block text-xs text-ccweb-muted">Pay with</label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              >
                {tokenOptions.map((t) => (
                  <option key={t} value={t}>
                    {t} — ${prices[t]?.priceUsd ?? "…"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-ccweb-muted">
                ≈ {feeInToken} {selectedToken} for this deployment (demo pricing).
              </p>

              {error && <p className="text-sm text-red-400">{error}</p>}

              {deployResult && (
                <div className="rounded-xl border border-ccweb-green/40 bg-ccweb-green/10 p-3 text-sm">
                  <p className="font-semibold text-ccweb-green">Deployed</p>
                  <p className="mt-1 break-all font-mono text-xs text-white">{deployResult.contractAddress}</p>
                  <a
                    href={deployResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-ccweb-cyan underline"
                  >
                    View on explorer
                  </a>
                </div>
              )}

              <button
                type="button"
                disabled={deploying}
                onClick={handleDeploy}
                className="w-full rounded-xl bg-gradient-to-r from-ccweb-cyan to-ccweb-violet py-3 text-sm font-semibold text-[#061329] disabled:opacity-60"
              >
                {deploying ? "Deploying…" : walletConnected ? "One-click deploy" : "Connect wallet first"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
