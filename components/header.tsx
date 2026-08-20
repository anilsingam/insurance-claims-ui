'use client';

import { ShieldCheck, UserCircle } from 'lucide-react';
import { useUIStore } from '@/store/use-ui-store';
import type { Role } from '@/types';

export default function Header() {
  const role = useUIStore((s) => s.role);
  const setRole = useUIStore((s) => s.setRole);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={20} /></div>
        <div>
          <div className="brand-title">SAKR Insurance</div>
          <div className="brand-subtitle">Claims Operations Workspace</div>
        </div>
      </div>
      <label className="role-switcher">
        <UserCircle size={18} />
        <span>Demo role</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="CLAIMS_AGENT">Claims Agent</option>
          <option value="CLAIMS_SUPERVISOR">Claims Supervisor</option>
          <option value="CLAIMS_AUDITOR">Claims Auditor</option>
        </select>
      </label>
    </header>
  );
}
