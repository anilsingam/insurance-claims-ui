import { NextRequest, NextResponse } from 'next/server';
import { getClaims } from '@/lib/mock-data';
import { hasPermission, roleFromHeader } from '@/lib/rbac';
import type { Claim } from '@/types';

const globalForClaims = globalThis as typeof globalThis & { __SAKRClaims?: Claim[] };
const cachedClaims = globalForClaims.__SAKRClaims ?? getClaims();
globalForClaims.__SAKRClaims = cachedClaims;

function claims() {
  return cachedClaims;
}

export async function GET(request: NextRequest) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'CLAIM_READ')) {
    return NextResponse.json({ message: 'Forbidden: CLAIM_READ permission is required.' }, { status: 403 });
  }

  const page = Math.max(1, Number(request.headers.get('x-page') ?? '1'));
  const pageSize = Math.min(100, Math.max(10, Number(request.headers.get('x-page-size') ?? '50')));
  const search = (request.headers.get('x-search') ?? '').toLowerCase();
  const status = request.headers.get('x-status') ?? 'ALL';
  const sort = request.headers.get('x-sort') ?? 'createdDate';
  const direction = request.headers.get('x-direction') === 'asc' ? 'asc' : 'desc';

  let result = claims();

  if (search) {
    result = result.filter((claim) =>
      [claim.claimNumber, claim.id, claim.customer, claim.policyNumber].some((value) => value.toLowerCase().includes(search)),
    );
  }

  if (status !== 'ALL') result = result.filter((claim) => claim.status === status);

  result = [...result].sort((a, b) => {
    const left = String(a[sort as keyof Claim] ?? '');
    const right = String(b[sort as keyof Claim] ?? '');
    const comparison = left.localeCompare(right, undefined, { numeric: true });
    return direction === 'asc' ? comparison : -comparison;
  });

  const start = (page - 1) * pageSize;
  return NextResponse.json({
    items: result.slice(start, start + pageSize),
    total: result.length,
    page,
    pageSize,
  });
}
