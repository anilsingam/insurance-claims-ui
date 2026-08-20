import { NextRequest, NextResponse } from 'next/server';
import { advanceOperation, cancelOperation, operations } from '@/lib/operations';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const operation = operations.get(id);
  if (!operation) return NextResponse.json({ message: 'Operation not found' }, { status: 404 });
  return NextResponse.json(advanceOperation(operation));
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const operation = operations.get(id);
  if (!operation) return NextResponse.json({ message: 'Operation not found' }, { status: 404 });
  const body = await request.json();
  if (body.action === 'cancel' && operation.status === 'PROCESSING') {
    return NextResponse.json(cancelOperation(operation));
  }
  return NextResponse.json(operation);
}
