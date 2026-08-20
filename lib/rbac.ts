import type { Permission, Role } from '@/types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CLAIMS_AGENT: ['CLAIM_READ', 'CLAIM_EDIT', 'CLAIM_ASSIGN', 'DOCUMENT_READ', 'DOCUMENT_COMMENT', 'DOCUMENT_SPLIT'],
  CLAIMS_SUPERVISOR: [
    'CLAIM_READ',
    'CLAIM_EDIT',
    'CLAIM_DELETE',
    'CLAIM_ASSIGN',
    'DOCUMENT_READ',
    'DOCUMENT_COMMENT',
    'DOCUMENT_SPLIT',
    'DOCUMENT_MERGE',
  ],
  CLAIMS_AUDITOR: ['CLAIM_READ', 'DOCUMENT_READ'],
};

export function hasPermission(role: Role, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleFromHeader(value: string | null): Role {
  if (value === 'CLAIMS_SUPERVISOR' || value === 'CLAIMS_AUDITOR') return value;
  return 'CLAIMS_AGENT';
}
