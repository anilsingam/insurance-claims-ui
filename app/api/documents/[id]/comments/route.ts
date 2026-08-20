import { NextRequest, NextResponse } from 'next/server';
import { getComments } from '@/lib/mock-data';
import { hasPermission, roleFromHeader } from '@/lib/rbac';
import type { DocumentComment } from '@/types';

const comments = new Map<string, DocumentComment[]>();

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'DOCUMENT_READ')) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  const { id } = await context.params;
  if (!comments.has(id)) comments.set(id, getComments(id));
  return NextResponse.json(comments.get(id));
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const role = roleFromHeader(request.headers.get('x-demo-role'));
  if (!hasPermission(role, 'DOCUMENT_COMMENT')) {
    return NextResponse.json({ message: 'Forbidden: DOCUMENT_COMMENT permission is required.' }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json();
  const list = comments.get(id) ?? getComments(id);
  list.push({
    id: `${id}-C${list.length + 1}`,
    page: Number(body.page),
    text: String(body.text),
    author: role === 'CLAIMS_SUPERVISOR' ? 'Claims Supervisor' : 'Claims Agent',
    createdAt: new Date().toISOString(),
  });
  comments.set(id, list);
  return NextResponse.json(list);
}
