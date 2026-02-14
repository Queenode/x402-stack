export type TicketTier = 'general' | 'vip' | 'backstage';

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  date: number;
  organizerAddress: string;
  organizerName: string;
  tiers: {
    general: { price: number; available: number; sold: number };
    vip: { price: number; available: number; sold: number };
    backstage: { price: number; available: number; sold: number };
  };
  nftContractAddress?: string;
  nftImageUrl: string;
  metadataUri?: string;
  createdAt: number;
  status: 'upcoming' | 'live' | 'ended';
}

export interface Ticket {
  id: string;
  eventId: string;
  ownerAddress: string;
  tier: TicketTier;
  purchaseTxHash: string;
  qrCodeData: string;
  checkedIn: boolean;
  checkinTime?: number;
  nftMinted: boolean;
  nftTokenId?: string;
  createdAt: number;
}

export interface QRPayload {
  ticketId: string;
  eventId: string;
  ownerAddress: string;
  tier: TicketTier;
  timestamp: number;
  signature: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface CreateEventInput {
  title: string;
  description: string;
  location: string;
  date: number;
  imageUrl: string;
  nftImageUrl: string;
  tiers: {
    general: { price: number; available: number };
    vip: { price: number; available: number };
    backstage: { price: number; available: number };
  };
}

export interface EventAnalytics {
  eventId: string;
  totalTicketsSold: number;
  totalRevenue: number;
  tierBreakdown: {
    general: number;
    vip: number;
    backstage: number;
  };
  checkedInCount: number;
  nftsMinted: number;
}
