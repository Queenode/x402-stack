# PartyStacker Architecture

## Overview
PartyStacker is a decentralized event ticketing platform built on the Stacks blockchain, leveraging the **x402-stacks** protocol to handle crypto payments seamlessly via standard HTTP 402 status codes.

## The Essence of x402-stacks
You asked: *"What is the essence of x402 if I still need a smart contract?"*

**The Answer:**
x402-stacks simplifies the **Monetization Layer**. Instead of writing complex smart contracts to handle sales, escrows, and refunds, you use x402 to:
1.  **Gate APIs**: Protect your `POST /api/tickets/mint` endpoint with a `402 Payment Required` wall.
2.  **Accept STX**: Accepts standard STX transfers directly to your wallet.
3.  **Verify Payments**: The protocol verifies the transaction on-chain before your server processes the order.

This allows your Smart Contract to be **simpler**: it only needs to handle the *Asset Logic* (Minting NFTs), while x402 handles the *Sales Logic* (Payments).

---

## Technical Stack

### 1. Frontend
-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS with custom "Shiny" Dark Theme (Slate-950 & Orange-500).
-   **Components**: Reusable UI components (Navbar, HeroSlider, Cards) with Lucide icons.

### 2. Backend & logic
-   **Database**: File-system persistence (`lib/db.ts` reads/writes to `data/events.json`).
    -   *Why?* Keeps data persistent across restarts without needing an external DB for the hackathon.
-   **x402 Protocol**: `lib/x402-client.ts` handles the payment flow.
    -   Client: Signs transactions with Leather Wallet.
    -   Server: Verifies transaction confirmation.

### 3. Blockchain (Smart Contract)
-   **Language**: Clarity
-   **Contract**: `contracts/party-stacker.clar`
-   **Purpose**:
    -   Defines the `ticket` NFT.
    -   Stores on-chain proof of event and ownership.
    -   Provides `verify-ticket` function for trustless verification.

## Workflow

1.  **Create Event**: Organizer creates an event via the UI. Data is saved to `events.json`.
2.  **Buy Ticket**: 
    -   User clicks "Buy".
    -   System requests an x402 payment (STX transfer).
    -   User pays via Leather Wallet.
    -   Server verifies payment and creates a ticket in `tickets.json` (and optionally calls the contract to mint NFT).
3.  **Verify**: 
    -   Attendee shows Ticket ID / QR at the door.
    -   Verify Page checks the database (or blockchain) for validity.

## Hackathon Value Proposition
-   **Web2 UX**: Fast, responsive, familiar ticketing experience.
-   **Web3 Native**: All payments settled in STX; Assets owned by users.
-   **x402 Integration**: Demonstrates novel use of HTTP status codes for crypto payments.
