export type ClaimStatus = 'OPEN' | 'IN_REVIEW' | 'PENDING' | 'APPROVED' | 'DENIED';

export type Role = 'CLAIMS_AGENT' | 'CLAIMS_SUPERVISOR' | 'CLAIMS_AUDITOR';

export type Permission =
  | 'CLAIM_READ'
  | 'CLAIM_EDIT'
  | 'CLAIM_DELETE'
  | 'CLAIM_ASSIGN'
  | 'DOCUMENT_READ'
  | 'DOCUMENT_COMMENT'
  | 'DOCUMENT_SPLIT'
  | 'DOCUMENT_MERGE';

export type Claim = {
  id: string;
  claimNumber: string;
  customer: string;
  policyNumber: string;
  status: ClaimStatus;
  assignedTo: string;
  state: string;
  claimType: string;
  amount: number;
  createdDate: string;
};

export type DocumentMetadata = {
  id: string;
  claimId: string;
  name: string;
  sizeBytes: number;
  pages: number;
  version: number;
  mimeType: string;
  checksum: string;
};

export type DocumentComment = {
  id: string;
  page: number;
  text: string;
  author: string;
  createdAt: string;
};

export type Operation = {
  id: string;
  documentId: string;
  type: 'SPLIT' | 'MERGE' | 'DELETE';
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  message: string;
};
