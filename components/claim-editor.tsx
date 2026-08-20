'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Claim, ClaimStatus, Role } from '@/types';

const statuses: ClaimStatus[] = ['OPEN', 'IN_REVIEW', 'PENDING', 'APPROVED', 'DENIED'];
const agents = ['Agent 101', 'Agent 102', 'Agent 103', 'Agent 104', 'Agent 105'];

type Props = { claim: Claim; role: Role; mode: 'edit' | 'assign'; onClose: () => void };

export default function ClaimEditor({ claim, role, mode, onClose }: Props) {
  const queryClient = useQueryClient();
  const [customer, setCustomer] = useState(claim.customer);
  const [status, setStatus] = useState(claim.status);
  const [assignedTo, setAssignedTo] = useState(claim.assignedTo);

  useEffect(() => {
    setCustomer(claim.customer);
    setStatus(claim.status);
    setAssignedTo(claim.assignedTo);
  }, [claim]);

  const mutation = useMutation({
    mutationFn: () => apiFetch<Claim>(`/api/claims/${claim.id}`, {
      role,
      method: 'PATCH',
      body: JSON.stringify({ customer, status, assignedTo }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      onClose();
    },
  });

  return (
    <div className="modal-backdrop">
      <section className="modal">
        <header className="modal-header">
          <div><strong>{mode === 'assign' ? 'Assign claim' : 'Edit claim'}</strong><span>{claim.claimNumber}</span></div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </header>
        <div className="modal-body">
          {mode === 'edit' ? <label>Customer<input value={customer} onChange={(e) => setCustomer(e.target.value)} /></label> : null}
          {mode === 'edit' ? <label>Status<select value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
          <label>Assigned to<select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>{agents.map((item) => <option key={item}>{item}</option>)}</select></label>
          {mutation.isError ? <div className="form-error">{mutation.error.message}</div> : null}
        </div>
        <footer className="modal-footer">
          <button className="button ghost" onClick={onClose}>Cancel</button>
          <button className="button primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'Saving…' : 'Save changes'}</button>
        </footer>
      </section>
    </div>
  );
}
