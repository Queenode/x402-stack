#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/create/page.tsx',
  'app/event/[id]/page.tsx',
  'app/my-tickets/page.tsx',
  'app/verify/page.tsx',
  'app/dashboard/page.tsx',
  'app/api/events/route.ts',
  'app/api/events/[id]/route.ts',
  'app/api/tickets/route.ts',
  'app/api/tickets/purchase/route.ts',
  'app/api/tickets/checkin/route.ts',
  'app/api/analytics/[eventId]/route.ts',
  'lib/types.ts',
  'lib/store.ts',
  'lib/db.ts',
  'lib/web3-context.tsx',
  'lib/qr-utils.ts',
  'lib/stacks-nft.ts',
  'lib/x402-client.ts',
  'components/TierSelector.tsx',
  'components/QRCodeDisplay.tsx',
  'components/EventCard.tsx',
  'globals.d.ts',
];

console.log('Verifying PartyStacker project setup...\n');

let allFilesExist = true;

requiredFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✓' : '✗';
  console.log(`${status} ${file}`);
  if (!exists) {
    allFilesExist = false;
  }
});

console.log('\n' + (allFilesExist ? 'All required files found!' : 'Some files are missing.'));
process.exit(allFilesExist ? 0 : 1);
