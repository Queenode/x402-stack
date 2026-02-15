# PartyStacker - Blockchain Event Ticketing Platform

A production-ready decentralized event ticketing platform built on the Stacks blockchain with automatic NFT attendance proofs.

## 🎭 Hackathon Demo

For a step-by-step guide on how to present this project to judges, see [DEMO_FLOW.md](./DEMO_FLOW.md). It covers the **Organizer**, **Fan (x402 Buy)**, and **Gatekeeper (Verify)** flows.

## Features

- **Zero Fees**: Direct peer-to-peer payments via Stacks blockchain
- **Verified Tickets**: Cryptographic QR codes impossible to forge
- **NFT Rewards**: Attendees receive NFTs as proof of attendance
- **Tier Upgrades**: Pay-per-tier pricing with seamless upgrades
- **Beautiful UI**: Modern, responsive design inspired by StacksAI

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Wallet**: Leather Wallet integration (Stacks)
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Blockchain**: Stacks (@stacks/transactions)

## Getting Started

### Prerequisites

1. **Leather Wallet Extension** - Install from [leather.io](https://leather.io)
2. **Node.js 18+** - For development

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
app/
├── page.tsx                 # Homepage with events showcase
├── create/page.tsx         # Create new events
├── event/[id]/page.tsx     # Event detail & ticket purchase
├── my-tickets/page.tsx     # User's tickets with QR codes
├── verify/page.tsx         # QR code verification for check-in
├── dashboard/page.tsx      # Organizer analytics dashboard
├── api/                    # Backend API routes
├── layout.tsx              # Root layout
└── globals.css             # Global styles & theme
lib/
├── types.ts               # TypeScript interfaces
├── store.ts               # Zustand store for wallet state
├── db.ts                  # In-memory database layer
├── web3-context.tsx       # Leather Wallet integration
├── qr-utils.ts            # QR code generation/verification
├── stacks-nft.ts          # NFT minting utilities
└── x402-client.ts         # Payment client
components/
├── TierSelector.tsx       # Ticket tier selection
├── QRCodeDisplay.tsx      # Ticket QR code display
└── EventCard.tsx          # Event preview card
```

## Key Pages

### Homepage (`/`)
- Browse upcoming events
- View event details and pricing
- Feature showcase

### Create Event (`/create`)
- **Step 1**: Connect Leather Wallet
- **Step 2**: Set event details (title, location, date)
- **Step 3**: Configure ticket tiers (General, VIP, Backstage)
- **Step 4**: Create event on blockchain

### Event Detail (`/event/[id]`)
- View event full details
- Select and purchase ticket tier
- Receive QR code ticket
- Option to upgrade tier

### My Tickets (`/my-tickets`)
- View all purchased tickets
- Download/share QR codes
- Track check-in status

### Verify QR (`/verify`)
- Scan attendee QR codes at check-in
- Mint attendance NFTs
- Confirm check-in with confetti celebration

### Dashboard (`/dashboard`)
- Real-time event analytics
- Sales by tier breakdown
- Check-in statistics

## Wallet Integration

### Leather Wallet Connection

The app uses Leather Wallet for Stacks blockchain integration:

1. User clicks "Create Event" → "Connect Wallet"
2. Leather Wallet popup prompts for account selection
3. User's address is stored in Zustand store
4. User can now create events and purchase tickets

**Key Files**:
- `lib/web3-context.tsx` - Leather Wallet integration
- Uses `stx_requestAccounts` method for Stacks

## API Routes

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details

### Tickets
- `POST /api/tickets/purchase` - Purchase ticket
- `POST /api/tickets/checkin` - Check-in & mint NFT
- `GET /api/tickets` - Get user's tickets

### Analytics
- `GET /api/analytics/[eventId]` - Event analytics

## Data Models

### Event
```typescript
{
  id: string;
  title: string;
  description: string;
  location: string;
  date: number; // Unix timestamp
  organizerAddress: string;
  organizerName: string;
  tiers: {
    general: { price: number; available: number; sold: number };
    vip: { price: number; available: number; sold: number };
    backstage: { price: number; available: number; sold: number };
  };
  imageUrl: string;
  nftImageUrl: string;
  status: 'upcoming' | 'live' | 'ended';
}
```

### Ticket
```typescript
{
  id: string;
  eventId: string;
  ownerAddress: string;
  tier: 'general' | 'vip' | 'backstage';
  qrCodeData: string; // Base64 encoded QR
  checkedIn: boolean;
  nftMinted: boolean;
  nftTokenId?: string;
  createdAt: number;
}
```

## Styling & Theme

The application uses a modern dark theme with:
- **Primary Color**: Golden Yellow (#ffd700)
- **Secondary Color**: Bright Blue (#00d4ff)
- **Accent Color**: Purple/Pink (#ff1493)
- **Background**: Deep slate (0% 0% 3%)

All colors are defined in `app/globals.css` using CSS custom properties for easy customization.

## Error Handling

The application includes proper error handling for:
- Wallet connection failures
- Event creation errors
- Payment processing issues
- QR code verification failures

All errors are logged with `console.error('[v0] ...')` for debugging.

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Environment Variables

No environment variables required for local development. The app uses:
- In-memory database (no external DB needed)
- Leather Wallet (browser extension)
- Stacks blockchain (public)

## Fixed Issues

### Hydration Mismatch (✓ Fixed)
- Removed global Web3Provider from root layout
- Each page that needs wallet context now wraps itself with Web3Provider
- Prevents browser extension attribute conflicts

### Leather Wallet Integration (✓ Fixed)
- Uses `stx_requestAccounts` instead of Ethereum methods
- Proper error handling for missing wallet extension
- Type definitions for LeatherProvider

### Private Key Security (✓ Fixed)
- No longer asks users for private keys
- Uses Leather Wallet browser extension for signing
- Secure, user-controlled key management

## Deployment

The application can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **Any Node.js hosting**

```bash
# Deploy to Vercel
npm install -g vercel
vercel
```

## Contributing

This is a complete, production-ready implementation. Contributions welcome!

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the debug logs in browser console (look for `[v0]` prefixed messages)
2. Verify Leather Wallet is installed and connected
3. Ensure you're on the correct Stacks network
