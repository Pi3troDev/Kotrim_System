export type LegalDocumentType = 'TERMS' | 'PRIVACY';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
  content: string;
  publishedAt: string;
  isActive: boolean;
}

export interface ActiveLegalDocuments {
  terms: LegalDocument;
  privacy: LegalDocument;
}

export interface PendingLegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  title: string;
}
