import { Schema, model, Document, Types } from 'mongoose';

export type ContentType = 'text' | 'image' | 'video';
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'published' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface ContentVersion {
  _id?: Types.ObjectId;
  data: Record<string, any>;
  note?: string;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ApprovalEntry {
  _id?: Types.ObjectId;
  status: ApprovalStatus;
  requestedBy: Types.ObjectId;
  reviewer?: Types.ObjectId;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
  approvedAt?: Date;
}

export interface IHomepageContentBlock extends Document {
  title: string;
  sectionKey: string;
  type: ContentType;
  data: Record<string, any>;
  order: number;
  visible: boolean;
  status: ContentStatus;
  versions: ContentVersion[];
  currentVersionId?: Types.ObjectId;
  approvals: ApprovalEntry[];
  scheduledFor?: Date;
  scheduledTo?: Date;
  timezone?: string;
  publishedAt?: Date;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ContentVersionSchema = new Schema<ContentVersion>({
  data: { type: Schema.Types.Mixed, required: true },
  note: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const ApprovalSchema = new Schema<ApprovalEntry>({
  status: { type: String, enum: ['pending', 'approved', 'rejected'], required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
  comment: { type: String },
  approvedAt: { type: Date },
}, { timestamps: true });

const HomepageContentBlockSchema = new Schema<IHomepageContentBlock>({
  title: { type: String, required: true },
  sectionKey: { type: String, required: true, index: true },
  type: { type: String, enum: ['text', 'image', 'video'], required: true },
  data: { type: Schema.Types.Mixed, required: true },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'pending_review', 'approved', 'scheduled', 'published', 'archived'], default: 'draft', index: true },
  versions: { type: [ContentVersionSchema], default: [] },
  currentVersionId: { type: Schema.Types.ObjectId },
  approvals: { type: [ApprovalSchema], default: [] },
  scheduledFor: { type: Date },
  scheduledTo: { type: Date },
  timezone: { type: String, default: 'UTC' },
  publishedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

HomepageContentBlockSchema.index({ sectionKey: 1, order: 1 });
HomepageContentBlockSchema.index({ status: 1, scheduledFor: 1 });

export default model<IHomepageContentBlock>('HomepageContentBlock', HomepageContentBlockSchema);