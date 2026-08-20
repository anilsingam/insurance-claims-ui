import type { Operation } from '@/types';

type OperationStore = Map<string, Operation>;

const globalForOperations = globalThis as typeof globalThis & { __SAKROperationStore?: OperationStore };

export const operations: OperationStore = globalForOperations.__SAKROperationStore ?? new Map<string, Operation>();

globalForOperations.__SAKROperationStore = operations;

export function createOperation(documentId: string, type: Operation['type']): Operation {
  const operation: Operation = {
    id: `OP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    documentId,
    type,
    status: 'PROCESSING',
    progress: 5,
    message: type === 'DELETE' ? 'Preparing safe delete…' : `Preparing ${type.toLowerCase()} operation…`,
  };
  operations.set(operation.id, operation);
  return operation;
}

export function advanceOperation(operation: Operation): Operation {
  if (operation.status !== 'PROCESSING') return operation;
  const progress = Math.min(100, operation.progress + 17);
  const next: Operation = {
    ...operation,
    progress,
    status: progress >= 100 ? 'COMPLETED' : 'PROCESSING',
    message: progress >= 100 ? 'Operation completed successfully.' : `Processing document… ${progress}% complete.`,
  };
  operations.set(next.id, next);
  return next;
}

export function cancelOperation(operation: Operation): Operation {
  const next: Operation = {
    ...operation,
    status: 'CANCELLED',
    message: 'Operation cancelled safely. Original document remains unchanged.',
  };
  operations.set(next.id, next);
  return next;
}
