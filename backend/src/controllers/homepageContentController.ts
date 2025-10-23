import { Request, Response, NextFunction } from 'express';
import HomepageContentBlock from '../models/HomepageContentBlock';
import asyncHandler from '../utils/asyncHandler';
import AppError from '../utils/AppError';
import { getWebSocket } from '../utils/websocketInstance';
import { AuthenticatedRequest } from '../types';

export const getHomepageContentBlocks = asyncHandler(async (_req: Request, res: Response) => {
  const blocks = await HomepageContentBlock.find().sort({ order: 1, createdAt: -1 });
  res.json({ success: true, data: blocks });
});

export const createHomepageContentBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { title, sectionKey, type, data, order, visible } = req.body;
  if (!title || !sectionKey || !type) {
    return next(new AppError('Missing required fields', 400));
  }
  const block = await HomepageContentBlock.create({ title, sectionKey, type, data, order, visible, createdBy: req.user?._id });
  try { getWebSocket().broadcastSystemAnnouncement(`Homepage block created: ${block.title}`); } catch {}
  res.status(201).json({ success: true, data: block });
});

export const updateHomepageContentBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updates = req.body;
  const block = await HomepageContentBlock.findByIdAndUpdate(id, updates, { new: true });
  if (!block) return next(new AppError('Content block not found', 404));
  try { getWebSocket().broadcastSystemAnnouncement(`Homepage block updated: ${block.title}`); } catch {}
  res.json({ success: true, data: block });
});

export const deleteHomepageContentBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const block = await HomepageContentBlock.findByIdAndDelete(id);
  if (!block) return next(new AppError('Content block not found', 404));
  try { getWebSocket().broadcastSystemAnnouncement(`Homepage block deleted: ${block.title}`); } catch {}
  res.json({ success: true, message: 'Deleted' });
});

export const publishHomepageContentBlock = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const block = await HomepageContentBlock.findById(id);
  if (!block) return next(new AppError('Content block not found', 404));
  block.status = 'published';
  block.publishedAt = new Date();
  await block.save();
  try {
    getWebSocket().broadcastHomepageUpdated?.(block.sectionKey, [block]);
  } catch {}
  res.json({ success: true, data: block });
});