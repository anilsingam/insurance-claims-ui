import { NextRequest, NextResponse } from 'next/server';
import { getDocument } from '@/lib/mock-data';
import { hasPermission, roleFromHeader } from '@/lib/rbac';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'DOCUMENT_READ')) {
    return NextResponse.json({ message: 'Forbidden: DOCUMENT_READ permission is required.' }, { status: 403 });
  }
  const { id } = await context.params;
  return NextResponse.json(getDocument(id));
}
