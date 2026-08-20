'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, Eye, Pencil, Trash2, UserRoundPen } from 'lucide-react';
import { hasPermission } from '@/lib/rbac';
import { useUIStore } from '@/store/use-ui-store';
import type { Claim, Permission, Role } from '@/types';

type Props = {
  claims: Claim[];
  isLoading: boolean;
  role: Role;
  sort: string;
  direction: 'asc' | 'desc';
  onSort: (column: string) => void;
  onEdit: (claim: Claim, mode: 'edit' | 'assign') => void;
  onDelete: (claim: Claim) => void;
};

const columnHelper = createColumnHelper<Claim>();
const tableColumnDefinitions = [
  columnHelper.accessor('claimNumber', { header: 'Claim' }),
  columnHelper.accessor('customer', { header: 'Customer' }),
  columnHelper.accessor('policyNumber', { header: 'Policy' }),
];

const columns: Array<{ key: keyof Claim | 'actions'; label: string; width: number; permission?: Permission }> = [
  { key: 'claimNumber', label: 'Claim', width: 150 },
  { key: 'customer', label: 'Customer', width: 190 },
  { key: 'policyNumber', label: 'Policy', width: 150 },
  { key: 'claimType', label: 'Type', width: 120 },
  { key: 'status', label: 'Status', width: 135 },
  { key: 'assignedTo', label: 'Assigned to', width: 150 },
  { key: 'state', label: 'State', width: 90 },
  { key: 'amount', label: 'Amount', width: 130 },
  { key: 'createdDate', label: 'Created', width: 120 },
  { key: 'actions', label: 'Actions', width: 170 },
];

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return null;
  return direction === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
}

void tableColumnDefinitions;

export default function ClaimsGrid({ claims, isLoading, role, sort, direction, onSort, onEdit, onDelete }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const openClaim = useUIStore((s) => s.openClaim);

  const rowVirtualizer = useVirtualizer({
    count: claims.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 54,
    overscan: 8,
  });

  if (isLoading) {
    return <div className="loading-grid">{Array.from({ length: 10 }).map((_, i) => <div className="skeleton-row" key={i} />)}</div>;
  }

  return (
    <div className="table-wrapper">
      <div className="table-header" style={{ minWidth: 1405 }}>
        {columns.map((column) => (
          <div
            className="table-cell header-cell"
            style={{ width: column.width, minWidth: column.width }}
            key={column.key}
          >
            {column.key !== 'actions' ? (
              <button className="sort-button" onClick={() => onSort(String(column.key))}>
                {column.label}
                <SortIcon active={sort === column.key} direction={direction} />
              </button>
            ) : column.label}
          </div>
        ))}
      </div>

      <div className="virtual-scroll" ref={parentRef}>
        <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', minWidth: 1405 }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const claim = claims[virtualRow.index];
            return (
              <div
                className="table-row"
                key={claim.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="table-cell claim-cell"><strong>{claim.claimNumber}</strong><small>{claim.id}</small></div>
                <div className="table-cell">{claim.customer}</div>
                <div className="table-cell">{claim.policyNumber}</div>
                <div className="table-cell">{claim.claimType}</div>
                <div className="table-cell"><span className={`status ${claim.status.toLowerCase()}`}>{claim.status}</span></div>
                <div className="table-cell">{claim.assignedTo}</div>
                <div className="table-cell">{claim.state}</div>
                <div className="table-cell">${claim.amount.toLocaleString()}</div>
                <div className="table-cell">{claim.createdDate}</div>
                <div className="table-cell actions-cell">
                  <button className="icon-button" title="Open claim" onClick={() => openClaim(claim)}>
                    <Eye size={16} />
                  </button>
                  {hasPermission(role, 'CLAIM_EDIT') ? <button className="icon-button" title="Edit" onClick={() => onEdit(claim, 'edit')}><Pencil size={16} /></button> : null}
                  {hasPermission(role, 'CLAIM_ASSIGN') ? <button className="icon-button" title="Assign" onClick={() => onEdit(claim, 'assign')}><UserRoundPen size={16} /></button> : null}
                  {hasPermission(role, 'CLAIM_DELETE') ? <button className="icon-button danger" title="Delete" onClick={() => onDelete(claim)}><Trash2 size={16} /></button> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
