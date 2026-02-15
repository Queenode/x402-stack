# 🎉 PartyStacker — Decentralized Event Ticketing Powered by x402 + Stacks

> **The event industry is broken.** Scalpers, counterfeit tickets, hidden fees, and zero transparency. PartyStacker fixes all of it — with a single protocol.

---

## 🧠 The Vision

**PartyStacker reimagines event ticketing as a native internet payment flow.**

Today, buying a concert ticket means trusting a centralized middleman who charges 20–30% fees, controls your data, and can revoke your ticket at will. Artists get paid weeks later. Fans get gouged by scalpers. Organizers have no transparency into secondary markets.

**What if buying a ticket was as simple as loading a webpage?**

The [x402 protocol](https://www.x402.org/) introduces `HTTP 402 Payment Required` — the forgotten HTTP status code — as a native web payment standard. When a fan wants a ticket, the server responds with `402` and payment requirements. The fan's wallet pays directly. The organizer receives funds instantly. No middleman. No fees. No trust required.

**PartyStacker is the first event ticketing platform built entirely on this vision:**

```
Fan visits event page → Server returns 402 → Leather Wallet pays in STX → NFT ticket minted on-chain → QR code generated → Done.
```

Every ticket is an on-chain asset. Every payment is peer-to-peer. Every check-in is cryptographically verified. This isn't just better ticketing — it's a new primitive for how the internet handles paid access.

---

## 🏗️ What We Built

### Smart Contract (`Party-stacker-contract2`)
A Clarity smart contract deployed on Stacks Testnet that handles:
- **Multi-tier event creation** (General / VIP / Backstage) with independent pricing & capacity
- **On-chain ticket purchases** with STX post-conditions ensuring exact payment
- **NFT minting** for attendance proof (SIP-009 compatible)
- **Organizer revenue tracking** with transparent fund distribution

### x402 Payment Flow
The ticket purchase implements the full x402-stacks V2 protocol:
1. **402 Response** — Server responds with payment requirements (asset, amount, network, payTo address)
2. **Wallet Payment** — Fan reviews & signs transaction via Leather Wallet
3. **Payment Proof** — Client sends `X-PAYMENT` header with encoded transaction proof
4. **Ticket Issuance** — Server verifies payment, issues ticket + QR code

### Full-Stack Application
| Feature | Description |
|---|---|
| 🎫 **Create Events** | Multi-tier pricing, IPFS metadata, on-chain registration |
| 💳 **Buy Tickets** | x402 payment flow with Leather Wallet + STX |
| 📱 **QR Tickets** | Cryptographic QR codes with event + tier + owner data |
| ✅ **Verify & Check-in** | Camera-based QR scanning for event gatekeepers |
| 📊 **Analytics Dashboard** | Real-time sales, revenue, and check-in metrics |
| 🖼️ **NFT Attendance** | Auto-mint NFTs as proof-of-attendance on check-in |

---

## 🚀 Live Demo

**🌐 [https://x402-stack.vercel.app](https://x402-stack.vercel.app)**

### Quick Demo Flow

**As an Organizer:**
1. Connect Leather Wallet → Create Event → Set tiers & pricing → Sign transaction

**As a Fan:**
1. Browse events → Select tier → Server returns 402 → Pay with STX → Receive QR ticket

**As a Gatekeeper:**
1. Go to `/verify` → Scan attendee's QR → Confirm check-in → NFT minted

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| **Blockchain** | Stacks (Bitcoin L2), Clarity smart contracts |
| **Wallet** | Leather Wallet (@stacks/connect v8) |
| **Protocol** | x402-stacks V2 (HTTP 402 Payment Required) |
| **Storage** | IPFS via Pinata (event metadata) |
| **State** | Zustand (client), JSON DB (server) |
| **Deployment** | Vercel (frontend), Stacks Testnet (contracts) |

---

## 📁 Project Structure

```
contracts/
└── party-stacker.clar         # Clarity smart contract (multi-tier ticketing + NFT)

app/
├── page.tsx                    # Landing page with hero slider & event showcase
├── events/page.tsx             # Full events listing with search
├── create/page.tsx             # Multi-step event creation wizard
├── event/[id]/page.tsx         # Event detail + x402 ticket purchase
├── my-tickets/page.tsx         # User's tickets with QR codes
├── verify/page.tsx             # QR scanner for check-in
├── dashboard/page.tsx          # Organizer analytics
└── api/                        # x402-compliant API routes
    ├── events/                 # Event CRUD + on-chain fetching
    ├── tickets/purchase/       # x402 payment flow (402 → verify → issue)
    ├── tickets/checkin/        # Check-in + NFT mint trigger
    └── analytics/              # Real-time event metrics

lib/
├── stacks-api.ts              # On-chain read functions (get-event, get-all-tiers)
├── useStacksWallet.ts         # Leather Wallet hook (@stacks/connect v8)
├── x402-client.ts             # x402 payment encoding/headers
├── qr-utils.ts                # Cryptographic QR generation & verification
├── store.ts                   # Zustand wallet state
└── types.ts                   # TypeScript interfaces

components/
├── Navbar.tsx                 # Global navigation with wallet connect
├── HeroSlider.tsx             # Animated hero section
├── TierSelector.tsx           # Ticket tier selection cards
├── QRCodeDisplay.tsx          # Ticket QR code with event details
└── EventCard.tsx              # Event preview card
```

---

## 🔮 Roadmap & Future Vision

### Phase 1 — Foundation ✅ (Current)
- [x] Clarity smart contract with multi-tier ticketing
- [x] x402 payment flow for ticket purchases
- [x] Leather Wallet integration
- [x] QR-based check-in with NFT attendance proof
- [x] IPFS metadata storage via Pinata
- [x] Analytics dashboard for organizers

### Phase 2 — Scale
- [ ] **Mainnet deployment** — Move from Testnet to Stacks Mainnet
- [ ] **Database migration** — PostgreSQL/Supabase for production data persistence
- [ ] **Secondary marketplace** — On-chain ticket resales with organizer royalties (anti-scalping)
- [ ] **Dynamic pricing** — Algorithmic pricing based on demand curves

### Phase 3 — Protocol
- [ ] **Multi-chain support** — Extend x402 to Ethereum, Solana, and other L2s
- [ ] **Subscription tickets** — Season passes as recurring x402 payments
- [ ] **DAO governance** — Event organizer DAOs for community-governed festivals
- [ ] **Soulbound tickets** — Non-transferable tickets for exclusive events

### Phase 4 — Ecosystem
- [ ] **Widget SDK** — Embeddable ticket purchase widget for any website
- [ ] **Mobile app** — Native iOS/Android with NFC ticket scanning
- [ ] **Artist revenue splits** — On-chain royalty distribution to performers
- [ ] **Cross-event loyalty** — NFT-gated rewards across the PartyStacker network

---

## 🧪 Smart Contract

**Deployed on Stacks Testnet:**
- **Address:** `ST1B27X06M4SF2TE46G3VBA7KSR4KBMJCTK862QET`
- **Contract:** `Party-stacker-contract2`

### Key Functions

| Function | Description |
|---|---|
| `create-event` | Register event with 3 tiers (price + capacity each) |
| `buy-ticket` | Purchase ticket for a specific event + tier |
| `get-event` | Read event metadata from chain |
| `get-all-tiers` | Read all tier stats (price, capacity, sold) |
| `get-last-event-id` | Get total event count |

---

## 🏃 Getting Started

```bash
# Clone the repository
git clone https://github.com/Queenode/x402-stack.git
cd x402-stack

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Add your Pinata API keys

# Start development server
pnpm run dev
```

**Prerequisites:**
- Node.js 18+
- [Leather Wallet](https://leather.io) browser extension
- Stacks Testnet STX ([faucet](https://explorer.hiro.so/sandbox/faucet?chain=testnet))

---

## 👥 Team

Built by **Queenode** for the x402 Hackathon.

---

## 📄 License

MIT License — See [LICENSE](./LICENSE) for details.