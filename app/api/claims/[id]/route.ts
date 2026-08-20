import { NextRequest, NextResponse } from 'next/server';
import { hasPermission, roleFromHeader } from '@/lib/rbac';
import { getClaims } from '@/lib/mock-data';
import type { Claim } from '@/types';

const globalForClaims = globalThis as typeof globalThis & { __SAKRClaims?: Claim[] };
const claims = globalForClaims.__SAKRClaims ?? getClaims();
globalForClaims.__SAKRClaims = claims;

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'CLAIM_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: CLAIM_EDIT permission is required.' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json();
  const claim = claims.find((item) => item.id === id);
  if (!claim) return NextResponse.json({ message: 'Claim not found' }, { status: 404 });

  if (typeof body.customer === 'string') claim.customer = body.customer;
  if (typeof body.status === 'string') claim.status = body.status;
  if (typeof body.assignedTo === 'string') claim.assignedTo = body.assignedTo;

  return NextResponse.json(claim);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'CLAIM_DELETE')) {
    return NextResponse.json({ message: 'Forbidden: CLAIM_DELETE permission is required.' }, { status: 403 });
  }
  const { id } = await context.params;
  const index = claims.findIndex((item) => item.id === id);
  if (index < 0) return NextResponse.json({ message: 'Claim not found' }, { status: 404 });
  claims.splice(index, 1);
  return NextResponse.json({ deleted: true, id });
}
