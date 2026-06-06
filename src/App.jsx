import { useState, useEffect, useRef } from "react";

const PAIRS = ["BTC-USDC", "ETH-USDC", "SOL-USDC", "ARB-USDC", "BNB-USDC"];

const PRICES = {
  "BTC-USDC": { price: 108432.5, change: 2.34, high: 109800, low: 106200 },
  "ETH-USDC": { price: 3842.1, change: -1.12, high: 3920, low: 3780 },
  "SOL-USDC": { price: 178.45, change: 3.87, high: 182, low: 172 },
  "ARB-USDC": { price: 1.243, change: -0.54, high: 1.29, low: 1.21 },
  "BNB-USDC": { price: 612.3, change: 1.22, high: 618, low: 604 },
};

function generateOrderBook(midPrice, spread = 0.0003) {
  const asks = [];
  const bids = [];
  for (let i = 0; i < 14; i++) {
    const askPrice = midPrice * (1 + spread + i * 0.0002);
    const bidPrice = midPrice * (1 - spread - i * 0.0002);
    asks.unshift({ price: askPrice, size: +(Math.random() * 3 + 0.1).toFixed(3), total: 0 });
    bids.push({ price: bidPrice, size: +(Math.random() * 3 + 0.1).toFixed(3), total: 0 });
  }
  let askTotal = 0;
  asks.forEach((a) => { askTotal += a.size; a.total = +askTotal.toFixed(3); });
  let bidTotal = 0;
  bids.forEach((b) => { bidTotal += b.size; b.total = +bidTotal.toFixed(3); });
  return { asks, bids };
}

function generateCandles(basePrice, count = 80) {
  const candles = [];
  let price = basePrice * 0.92;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.012;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    const vol = Math.random() * 100 + 20;
    candles.push({ t: now - i * 900000, o: open, h: high, l: low, c: close, v: vol });
    price = close;
  }
  return candles;
}

function CandleChart({ pair, currentPrice }) {
  const canvasRef = useRef(null);
  const candles = useRef(generateCandles(currentPrice));

  useEffect(() => {
    candles.current = generateCandles(currentPrice);
  }, [pair]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const data = candles.current;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, W, H);

    const padL = 10, padR = 70, padT = 20, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const prices = data.flatMap((c) => [c.h, c.l]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const priceRange = maxP - minP;

    const toY = (p) => padT + chartH - ((p - minP) / priceRange) * chartH;
    const candleW = Math.max(2, (chartW / data.length) * 0.7);
    const gap = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = "#1a2035";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const price = maxP - (priceRange / 5) * i;
      ctx.fillStyle = "#4a5568";
      ctx.font = "10px 'Courier New'";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(price > 100 ? 1 : 4), W - padR + 5, y + 4);
    }

    // Volume bars
    const maxVol = Math.max(...data.map((c) => c.v));
    data.forEach((c, i) => {
      const x = padL + i * gap + gap / 2;
      const isUp = c.c >= c.o;
      const volH = (c.v / maxVol) * (chartH * 0.15);
      ctx.fillStyle = isUp ? "rgba(0,255,136,0.15)" : "rgba(255,72,72,0.15)";
      ctx.fillRect(x - candleW / 2, padT + chartH - volH, candleW, volH);
    });

    // Candles
    data.forEach((c, i) => {
      const x = padL + i * gap + gap / 2;
      const isUp = c.c >= c.o;
      const color = isUp ? "#00ff88" : "#ff4848";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.h));
      ctx.lineTo(x, toY(c.l));
      ctx.stroke();

      const bodyTop = toY(Math.max(c.o, c.c));
      const bodyBot = toY(Math.min(c.o, c.c));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Current price line
    const lastClose = data[data.length - 1].c;
    const lineY = toY(lastClose);
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, lineY);
    ctx.lineTo(W - padR, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#00d4ff";
    ctx.fillRect(W - padR, lineY - 10, padR, 20);
    ctx.fillStyle = "#0a0e1a";
    ctx.font = "bold 10px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(lastClose.toFixed(lastClose > 100 ? 1 : 4), W - padR + padR / 2, lineY + 4);
  }, [pair, currentPrice]);

  return (
    <canvas
      ref={canvasRef}
      width={820}
      height={340}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

function OrderBook({ pair }) {
  const { price } = PRICES[pair];
  const [book, setBook] = useState(generateOrderBook(price));

  useEffect(() => {
    setBook(generateOrderBook(price));
    const interval = setInterval(() => {
      setBook(generateOrderBook(price * (1 + (Math.random() - 0.5) * 0.001)));
    }, 1500);
    return () => clearInterval(interval);
  }, [pair]);

  const maxTotal = Math.max(...book.asks.map((a) => a.total), ...book.bids.map((b) => b.total));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Courier New', monospace" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "6px 10px", borderBottom: "1px solid #1a2035" }}>
        {["Price (USDC)", "Size", "Total"].map((h) => (
          <span key={h} style={{ fontSize: 10, color: "#4a5568", textAlign: h === "Price (USDC)" ? "left" : "right" }}>{h}</span>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {/* Asks */}
        {book.asks.map((row, i) => (
          <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "2px 10px", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#111827"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "rgba(255,72,72,0.07)", width: `${(row.total / maxTotal) * 100}%` }} />
            <span style={{ fontSize: 11, color: "#ff4848", position: "relative" }}>{row.price.toFixed(price > 100 ? 1 : 5)}</span>
            <span style={{ fontSize: 11, color: "#c8d6ef", textAlign: "right", position: "relative" }}>{row.size}</span>
            <span style={{ fontSize: 11, color: "#4a5568", textAlign: "right", position: "relative" }}>{row.total}</span>
          </div>
        ))}

        {/* Spread */}
        <div style={{ padding: "6px 10px", borderTop: "1px solid #1a2035", borderBottom: "1px solid #1a2035", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: "bold", color: price > 0 ? "#00ff88" : "#ff4848" }}>
            {price.toLocaleString(undefined, { minimumFractionDigits: price > 100 ? 1 : 4 })}
          </span>
          <span style={{ fontSize: 10, color: "#4a5568" }}>Spread 0.01%</span>
        </div>

        {/* Bids */}
        {book.bids.map((row, i) => (
          <div key={i} style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "2px 10px", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#111827"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, background: "rgba(0,255,136,0.07)", width: `${(row.total / maxTotal) * 100}%` }} />
            <span style={{ fontSize: 11, color: "#00ff88", position: "relative" }}>{row.price.toFixed(price > 100 ? 1 : 5)}</span>
            <span style={{ fontSize: 11, color: "#c8d6ef", textAlign: "right", position: "relative" }}>{row.size}</span>
            <span style={{ fontSize: 11, color: "#4a5568", textAlign: "right", position: "relative" }}>{row.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradePanel({ pair, usdcBalance = "0.00", connected = false }) {
  const [side, setSide] = useState("long");
  const [orderType, setOrderType] = useState("market");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [limitPrice, setLimitPrice] = useState("");
  const { price } = PRICES[pair];
  const asset = pair.split("-")[0];

  const notional = size ? (parseFloat(size) * price * leverage).toFixed(2) : "0.00";
  const fee = size ? (parseFloat(notional) * 0.0005).toFixed(4) : "0.0000";
  const liqPrice = size && side === "long"
    ? (price * (1 - 1 / leverage + 0.005)).toFixed(price > 100 ? 1 : 4)
    : size ? (price * (1 + 1 / leverage - 0.005)).toFixed(price > 100 ? 1 : 4) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16, height: "100%", boxSizing: "border-box" }}>
      {/* Long/Short */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {["long", "short"].map((s) => (
          <button key={s} onClick={() => setSide(s)} style={{
            padding: "10px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13,
            fontFamily: "'Courier New', monospace", letterSpacing: 1, transition: "all 0.15s",
            background: side === s ? (s === "long" ? "#00ff88" : "#ff4848") : "#111827",
            color: side === s ? "#0a0e1a" : (s === "long" ? "#00ff88" : "#ff4848"),
          }}>{s.toUpperCase()}</button>
        ))}
      </div>

      {/* Order type */}
      <div style={{ display: "flex", gap: 4, background: "#111827", borderRadius: 6, padding: 3 }}>
        {["market", "limit", "stop"].map((t) => (
          <button key={t} onClick={() => setOrderType(t)} style={{
            flex: 1, padding: "6px 0", border: "none", borderRadius: 4, cursor: "pointer",
            fontSize: 11, fontFamily: "'Courier New', monospace", fontWeight: 600,
            background: orderType === t ? "#1e2d4a" : "transparent",
            color: orderType === t ? "#00d4ff" : "#4a5568", transition: "all 0.15s",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* Limit price */}
      {orderType === "limit" && (
        <div>
          <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>Limit Price (USDC)</label>
          <input value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
            placeholder={price.toFixed(price > 100 ? 1 : 4)}
            style={{ width: "100%", background: "#111827", border: "1px solid #1e2d4a", borderRadius: 6, padding: "8px 12px", color: "#c8d6ef", fontSize: 13, fontFamily: "'Courier New', monospace", boxSizing: "border-box", outline: "none", marginTop: 4 }} />
        </div>
      )}

      {/* Size */}
      <div>
        <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>Size ({asset})</label>
        <input value={size} onChange={e => setSize(e.target.value)} placeholder="0.000"
          style={{ width: "100%", background: "#111827", border: "1px solid #1e2d4a", borderRadius: 6, padding: "8px 12px", color: "#c8d6ef", fontSize: 13, fontFamily: "'Courier New', monospace", boxSizing: "border-box", outline: "none", marginTop: 4 }} />
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {[25, 50, 75, 100].map((pct) => (
            <button key={pct} style={{ flex: 1, padding: "4px 0", background: "#111827", border: "1px solid #1e2d4a", borderRadius: 4, color: "#4a5568", fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#00d4ff"; e.currentTarget.style.color = "#00d4ff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e2d4a"; e.currentTarget.style.color = "#4a5568"; }}>
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Leverage */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>Leverage</label>
          <span style={{ fontSize: 12, color: "#00d4ff", fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{leverage}x</span>
        </div>
        <input type="range" min={1} max={50} value={leverage} onChange={e => setLeverage(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#00d4ff", cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
          {[1, 5, 10, 20, 50].map((l) => (
            <button key={l} onClick={() => setLeverage(l)} style={{ background: leverage === l ? "#1e2d4a" : "transparent", border: "none", color: leverage === l ? "#00d4ff" : "#4a5568", fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer", borderRadius: 3, padding: "2px 4px" }}>{l}x</button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div style={{ background: "#0d1526", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          ["Notional Value", `$${parseFloat(notional).toLocaleString()}`],
          ["Fee (0.05%)", `$${fee}`],
          ["Liq. Price", liqPrice === "—" ? "—" : `$${liqPrice}`],
          ["Available", connected ? `$${usdcBalance} USDC` : "Connect Wallet"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>{label}</span>
            <span style={{ fontSize: 11, color: "#c8d6ef", fontFamily: "'Courier New', monospace" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button style={{
        padding: "13px 0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700,
        fontSize: 14, fontFamily: "'Courier New', monospace", letterSpacing: 1.5,
        background: side === "long" ? "linear-gradient(135deg,#00ff88,#00c969)" : "linear-gradient(135deg,#ff4848,#cc2020)",
        color: "#0a0e1a", transition: "opacity 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
        {side === "long" ? "▲" : "▼"} {orderType.toUpperCase()} {side.toUpperCase()} {asset}
      </button>
    </div>
  );
}

function Positions() {
  const positions = [
    { pair: "BTC-USDC", side: "long", size: 0.12, entry: 107200, mark: 108432.5, lev: 10, pnl: 147.9, pnlPct: 1.15 },
    { pair: "ETH-USDC", side: "short", size: 1.5, entry: 3900, mark: 3842.1, lev: 5, pnl: 86.85, pnlPct: 2.23 },
  ];
  const [tab, setTab] = useState("positions");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #1a2035" }}>
        {["positions", "orders", "history"].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 18px", background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontFamily: "'Courier New', monospace", fontWeight: 600, letterSpacing: 0.5,
            color: tab === t ? "#00d4ff" : "#4a5568",
            borderBottom: tab === t ? "2px solid #00d4ff" : "2px solid transparent",
            transition: "all 0.15s",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)} {t === "positions" ? `(${positions.length})` : "(0)"}</button>
        ))}
      </div>
      {tab === "positions" ? (
        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Courier New', monospace" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1a2035" }}>
                {["Market", "Side", "Size", "Entry", "Mark", "Lev", "PnL", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", fontSize: 10, color: "#4a5568", textAlign: "left", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #0d1526" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#0d1526"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#c8d6ef", fontWeight: 700 }}>{p.pair}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ fontSize: 11, color: p.side === "long" ? "#00ff88" : "#ff4848", background: p.side === "long" ? "rgba(0,255,136,0.1)" : "rgba(255,72,72,0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{p.side.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#c8d6ef" }}>{p.size}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#c8d6ef" }}>${p.entry.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#c8d6ef" }}>${p.mark.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#00d4ff" }}>{p.lev}x</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 12, color: p.pnl >= 0 ? "#00ff88" : "#ff4848", fontWeight: 700 }}>
                      {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 10, color: p.pnl >= 0 ? "#00cc66" : "#cc3333" }}>
                      {p.pnl >= 0 ? "+" : ""}{p.pnlPct}%
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <button style={{ background: "none", border: "1px solid #1e2d4a", borderRadius: 4, color: "#ff4848", fontSize: 10, fontFamily: "'Courier New', monospace", cursor: "pointer", padding: "3px 10px" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,72,72,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}>
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>No open {tab}</span>
        </div>
      )}
    </div>
  );
}

// Arc Testnet configuration
const ARC_TESTNET = {
  chainId: "0x4CCE52", // 5042002 in hex
  chainName: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
};

// USDC contract address on Arc Testnet (system contract)
const USDC_CONTRACT = "0x3600000000000000000000000000000000000000";

async function fetchUSDCBalance(walletAddress) {
  try {
    // On Arc, USDC is the native token - read it like ETH balance
    const result = await window.ethereum.request({
      method: "eth_getBalance",
      params: [walletAddress, "latest"],
    });
    const raw = parseInt(result, 16);
    return (raw / 1e18).toFixed(2);
  } catch {
    return "0.00";
  }
}

export default function App() {
  const [pair, setPair] = useState("BTC-USDC");
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [tick, setTick] = useState(0);
  const [prices, setPrices] = useState(PRICES);

  // Auto reconnect if wallet was previously connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then(async (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
          const bal = await fetchUSDCBalance(accounts[0]);
          setUsdcBalance(bal);
        }
      });
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
          const bal = await fetchUSDCBalance(accounts[0]);
          setUsdcBalance(bal);
        } else {
          setWalletAddress("");
          setConnected(false);
          setUsdcBalance("0.00");
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const connectWallet = async () => {
    setWalletError("");
    if (!window.ethereum) {
      setWalletError("MetaMask not found! Please install MetaMask first.");
      return;
    }
    try {
      setIsConnecting(true);
      // Request wallet connection
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      // Switch to Arc Testnet
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARC_TESTNET.chainId }],
        });
      } catch (switchError) {
        // If Arc Testnet not added yet, add it automatically
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARC_TESTNET],
          });
        }
      }
      setWalletAddress(accounts[0]);
      setConnected(true);
      const bal = await fetchUSDCBalance(accounts[0]);
      setUsdcBalance(bal);
    } catch (err) {
      setWalletError("Connection cancelled. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setWalletAddress("");
    setUsdcBalance("0.00");
  };

  const shortAddress = walletAddress
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)
    : "";

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          const delta = (Math.random() - 0.5) * next[k].price * 0.0008;
          next[k] = { ...next[k], price: +(next[k].price + delta).toFixed(next[k].price > 100 ? 2 : 5) };
        });
        return next;
      });
      setTick((t) => t + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);


  const { price, change, high, low } = prices[pair];
  const asset = pair.split("-")[0];

  return (
    <div style={{ background: "#070c18", minHeight: "100vh", color: "#c8d6ef", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", fontSize: 13 }}>

      {/* Top Nav */}
      <div style={{ background: "#0a0e1a", borderBottom: "1px solid #1a2035", padding: "0 20px", display: "flex", alignItems: "center", gap: 24, height: 52 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* ArcDex Logo - Concept 1 Minimalist */}
          <svg width="38" height="40" viewBox="0 0 420 440" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="archGrad1" x1="70" y1="40" x2="200" y2="420" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="30%" stopColor="#eef2fa"/>
                <stop offset="65%" stopColor="#c0cfe8"/>
                <stop offset="100%" stopColor="#90a8cc"/>
              </linearGradient>
              <linearGradient id="dGrad1" x1="170" y1="200" x2="360" y2="430" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="30%" stopColor="#e8f0f8"/>
                <stop offset="65%" stopColor="#b8cce0"/>
                <stop offset="100%" stopColor="#8899bb"/>
              </linearGradient>
              <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="rgba(0,0,30,0.4)"/>
              </filter>
            </defs>
            <path d="M 62 420 L 62 185 Q 62 38 175 38 Q 288 38 288 185 L 288 222 Q 282 198 260 190 L 242 186 Q 240 90 175 90 Q 110 90 108 186 L 106 420 Z"
              fill="url(#archGrad1)" filter="url(#logoShadow)"/>
            <path d="M 106 420 L 106 190 Q 108 115 145 100 Q 118 114 114 190 L 114 420 Z" fill="rgba(255,255,255,0.15)"/>
            <path d="M 165 240 L 165 278 L 237 278 Q 287 278 287 338 Q 287 398 237 398 L 200 398 L 200 420 L 242 420 Q 340 420 340 338 Q 340 240 242 240 Z"
              fill="url(#dGrad1)" filter="url(#logoShadow)"/>
            <path d="M 167 243 L 240 243 Q 307 243 327 295 Q 303 250 245 247 L 167 247 Z" fill="rgba(255,255,255,0.18)"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2, color: "#fff", fontFamily: "'Courier New', monospace" }}>ArcDex</span>
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {["Trade", "Portfolio", "Markets", "Leaderboard"].map((item, i) => (
            <button key={item} style={{ background: i === 0 ? "rgba(0,212,255,0.1)" : "none", border: "none", color: i === 0 ? "#00d4ff" : "#4a5568", padding: "6px 14px", cursor: "pointer", fontSize: 13, borderRadius: 6, fontFamily: "'Courier New', monospace", fontWeight: 600, transition: "all 0.15s" }}
              onMouseEnter={e => { if (i !== 0) { e.currentTarget.style.color = "#c8d6ef"; } }}
              onMouseLeave={e => { if (i !== 0) { e.currentTarget.style.color = "#4a5568"; } }}>
              {item}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", borderRadius: 6, padding: "4px 12px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
              <span style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>Arc Testnet</span>
            </div>
            {connected ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", borderRadius: 6, padding: "7px 14px", border: "1px solid #1e2d4a" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
                  <span style={{ fontSize: 12, color: "#00ff88", fontFamily: "'Courier New', monospace", fontWeight: 700 }}>{shortAddress}</span>
                </div>
                <button onClick={disconnectWallet} style={{
                  padding: "7px 14px", borderRadius: 6, border: "1px solid #1e2d4a", cursor: "pointer",
                  background: "transparent", color: "#ff4848", fontSize: 11,
                  fontFamily: "'Courier New', monospace", transition: "all 0.15s",
                }}>Disconnect</button>
              </div>
            ) : (
              <button onClick={connectWallet} disabled={isConnecting} style={{
                padding: "7px 18px", borderRadius: 6, border: "none", cursor: "pointer",
                background: isConnecting ? "#1e2d4a" : "linear-gradient(135deg,#00d4ff,#0066ff)",
                color: "#fff", fontSize: 12, fontWeight: 700,
                fontFamily: "'Courier New', monospace", transition: "all 0.15s",
                boxShadow: "0 0 16px rgba(0,212,255,0.3)", opacity: isConnecting ? 0.7 : 1,
              }}>
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
          {walletError && (
            <div style={{ fontSize: 11, color: "#ff4848", fontFamily: "'Courier New', monospace", marginTop: -8 }}>
              ⚠ {walletError}
            </div>
          )}
        </div>
      </div>

      {/* Pair selector bar */}
      <div style={{ background: "#0a0e1a", borderBottom: "1px solid #1a2035", padding: "0 20px", display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
        {PAIRS.map((p) => {
          const d = prices[p];
          const isActive = p === pair;
          return (
            <button key={p} onClick={() => setPair(p)} style={{
              background: isActive ? "#0d1526" : "none", border: "none", borderBottom: isActive ? "2px solid #00d4ff" : "2px solid transparent",
              padding: "10px 20px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#fff" : "#c8d6ef", fontFamily: "'Courier New', monospace" }}>{p.split("-")[0]}</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: isActive ? "#fff" : "#c8d6ef", fontFamily: "'Courier New', monospace" }}>{d.price.toLocaleString(undefined, { minimumFractionDigits: d.price > 100 ? 1 : 4 })}</span>
                <span style={{ fontSize: 10, color: d.change >= 0 ? "#00ff88" : "#ff4848" }}>{d.change >= 0 ? "+" : ""}{d.change}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Market stats bar */}
      <div style={{ background: "#0a0e1a", borderBottom: "1px solid #1a2035", padding: "8px 20px", display: "flex", gap: 32, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: change >= 0 ? "#00ff88" : "#ff4848", fontFamily: "'Courier New', monospace", letterSpacing: 1 }}>
            ${price.toLocaleString(undefined, { minimumFractionDigits: price > 100 ? 1 : 4 })}
          </div>
          <div style={{ fontSize: 11, color: change >= 0 ? "#00ff88" : "#ff4848" }}>{change >= 0 ? "▲" : "▼"} {Math.abs(change)}% 24h</div>
        </div>
        {[
          ["24h High", `$${high.toLocaleString()}`],
          ["24h Low", `$${low.toLocaleString()}`],
          ["24h Volume", "$1.24B"],
          ["Open Interest", "$342.1M"],
          ["Funding Rate", "0.0102%/h"],
          ["Index Price", `$${price.toLocaleString(undefined, { minimumFractionDigits: price > 100 ? 1 : 4 })}`],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: "#4a5568" }}>{label}</div>
            <div style={{ fontSize: 12, color: "#c8d6ef", fontFamily: "'Courier New', monospace", marginTop: 2 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 260px 280px", gridTemplateRows: "1fr 220px", gap: 1, background: "#1a2035", overflow: "hidden", minHeight: 0 }}>

        {/* Chart */}
        <div style={{ background: "#0a0e1a", gridRow: 1, gridColumn: 1, overflow: "hidden", minHeight: 340 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2035", display: "flex", gap: 8 }}>
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button key={tf} style={{ background: tf === "15m" ? "#1e2d4a" : "none", border: "none", color: tf === "15m" ? "#00d4ff" : "#4a5568", fontSize: 11, cursor: "pointer", padding: "3px 8px", borderRadius: 4, fontFamily: "'Courier New', monospace", fontWeight: 600 }}>{tf}</button>
            ))}
          </div>
          <div style={{ height: "calc(100% - 42px)" }}>
            <CandleChart pair={pair} currentPrice={price} />
          </div>
        </div>

        {/* Order book */}
        <div style={{ background: "#0a0e1a", gridRow: "1 / 3", gridColumn: 2, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1a2035", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#c8d6ef", fontFamily: "'Courier New', monospace" }}>Order Book</span>
            <div style={{ display: "flex", gap: 4 }}>
              {["≡", "⬆", "⬇"].map((s, i) => (
                <button key={i} style={{ background: i === 0 ? "#1e2d4a" : "none", border: "none", color: i === 0 ? "#00d4ff" : "#4a5568", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontSize: 12 }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ height: "calc(100% - 44px)" }}>
            <OrderBook pair={pair} />
          </div>
        </div>

        {/* Trade panel */}
        <div style={{ background: "#0a0e1a", gridRow: "1 / 3", gridColumn: 3, overflow: "auto" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a2035" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#c8d6ef", fontFamily: "'Courier New', monospace" }}>Place Order</span>
          </div>
          <TradePanel pair={pair} usdcBalance={usdcBalance} connected={connected} />
        </div>

        {/* Positions */}
        <div style={{ background: "#0a0e1a", gridRow: 2, gridColumn: 1, overflow: "hidden", borderTop: "1px solid #1a2035" }}>
          <Positions />
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#0a0e1a", borderTop: "1px solid #1a2035", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 20 }}>
          {["Docs", "Discord", "Twitter", "Audit"].map((l) => (
            <span key={l} style={{ fontSize: 11, color: "#4a5568", cursor: "pointer", fontFamily: "'Courier New', monospace" }}
              onMouseEnter={e => e.currentTarget.style.color = "#c8d6ef"}
              onMouseLeave={e => e.currentTarget.style.color = "#4a5568"}>{l}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#4a5568", fontFamily: "'Courier New', monospace" }}>Built on Arc · Powered by Circle USDC</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 4px #00ff88" }} />
            <span style={{ fontSize: 11, color: "#00ff88", fontFamily: "'Courier New', monospace" }}>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
