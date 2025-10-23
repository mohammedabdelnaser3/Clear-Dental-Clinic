import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import type { HomepageContentBlock, ContentStatus } from '../../types/homepage';

type ContentType = 'text' | 'image' | 'video';

interface CreateFormState {
  title: string;
  sectionKey: string;
  type: ContentType;
  dataText: string; // JSON input as text
  order: number;
  visible: boolean;
}

const initialForm: CreateFormState = {
  title: '',
  sectionKey: '',
  type: 'text',
  dataText: '{"headline":"","subheading":"","ctaText":""}',
  order: 1,
  visible: true,
};

const HomepageContentManager: React.FC = () => {
  const [blocks, setBlocks] = useState<HomepageContentBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [form, setForm] = useState<CreateFormState>(initialForm);
  const [filter, setFilter] = useState<{ status?: ContentStatus; sectionKey?: string; visible?: boolean }>({});

  const visibleCount = useMemo(() => blocks.filter(b => b.visible).length, [blocks]);

  const fetchBlocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getHomepageContentBlocks(filter);
      setBlocks(res.data ?? []);
    } catch (err) {
      console.error('Failed to fetch homepage content blocks', err);
      setError('Failed to load content blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.status, filter.sectionKey, filter.visible]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(form.dataText);
    } catch {
      toast.error('Invalid JSON in data field');
      return;
    }

    try {
      const res = await adminService.createHomepageContentBlock({
        title: form.title.trim(),
        sectionKey: form.sectionKey.trim(),
        type: form.type,
        data: parsed,
        order: form.order,
        visible: form.visible,
        note: 'Created via Admin UI',
      });
      toast.success(`Created: ${res.data?.title ?? 'Content block'}`);
      setShowCreate(false);
      setForm(initialForm);
      fetchBlocks();
    } catch (err) {
      console.error('Create block failed', err);
      toast.error('Failed to create content block');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content block?')) return;
    try {
      await adminService.deleteHomepageContentBlock(id);
      toast.success('Deleted');
      fetchBlocks();
    } catch (err) {
      console.error('Delete block failed', err);
      toast.error('Failed to delete block');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const res = await adminService.publishHomepageContentBlock(id);
      toast.success(`Published: ${res.data?.title ?? 'Content block'}`);
      fetchBlocks();
    } catch (err) {
      console.error('Publish block failed', err);
      toast.error('Failed to publish block');
    }
  };

  const toggleVisibility = async (block: HomepageContentBlock) => {
    try {
      const res = await adminService.updateHomepageContentBlock(block._id!, { visible: !block.visible });
      toast.success(`${res.data?.title ?? 'Content block'} is now ${res.data?.visible ? 'visible' : 'hidden'}`);
      setBlocks(prev => prev.map(b => (b._id === block._id ? res.data! : b)));
    } catch (err) {
      console.error('Toggle visibility failed', err);
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Homepage Content Manager</h1>
          <p className="text-gray-600">Manage blocks shown on the public homepage.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreate(true)}
          >
            + New Block
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={fetchBlocks}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <select
          className="border rounded p-2"
          value={filter.status ?? ''}
          onChange={(e) => setFilter(prev => ({ ...prev, status: (e.target.value || undefined) as ContentStatus }))}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <input
          className="border rounded p-2"
          placeholder="Section key (e.g., hero, features)"
          value={filter.sectionKey ?? ''}
          onChange={(e) => setFilter(prev => ({ ...prev, sectionKey: e.target.value || undefined }))}
        />

        <select
          className="border rounded p-2"
          value={typeof filter.visible === 'boolean' ? String(filter.visible) : ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilter(prev => ({ ...prev, visible: val === '' ? undefined : val === 'true' }));
          }}
        >
          <option value="">Any Visibility</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
        </select>
      </div>

      {/* Stats */}
      <div className="mb-4 text-sm text-gray-600">Total: {blocks.length} • Visible: {visibleCount}</div>

      {/* Create form modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create Content Block</h2>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className="border rounded p-2"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
                <input
                  className="border rounded p-2"
                  placeholder="Section key (e.g., hero, features)"
                  value={form.sectionKey}
                  onChange={(e) => setForm(prev => ({ ...prev, sectionKey: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select
                  className="border rounded p-2"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as ContentType }))}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="number"
                  className="border rounded p-2"
                  placeholder="Order"
                  value={form.order}
                  onChange={(e) => setForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(e) => setForm(prev => ({ ...prev, visible: e.target.checked }))}
                  />
                  Visible
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Data (JSON)</label>
                <textarea
                  className="border rounded p-2 w-full h-32 font-mono text-sm"
                  value={form.dataText}
                  onChange={(e) => setForm(prev => ({ ...prev, dataText: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content blocks list */}
      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading content blocks…</div>
      ) : error ? (
        <div className="py-8 text-center text-red-600">{error}</div>
      ) : blocks.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No content blocks yet. Click "New Block" to add one.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map(block => (
            <div key={block._id} className="border rounded p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{block.title}</div>
                  <div className="text-xs text-gray-500">Section: {block.sectionKey} • Type: {block.type}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${block.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {block.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Order: {block.order ?? '-'} • Visible: {String(block.visible)}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  onClick={() => handlePublish(block._id!)}
                  disabled={block.status === 'published'}
                >
                  Publish
                </button>
                <button
                  className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
                  onClick={() => toggleVisibility(block)}
                >
                  {block.visible ? 'Hide' : 'Show'}
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  onClick={() => handleDelete(block._id!)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomepageContentManager;