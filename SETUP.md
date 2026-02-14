# PartyStacker - Blockchain Event Ticketing Platform

## Overview

PartyStacker is a modern, decentralized event ticketing platform built on Stacks blockchain with NFT attendance verification and zero transaction fees.

## Key Features

- **Zero Fees**: Direct peer-to-peer payments with no platform fees
- **Verified Tickets**: Cryptographic QR codes that cannot be forged
- **NFT Rewards**: Automatic NFT minting upon check-in for attendance proof
- **Tier Upgrades**: Pay-per-tier system for upgrading ticket access
- **Beautiful UI**: Modern design inspired by StacksAI with smooth animations

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- pnpm (or npm)
- Leather Wallet extension installed (for Stacks blockchain)

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Visit http://localhost:3000 to see the application.

## Wallet Integration

PartyStacker uses **Leather Wallet** for secure, non-custodial authentication on Stacks blockchain. No private keys are ever requested or stored.

### Connecting Wallet

1. Install [Leather Wallet](https://leather.io) browser extension
2. Click "Create Event" button
3. Click "Connect Leather Wallet"
4. Approve the connection in your Leather Wallet

## Project Structure

```
/app
  /api              - Backend API routes
    /events         - Event management
    /tickets        - Ticket operations
    /analytics      - Event analytics
  /create           - Event creation page
  /event/[id]       - Event detail page
  /verify           - QR code verification for check-in
  /my-tickets       - User's ticket gallery
  /dashboard        - Organizer dashboard

/lib
  /web3-context.tsx - Leather Wallet integration
  /store.ts         - Zustand state management
  /types.ts         - TypeScript interfaces
  /db.ts            - In-memory database
  /qr-utils.ts      - QR code utilities
  /x402-client.ts   - x402 payment integration

/components
  /EventCard.tsx    - Event preview component
  /TierSelector.tsx - Ticket tier selection
  /QRCodeDisplay.tsx - QR code display
```

## Design System

- **Theme**: Dark mode with yellow/blue accents
- **Colors**: 
  - Primary: Yellow (#FBBF24)
  - Secondary: Blue (#3B82F6)
  - Background: Near black (#0F172A)
- **Typography**: Geist font family
- **Components**: shadcn/ui with Tailwind CSS

## Key Fixes Applied

1. ✅ **Fixed Hydration Mismatch**: Added proper mounting detection in Web3Provider
2. ✅ **Fixed Wallet Integration**: Switched from MetaMask to Leather Wallet (stx_requestAccounts)
3. ✅ **Removed Private Key Input**: Uses secure Leather Wallet connection instead
4. ✅ **Beautiful UI**: Redesigned with modern gradient design, smooth animations, and responsive layout
5. ✅ **Type Safety**: Updated globals.d.ts to use LeatherProvider instead of ethereum

## API Routes

### Events
- `GET /api/events` - Get all events or filter by organizer
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details

### Tickets
- `GET /api/tickets` - Get tickets by owner
- `POST /api/tickets/purchase` - Purchase ticket (with x402 payment)
- `POST /api/tickets/checkin` - Check-in attendee and mint NFT
- `POST /api/tickets/upgrade` - Upgrade ticket tier

### Analytics
- `GET /api/analytics/[eventId]` - Get event analytics

## State Management

Uses **Zustand** with localStorage persistence for:
- Wallet address and private key
- User tickets
- User events
- Network selection (testnet/mainnet)

## Testing

To test the application:

1. Create an event via `/create`
2. View event details
3. Purchase tickets with different tiers
4. Check-in via QR code scanner at `/verify`
5. View your tickets at `/my-tickets`

## Environment Variables

No additional environment variables required for development. The application works with:
- Stacks testnet by default
- x402 payment facilitator (mock implementation)
- In-memory database

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+

## Security Notes

- Private keys are never stored on servers
- All transactions are signed client-side
- QR codes are cryptographically verified
- Row-level security can be implemented with a backend database

## Future Enhancements

- Real backend database (Supabase, PostgreSQL)
- Real Stacks testnet/mainnet integration
- Email notifications
- Advanced analytics dashboard
- Event management features
- Refund system

## Support

For issues or questions, please refer to:
- Stacks Documentation: https://docs.stacks.co
- Leather Wallet: https://leather.io
- Next.js: https://nextjs.org
