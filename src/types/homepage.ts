export type ContentType = 'text' | 'image' | 'video';
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ContentVersion {
  _id?: string;
  data: Record<string, any>;
  note?: string;
  createdBy: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ApprovalEntry {
  _id?: string;
  status: ApprovalStatus;
  requestedBy: string;
  reviewer?: string;
  comment?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  approvedAt?: string | Date;
}

export interface HomepageContentBlock {
  _id?: string;
  title: string;
  sectionKey: string;
  type: ContentType;
  data: Record<string, any>;
  order: number;
  visible: boolean;
  status: ContentStatus;
  versions: ContentVersion[];
  currentVersionId?: string;
  approvals: ApprovalEntry[];
  scheduledFor?: string | Date;
  scheduledTo?: string | Date;
  timezone?: string;
  publishedAt?: string | Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}