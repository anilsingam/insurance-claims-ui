import { NextRequest, NextResponse } from 'next/server';
import { createOperation } from '@/lib/operations';
import { hasPermission, roleFromHeader } from '@/lib/rbac';
import type { Operation } from '@/types';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  const { id: documentId } = await context.params;
  const body = await request.json();
  const type = body.type as Operation['type'];
  const permission = type === 'MERGE' ? 'DOCUMENT_MERGE' : type === 'SPLIT' ? 'DOCUMENT_SPLIT' : 'CLAIM_DELETE';

  if (!hasPermission(role, permission)) {
    return NextResponse.json({ message: `Forbidden: ${permission} permission is required.` }, { status: 403 });
  }

  return NextResponse.json(createOperation(documentId, type), { status: 202 });
}
