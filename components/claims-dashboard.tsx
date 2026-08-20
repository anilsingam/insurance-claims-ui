'use client';

import { useState } from 'react';
import { LayoutDashboard, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useUIStore } from '@/store/use-ui-store';
import type { Claim, ClaimStatus } from '@/types';
import Header from './header';
import ClaimsGrid from './claims-grid';
import DocumentWorkspace from './document-workspace';
import ClaimEditor from './claim-editor';

const statusOptions: Array<'ALL' | ClaimStatus> = ['ALL', 'OPEN', 'IN_REVIEW', 'PENDING', 'APPROVED', 'DENIED'];

export default function ClaimsDashboard() {
  const role = useUIStore((s) => s.role);
  const selectedClaim = useUIStore((s) => s.selectedClaim);
  const workspaceOpen = useUIStore((s) => s.workspaceOpen);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<'ALL' | ClaimStatus>('ALL');
  const [sort, setSort] = useState('createdDate');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [editingClaim, setEditingClaim] = useState<{ claim: Claim; mode: 'edit' | 'assign' } | null>(null);

  const query = useQuery({
    queryKey: ['claims', { page, pageSize, search: searchTerm, status, sort, direction, role }],
    queryFn: () =>
      apiFetch<{ items: Claim[]; total: number; page: number; pageSize: number }>('/api/claims', {
        role,
        headers: {
          'x-page': String(page),
          'x-page-size': String(pageSize),
          'x-search': searchTerm,
          'x-status': status,
          'x-sort': sort,
          'x-direction': direction,
        },
      }),
    placeholderData: (previous) => previous,
  });

  function submitSearch() {
    setPage(1);
    setSearchTerm(search.trim());
  }

  function handleSort(column: string) {
    if (sort === column) setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(column);
      setDirection('asc');
    }
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / pageSize));

  return (
    <div className="app-shell">
      <Header />

      <main className="page-content">
        <section className="page-heading">
          <div>
            <div className="eyebrow"><LayoutDashboard size={15} /> Claims management</div>
            <h1>Claims Dashboard</h1>
            <p>Server-side filtering + sorting, virtualization and RBAC-ready actions.</p>
          </div>
          <div className="metric-card">
            <span>Total claims</span>
            <strong>{query.data?.total.toLocaleString() ?? '—'}</strong>
          </div>
        </section>

        <section className="toolbar panel">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              placeholder="Search customer, claim or policy…"
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            />
            <button className="button primary" onClick={submitSearch}>Search</button>
          </div>
          <div className="filters">
            <SlidersHorizontal size={18} />
            <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}>
              {statusOptions.map((option) => <option key={option} value={option}>{option === 'ALL' ? 'All statuses' : option}</option>)}
            </select>
            <button className="button ghost" onClick={() => query.refetch()} title="Refresh">
              <RefreshCw size={16} className={query.isFetching ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </section>

        <section className="panel grid-panel">
          <div className="panel-header">
            <div>
              <strong>Claims</strong>
              <span className="muted">Showing page {page} of {totalPages}</span>
            </div>
            <div className="performance-note">Virtualized rows · 50 records fetched per request</div>
          </div>

          {query.isError ? (
            <div className="error-state">
              <h3>Unable to load claims</h3>
              <p>{query.error.message}</p>
              <button className="button primary" onClick={() => query.refetch()}>Retry</button>
            </div>
          ) : (
            <ClaimsGrid
              claims={query.data?.items ?? []}
              isLoading={query.isLoading}
              role={role}
              onSort={handleSort}
              sort={sort}
              direction={direction}
              onEdit={(claim, mode) => setEditingClaim({ claim, mode })}
              onDelete={async (claim) => {
                if (!window.confirm(`Delete ${claim.claimNumber}? This demo will remove it from the mock dataset.`)) return;
                try {
                  await apiFetch(`/api/claims/${claim.id}`, { role, method: 'DELETE' });
                  await query.refetch();
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : 'Delete failed');
                }
              }}
            />
          )}

          <div className="pagination">
            <button className="button ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page <strong>{page}</strong> / {totalPages}</span>
            <button className="button ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </section>
      </main>

      {workspaceOpen && selectedClaim ? <DocumentWorkspace claim={selectedClaim} /> : null}
      {editingClaim ? <ClaimEditor claim={editingClaim.claim} mode={editingClaim.mode} role={role} onClose={() => setEditingClaim(null)} /> : null}
    </div>
  );
}
