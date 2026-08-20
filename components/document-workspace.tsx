'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, GitMerge, MessageSquare, Scissors, Trash2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { hasPermission } from '@/lib/rbac';
import { useUIStore } from '@/store/use-ui-store';
import type { Claim, DocumentComment, DocumentMetadata, Operation } from '@/types';

type Props = { claim: Claim };

export default function DocumentWorkspace({ claim }: Props) {
  const role = useUIStore((s) => s.role);
  const closeWorkspace = useUIStore((s) => s.closeWorkspace);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(85);
  const [commentText, setCommentText] = useState('');
  const [operation, setOperation] = useState<Operation | null>(null);
  const [operationType, setOperationType] = useState<Operation['type'] | null>(null);

  const documentQuery = useQuery({
    queryKey: ['document', claim.id],
    queryFn: () => apiFetch<DocumentMetadata>(`/api/claims/${claim.id}/documents`, { role }),
  });

  const commentsQuery = useQuery({
    queryKey: ['comments', documentQuery.data?.id],
    enabled: Boolean(documentQuery.data?.id),
    queryFn: () => apiFetch<DocumentComment[]>(`/api/documents/${documentQuery.data!.id}/comments`, { role }),
  });

  const operationMutation = useMutation({
    mutationFn: (type: Operation['type']) =>
      apiFetch<Operation>(`/api/documents/${documentQuery.data!.id}`, {
        role,
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    onSuccess: (created) => {
      setOperation(created);
      setOperationType(created.type);
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      apiFetch<DocumentComment[]>(`/api/documents/${documentQuery.data!.id}/comments`, {
        role,
        method: 'POST',
        body: JSON.stringify({ page, text: commentText }),
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['comments', documentQuery.data?.id] });
    },
  });

  useEffect(() => {
    if (!operation?.id || operation.status !== 'PROCESSING') return;
    const timer = window.setInterval(async () => {
      const latest = await apiFetch<Operation>(`/api/operations/${operation.id}`, { role });
      setOperation(latest);
    }, 900);
    return () => window.clearInterval(timer);
  }, [operation?.id, operation?.status, role]);

  const pages = documentQuery.data?.pages ?? 0;
  const visiblePageNumbers = useMemo(() => {
    const start = Math.max(1, page - 2);
    return Array.from({ length: 5 }, (_, index) => Math.min(pages || 5, start + index)).filter((value, index, array) => array.indexOf(value) === index);
  }, [page, pages]);

  async function cancelOperation() {
    if (!operation) return;
    const latest = await apiFetch<Operation>(`/api/operations/${operation.id}`, {
      role,
      method: 'POST',
      body: JSON.stringify({ action: 'cancel' }),
    });
    setOperation(latest);
  }

  if (documentQuery.isLoading) {
    return <div className="workspace-overlay"><div className="workspace-loading">Loading document workspace…</div></div>;
  }

  if (documentQuery.isError || !documentQuery.data) {
    return <div className="workspace-overlay"><div className="workspace-loading"><h3>Unable to load document</h3><button className="button primary" onClick={() => documentQuery.refetch()}>Retry</button></div></div>;
  }

  const document = documentQuery.data;
  const canSplit = hasPermission(role, 'DOCUMENT_SPLIT');
  const canMerge = hasPermission(role, 'DOCUMENT_MERGE');
  const canComment = hasPermission(role, 'DOCUMENT_COMMENT');

  return (
    <div className="workspace-overlay">
      <section className="workspace">
        <header className="workspace-header">
          <div className="workspace-title">
            <FileText size={20} />
            <div>
              <strong>{document.name}</strong>
              <span>{formatBytes(document.sizeBytes)} · {document.pages.toLocaleString()} pages · v{document.version}</span>
            </div>
          </div>
          <button className="icon-button close" onClick={closeWorkspace} title="Close workspace"><X size={20} /></button>
        </header>

        <div className="workspace-toolbar">
          <div className="toolbar-group">
            <button className="button ghost" onClick={() => setZoom((z) => Math.max(50, z - 10))}>−</button>
            <span>{zoom}%</span>
            <button className="button ghost" onClick={() => setZoom((z) => Math.min(160, z + 10))}>+</button>
          </div>
          <div className="toolbar-group">
            <button className="button ghost" disabled={!canSplit || operationMutation.isPending} onClick={() => operationMutation.mutate('SPLIT')}><Scissors size={16} /> Split</button>
            <button className="button ghost" disabled={!canMerge || operationMutation.isPending} onClick={() => operationMutation.mutate('MERGE')}><GitMerge size={16} /> Merge</button>
            <button className="button danger-button" disabled={!hasPermission(role, 'CLAIM_DELETE') || operationMutation.isPending} onClick={() => operationMutation.mutate('DELETE')}><Trash2 size={16} /> Delete</button>
          </div>
        </div>

        {operation ? (
          <div className={`operation-banner ${operation.status.toLowerCase()}`}>
            <div>
              {operation.status === 'COMPLETED' ? <CheckCircle2 size={18} /> : <span className="progress-ring">{operation.progress}%</span>}
              <div><strong>{operationType} operation</strong><span>{operation.message}</span></div>
            </div>
            {operation.status === 'PROCESSING' ? <button className="button ghost" onClick={cancelOperation}>Cancel</button> : null}
          </div>
        ) : null}

        <div className="workspace-body">
          <aside className="thumbnail-panel">
            <div className="aside-title">Pages</div>
            <div className="thumb-list">
              {visiblePageNumbers.map((number) => (
                <button key={number} className={`thumbnail ${number === page ? 'selected' : ''}`} onClick={() => setPage(number)}>
                  <div className="thumb-paper"><span>{number}</span></div>
                  <small>Page {number}</small>
                </button>
              ))}
              <div className="more-pages">+ {(pages - visiblePageNumbers.length).toLocaleString()} more</div>
            </div>
          </aside>

          <main className="document-stage">
            <div className="page-toolbar">
              <button className="icon-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={18} /></button>
              <span>Page <strong>{page.toLocaleString()}</strong> of {pages.toLocaleString()}</span>
              <button className="icon-button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={18} /></button>
              <span className="range-note">Only the active page is rendered in this demo</span>
            </div>
            <div className="document-scroll">
              <div className="document-page" style={{ width: `${Math.round(760 * zoom / 100)}px`, minHeight: `${Math.round(1000 * zoom / 100)}px` }}>
                <div className="page-label">SAKR INSURANCE · CLAIM DOCUMENT</div>
                <h2>{claim.claimType} Claim Record</h2>
                <div className="fake-lines" />
                <div className="document-section"><strong>Claim number</strong><span>{claim.claimNumber}</span></div>
                <div className="document-section"><strong>Customer</strong><span>{claim.customer}</span></div>
                <div className="document-section"><strong>Policy</strong><span>{claim.policyNumber}</span></div>
                <div className="document-section"><strong>Document page</strong><span>{page.toLocaleString()} / {pages.toLocaleString()}</span></div>
                <div className="annotation-box"><MessageSquare size={17} /><span>Annotation overlay example</span></div>
                <div className="fake-paragraph" />
                <div className="fake-paragraph short" />
                <footer>Demo viewer — production implementation should use HTTP Range + PDF.js/commercial SDK.</footer>
              </div>
            </div>
          </main>

          <aside className="comments-panel">
            <div className="aside-title"><MessageSquare size={17} /> Comments</div>
            <div className="comments-list">
              {(commentsQuery.data ?? []).map((comment) => (
                <article className="comment" key={comment.id}>
                  <div className="comment-meta"><strong>Page {comment.page}</strong><span>{comment.author}</span></div>
                  <p>{comment.text}</p>
                </article>
              ))}
              {!commentsQuery.data?.length ? <p className="muted">No comments yet.</p> : null}
            </div>
            <div className="comment-compose">
              <label>Add comment on page {page}</label>
              <textarea value={commentText} disabled={!canComment} onChange={(e) => setCommentText(e.target.value)} placeholder={canComment ? 'Type a page-level comment…' : 'Your role is read-only'} />
              <button className="button primary full" disabled={!canComment || !commentText.trim() || commentMutation.isPending} onClick={() => commentMutation.mutate()}>
                {commentMutation.isPending ? 'Saving…' : 'Add comment'}
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function formatBytes(bytes: number) {
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}
