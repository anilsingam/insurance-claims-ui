import type { Claim, DocumentComment, DocumentMetadata } from '@/types';

const firstNames = ['Anil', 'Priya', 'Rahul', 'Sarah', 'John', 'Meera', 'David', 'Kiran', 'Emily', 'Michael'];
const lastNames = ['Smith', 'Kumar', 'Reddy', 'Johnson', 'Williams', 'Brown', 'Sharma', 'Patel', 'Miller', 'Wilson'];
const states = ['AP', 'TS', 'KA', 'TN', 'MH', 'DL', 'GJ', 'RJ'];
const types = ['Medical', 'Auto', 'Property', 'Life'];
const agents = ['Agent 101', 'Agent 102', 'Agent 103', 'Agent 104', 'Agent 105'];
const statuses: Claim['status'][] = ['OPEN', 'IN_REVIEW', 'PENDING', 'APPROVED', 'DENIED'];

function seeded(index: number, modulo: number) {
  return Math.abs((index * 9301 + 49297) % 233280) % modulo;
}

export const TOTAL_CLAIMS = 20482;

export function getClaims(): Claim[] {
  return Array.from({ length: TOTAL_CLAIMS }, (_, index) => {
    const n = index + 1;
    const created = new Date(Date.UTC(2026, 0, 1 + (n % 210)));
    return {
      id: `CLM-${n.toString().padStart(6, '0')}`,
      claimNumber: `SAKR-${(100000 + n).toString()}`,
      customer: `${firstNames[seeded(n, firstNames.length)]} ${lastNames[seeded(n * 3, lastNames.length)]}`,
      policyNumber: `POL-${(700000 + n).toString()}`,
      status: statuses[seeded(n * 5, statuses.length)],
      assignedTo: agents[seeded(n * 7, agents.length)],
      state: states[seeded(n * 11, states.length)],
      claimType: types[seeded(n * 13, types.length)],
      amount: 500 + seeded(n * 17, 95000),
      createdDate: created.toISOString().slice(0, 10),
    };
  });
}

export function getDocument(claimId: string): DocumentMetadata {
  const n = Number(claimId.replace(/\D/g, '')) || 1;
  return {
    id: `DOC-${n.toString().padStart(6, '0')}`,
    claimId,
    name: `Claim_${claimId}_Medical_Records.pdf`,
    // Deliberately simulated: ~1.05 GB without shipping a huge file.
    sizeBytes: 1_050_000_000 + seeded(n, 250_000_000),
    pages: 850 + seeded(n, 350),
    version: 3,
    mimeType: 'application/pdf',
    checksum: `sha256-demo-${n.toString(16).padStart(8, '0')}`,
  };
}

export function getComments(documentId: string): DocumentComment[] {
  return [
    {
      id: `${documentId}-C1`,
      page: 12,
      text: 'Verify the medical code against the policy coverage.',
      author: 'Claims Supervisor',
      createdAt: '2026-08-16T09:10:00Z',
    },
    {
      id: `${documentId}-C2`,
      page: 47,
      text: 'Customer document appears to be a duplicate.',
      author: 'Claims Agent',
      createdAt: '2026-08-16T11:30:00Z',
    },
  ];
}
