# 🎭 PartyStacker Hackathon Demo Flow

This document outlines the step-by-step flow to demonstrate **PartyStacker** to judges, highlighting the core innovations: **Multi-Tier Ticketing**, **x402 Payment Protocol**, and **On-Chain Verification**.

---

## 🚀 1. The Hook (Introduction)
*Duration: 30s*

**Narrative:** "Event ticketing is broken. High fees, fake tickets, and no real ownership. PartyStacker solves this by bringing **Multi-Tier Ticketing** and **x402 Payments** to the Stacks Blockchain."

**Visuals:**
*   Start on the **Landing Page** (`/`).
*   Showcase the "3 Recent Events" section with shiny, animated cards.
*   Highlight the **"Live on Stacks Testnet"** status (if applicable) or just the professional UI.

---

## 🎤 2. Persona A: The Organizer (Creating an Event)
*Duration: 1m 30s*

**Goal:** Show how easy it is to launch a decentralized event.

1.  **Navigate to Create Event:**
    *   Click the **"Create Event"** button in Navbar (or "Create First Event" on empty state).
    *   *Action:* Connect **Leather Wallet** when prompted. Show the wallet popup (or simulate if pre-connected).

2.  **Fill Event Details:**
    *   **Title:** "Stacks Winter Hackathon Finale"
    *   **Description:** "The ultimate showdown of Stacks builders."
    *   **Location:** "Metaverse / New York"
    *   **Date:** Select next Friday.

3.  **The "Wow" Feature: Multi-Tier Pricing:**
    *   Scroll to the **Ticket Tiers** section.
    *   Explain: "Smart contracts usually just sell one token. We support **dynamic tiers** directly on-chain."
    *   Adjust **VIP Price** to `100 STX`.
    *   Adjust **Backstage Capacity** to `10`.

4.  **Deploy to Blockchain:**
    *   Click **"Create Event"**.
    *   *Note:* If using live testnet, explain transaction broadcast ("Broadcasting to Stacks...").
    *   Show the **Success Modal** with the **Transaction ID** (`0x...`).
    *   Click **"Go to Dashboard"**.

---

## 🎟️ 3. Persona B: The Fan (Discovery & Purchase / x402)
*Duration: 2m*

**Goal:** Demonstrate the x402 Protocol flow (Payment Required -> Access).

1.  **Explore Events:**
    *   Click **"Explore Events"** in Navbar.
    *   Use the **Search Bar** to find "Winter Hackathon".
    *   Click the event card.

2.  **Event Details Page:**
    *   Show the **Hero Banner** (blurred background image).
    *   Scroll down to **Select Ticket**.
    *   *Action:* Choose **"VIP Access"** (100 STX).

3.  **The x402 Moment:**
    *   Click **"Buy Ticket"**.
    *   **Pause here.** Explain: "The server returns a **402 Payment Required** status. This isn't just an error; it's a protocol instruction."
    *   The app automatically triggers the **Leather Wallet** transaction.
    *   *Action:* Confirm transaction in wallet.

4.  **Success & NFT Generation:**
    *   Show "Purchase Successful!" modal.
    *   "We just minted a unique **Ticket NFT** on Stacks."
    *   Click **"View My Tickets"**.

---

## 📱 4. Persona C: The Gatekeeper (Verification)
*Duration: 1m*

**Goal:** Show that the ticket is real and verifiable.

1.  **The Ticket (Fan View):**
    *   On `/my-tickets` page.
    *   Show the **QR Code**.
    *   Explain: "This QR code contains a cryptographically signed payload referencing the Stacks transaction."

2.  **The Scanner (Gatekeeper View):**
    *   Open `/verify` page in a new tab (or phone).
    *   Click **"Scan QR Code"** (or manually enter the x402 ID from the previous step).
    *   *Action:* Simulate scanning (or type ID).

3.  **Verification Result:**
    *   **Green Checkmark:** "Valid Ticket".
    *   "Verified on Stacks Blockchain. Tier: VIP."
    *   Showcase the confetti animation!

---

## 🏆 5. Closing
*Duration: 30s*

**Narrative:** "PartyStacker isn't just an app; it's a protocol.
*   **Zero Middlemen.**
*   **Auditable Revenue.**
*   **Instant Settlements.**
Built on **Stacks**."

---

## 🔧 Technical Cheat Sheet for Judges

*   **Smart Contract:** `party-stacker.clar` (Clarity).
    *   `create-event`: Stores event data, tiers, and ownership.
    *   `buy-ticket`: Handles STX transfers, post-conditions, and mints NFT.
*   **Frontend:** Next.js + Tailwind + Lucide Icons.
*   **Integration:** `@stacks/connect` & `@stacks/transactions`.
*   **Protocol:** x402 (HTTP 402 Payment Required) flow implementation.
