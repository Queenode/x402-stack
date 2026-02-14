import fs from 'fs';
import path from 'path';
import type { Event, Ticket, CreateEventInput, EventAnalytics } from './types';
import { uploadToIPFS } from './pinata';
import { fetchEventFromChain } from './stacks-api';

const DATA_DIR = path.join(process.cwd(), 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Mock Data
const INITIAL_EVENTS: Event[] = [
  {
    id: 'evt-genesis-001',
    title: 'Genesis Launch Party',
    description: 'The first official party on the Stacks blockchain! Come join us for music, drinks, and networking with the best builders in the ecosystem.',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    location: 'Miami, FL',
    date: Date.now() + 86400000 * 7, // 7 days from now
    organizerAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    organizerName: 'Satoshi Nakamoto',
    tiers: {
      general: { price: 10, available: 100, sold: 5 },
      vip: { price: 50, available: 20, sold: 2 },
      backstage: { price: 100, available: 5, sold: 0 },
    },
    nftImageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e',
    createdAt: Date.now(),
    status: 'upcoming',
  }
];

// Helper to read data safely
function readData<T>(filePath: string, defaultData: T[]): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      writeData(filePath, defaultData);
      return defaultData;
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

// Helper to write data safely
function writeData(filePath: string, data: any): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// --- Event Operations ---

export async function createEvent(input: CreateEventInput, organizerAddress: string, organizerName: string): Promise<Event> {
  const events = readData<Event>(EVENTS_FILE, INITIAL_EVENTS);
  
  const id = `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newEvent: Event = {
    id,
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    location: input.location,
    date: input.date,
    organizerAddress,
    organizerName,
    tiers: {
      general: { ...input.tiers.general, sold: 0 },
      vip: { ...input.tiers.vip, sold: 0 },
      backstage: { ...input.tiers.backstage, sold: 0 },
    },
    nftImageUrl: input.nftImageUrl,
    createdAt: Date.now(),
    status: 'upcoming',
  };

  // Upload metadata to IPFS (Simulated or Real if keys present)
  try {
    const ipfsHash = await uploadToIPFS(newEvent, `party-stacker-${id}`);
    if (ipfsHash) {
      console.log(`[IPFS] Event metadata uploaded: ${ipfsHash}`);
      newEvent.metadataUri = ipfsHash;
    }
  } catch (err) {
    console.error('Failed to upload metadata to IPFS:', err);
  }

  events.push(newEvent);
  writeData(EVENTS_FILE, events);
  return newEvent;
}

export async function getEventById(id: string): Promise<Event | null> {
  if (id.startsWith('chain-')) {
      const chainId = parseInt(id.replace('chain-', ''), 10);
      if (!isNaN(chainId)) {
          return fetchEventFromChain(chainId);
      }
  }
  const events = readData<Event>(EVENTS_FILE, INITIAL_EVENTS);
  return events.find((e) => e.id === id) || null;
}

export async function getAllEvents(): Promise<Event[]> {
  return readData<Event>(EVENTS_FILE, INITIAL_EVENTS);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
  const events = readData<Event>(EVENTS_FILE, INITIAL_EVENTS);
  const index = events.findIndex((e) => e.id === id);
  
  if (index === -1) return null;

  events[index] = { ...events[index], ...updates };
  writeData(EVENTS_FILE, events);
  return events[index];
}

export async function getEventsByOrganizer(organizerAddress: string): Promise<Event[]> {
  const events = readData<Event>(EVENTS_FILE, INITIAL_EVENTS);
  return events.filter((e) => e.organizerAddress === organizerAddress);
}

// --- Ticket Operations ---

export async function createTicket(
  eventId: string,
  ownerAddress: string,
  tier: string,
  purchaseTxHash: string,
  qrCodeData: string
): Promise<Ticket> {
  const tickets = readData<Ticket>(TICKETS_FILE, []);
  
  const newTicket: Ticket = {
    id: `tkt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventId,
    ownerAddress,
    tier: tier as any,
    purchaseTxHash,
    qrCodeData,
    checkedIn: false,
    nftMinted: false,
    createdAt: Date.now(),
  };

  tickets.push(newTicket);
  writeData(TICKETS_FILE, tickets);

  // Update event sold count
  const event = await getEventById(eventId);
  if (event) {
    const tierKey = tier as keyof typeof event.tiers;
    if (event.tiers[tierKey]) {
      event.tiers[tierKey].sold += 1;
      await updateEvent(eventId, event); // Persists updated event
    }
  }

  return newTicket;
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const tickets = readData<Ticket>(TICKETS_FILE, []);
  return tickets.find((t) => t.id === id) || null;
}

export async function getTicketsByOwner(ownerAddress: string): Promise<Ticket[]> {
  const tickets = readData<Ticket>(TICKETS_FILE, []);
  return tickets.filter((t) => t.ownerAddress === ownerAddress);
}

export async function getTicketsByEvent(eventId: string): Promise<Ticket[]> {
  const tickets = readData<Ticket>(TICKETS_FILE, []);
  return tickets.filter((t) => t.eventId === eventId);
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  const tickets = readData<Ticket>(TICKETS_FILE, []);
  const index = tickets.findIndex((t) => t.id === id);
  
  if (index === -1) return null;

  tickets[index] = { ...tickets[index], ...updates };
  writeData(TICKETS_FILE, tickets);
  return tickets[index];
}

// --- Analytics ---


export async function getEventAnalytics(eventId: string): Promise<EventAnalytics> {
  const tickets = await getTicketsByEvent(eventId);
  let event = await getEventById(eventId);

  if (!event && eventId.startsWith('chain-')) {
    const chainId = parseInt(eventId.replace('chain-', ''), 10);
    if (!isNaN(chainId)) {
        event = await fetchEventFromChain(chainId);
    }
  }

  if (!event) {
    throw new Error('Event not found');
  }

  const analytics: EventAnalytics = {
    eventId,
    totalTicketsSold: tickets.length,
    totalRevenue:
      tickets.reduce((sum, ticket) => {
        const tierPrice = event.tiers[ticket.tier].price;
        return sum + tierPrice;
      }, 0), // Assuming price is simple STX for now
    tierBreakdown: {
      general: tickets.filter((t) => t.tier === 'general').length,
      vip: tickets.filter((t) => t.tier === 'vip').length,
      backstage: tickets.filter((t) => t.tier === 'backstage').length,
    },
    checkedInCount: tickets.filter((t) => t.checkedIn).length,
    nftsMinted: tickets.filter((t) => t.nftMinted).length,
  };

  return analytics;
}
