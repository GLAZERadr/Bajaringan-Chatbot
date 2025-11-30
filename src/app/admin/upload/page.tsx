'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, RefreshCw, Trash2, FileText, Check, X, Phone, Mail, Clock, Lightbulb, Loader2 } from 'lucide-react';
import KnowledgeTab from '@/components/admin/KnowledgeTab';

interface Document {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  total_chunks: number;
  status: string;
  upload_date?: string;
}

interface Stats {
  total_documents: number;
  total_chunks: number;
  total_queries: number;
}

interface ContactSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
  updated_at: string;
}

interface OperatingHours {
  days: string[];
  startTime: string;
  endTime: string;
}

interface BehaviorSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string | null;
}

interface QAEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  requires_image: boolean;
  is_active: boolean;
}

export default function AdminUploadPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'documents' | 'contacts' | 'knowledge'>('documents');

  // Document upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Pagination for Documents
  const [docsCurrentPage, setDocsCurrentPage] = useState(1);
  const docsPerPage = 5;

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageCategory, setImageCategory] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageMessage, setImageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contact management state
  const [contacts, setContacts] = useState<ContactSetting[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    startTime: '08:00',
    endTime: '17:00'
  });

  // Knowledge management state
  const [behaviors, setBehaviors] = useState<BehaviorSetting[]>([]);
  const [qaEntries, setQaEntries] = useState<QAEntry[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [knowledgeMessage, setKnowledgeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Q&A form state
  const [qaForm, setQaForm] = useState({
    category: '',
    categoryOther: '',
    question: '',
    answer: '',
    keywords: '',
    requires_image: false
  });
  const [editingQA, setEditingQA] = useState<number | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') {
      fetchContacts();
    } else if (activeTab === 'knowledge') {
      fetchKnowledge();
    }
  }, [activeTab]);

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const response = await fetch('/api/admin/contacts');
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);

        // Parse operating hours if exists
        const opHoursSetting = data.contacts.find((c: ContactSetting) => c.setting_key === 'operating_hours');
        if (opHoursSetting) {
          parseOperatingHours(opHoursSetting.setting_value);
        }
      } else {
        setContactMessage({ type: 'error', text: 'Failed to load contacts' });
      }
    } catch (error) {
      setContactMessage({ type: 'error', text: 'Error loading contacts' });
    } finally {
      setContactsLoading(false);
    }
  };

  const parseOperatingHours = (value: string) => {
    // Parse "Senin-Jumat, 08:00-17:00" format
    try {
      const parts = value.split(', ');
      if (parts.length === 2) {
        const dayRange = parts[0];
        const timeRange = parts[1];

        const [startTime, endTime] = timeRange.split('-');

        let days: string[] = [];
        if (dayRange.includes('-')) {
          const [start, end] = dayRange.split('-');
          const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
          const startIdx = allDays.indexOf(start);
          const endIdx = allDays.indexOf(end);
          if (startIdx !== -1 && endIdx !== -1) {
            days = allDays.slice(startIdx, endIdx + 1);
          }
        } else {
          days = dayRange.split(',').map(d => d.trim());
        }

        setOperatingHours({ days, startTime, endTime });
      }
    } catch (error) {
      console.error('Error parsing operating hours:', error);
    }
  };

  const formatOperatingHours = (hours: OperatingHours): string => {
    // Format to "Senin-Jumat, 08:00-17:00"
    const allDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const sortedDays = hours.days.sort((a, b) => allDays.indexOf(a) - allDays.indexOf(b));

    // Check if it's a continuous range
    const firstIdx = allDays.indexOf(sortedDays[0]);
    const lastIdx = allDays.indexOf(sortedDays[sortedDays.length - 1]);
    const isContinuous = lastIdx - firstIdx + 1 === sortedDays.length;

    let dayString = '';
    if (isContinuous && sortedDays.length > 1) {
      dayString = `${sortedDays[0]}-${sortedDays[sortedDays.length - 1]}`;
    } else {
      dayString = sortedDays.join(', ');
    }

    return `${dayString}, ${hours.startTime}-${hours.endTime}`;
  };

  const handleContactUpdate = async (setting_key: string, setting_value: string) => {
    try {
      setSaving(setting_key);
      setContactMessage(null);

      const response = await fetch('/api/admin/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key, setting_value })
      });

      const data = await response.json();

      if (data.success) {
        setContactMessage({ type: 'success', text: `✅ ${setting_key} updated successfully!` });
        await fetchContacts();
      } else {
        setContactMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (error) {
      setContactMessage({ type: 'error', text: 'Error updating contact' });
    } finally {
      setSaving(null);
    }
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const setting_key = formData.get('setting_key') as string;
    const setting_value = formData.get('setting_value') as string;

    if (setting_key && setting_value) {
      handleContactUpdate(setting_key, setting_value);
    }
  };

  const handleOperatingHoursUpdate = () => {
    const formatted = formatOperatingHours(operatingHours);
    handleContactUpdate('operating_hours', formatted);
  };

  const toggleDay = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const fetchKnowledge = async () => {
    try {
      setKnowledgeLoading(true);

      // Fetch behaviors
      const behaviorRes = await fetch('/api/admin/behavior');
      const behaviorData = await behaviorRes.json();

      if (behaviorData.success) {
        setBehaviors(behaviorData.settings);
      }

      // Fetch Q&A entries
      const qaRes = await fetch('/api/admin/qa-knowledge');
      const qaData = await qaRes.json();

      if (qaData.success) {
        setQaEntries(qaData.qa_entries);
      }

    } catch (error) {
      setKnowledgeMessage({ type: 'error', text: 'Error loading knowledge' });
    } finally {
      setKnowledgeLoading(false);
    }
  };

  const handleBehaviorUpdate = async (setting_key: string, setting_value: string) => {
    try {
      setSaving(setting_key);
      setKnowledgeMessage(null);

      const response = await fetch('/api/admin/behavior', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key, setting_value })
      });

      const data = await response.json();

      if (data.success) {
        setKnowledgeMessage({ type: 'success', text: `✅ ${setting_key} updated!` });
        await fetchKnowledge();
      } else {
        setKnowledgeMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (error) {
      setKnowledgeMessage({ type: 'error', text: 'Error updating behavior' });
    } finally {
      setSaving(null);
    }
  };

  const handleQASubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qaForm.question || !qaForm.answer || !qaForm.category) {
      setKnowledgeMessage({ type: 'error', text: 'Category, Question, and Answer are required' });
      return;
    }

    // If category is "other", check categoryOther is filled
    if (qaForm.category === 'other' && !qaForm.categoryOther?.trim()) {
      setKnowledgeMessage({ type: 'error', text: 'Custom category name is required' });
      return;
    }

    try {
      setSaving('qa_form');
      setKnowledgeMessage(null);

      const keywords = qaForm.keywords.split(',').map(k => k.trim()).filter(k => k);

      // Use categoryOther as category value if category is "other"
      const finalCategory = qaForm.category === 'other' ? qaForm.categoryOther : qaForm.category;

      const method = editingQA ? 'PUT' : 'POST';
      const body = editingQA
        ? { ...qaForm, category: finalCategory, id: editingQA, keywords }
        : { ...qaForm, category: finalCategory, keywords };

      const response = await fetch('/api/admin/qa-knowledge', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setKnowledgeMessage({
          type: 'success',
          text: `✅ Q&A ${editingQA ? 'updated' : 'created'} successfully!`
        });
        setQaForm({
          category: '',
          categoryOther: '',
          question: '',
          answer: '',
          keywords: '',
          requires_image: false
        });
        setEditingQA(null);
        await fetchKnowledge();
      } else {
        setKnowledgeMessage({ type: 'error', text: data.error || 'Failed to save Q&A' });
      }
    } catch (error) {
      setKnowledgeMessage({ type: 'error', text: 'Error saving Q&A' });
    } finally {
      setSaving(null);
    }
  };

  const handleQAEdit = (qa: QAEntry) => {
    // Check if category is a standard one or custom
    const standardCategories = ['umum', 'material', 'pemasangan', 'garansi', 'visual', 'harga'];
    const isStandardCategory = standardCategories.includes(qa.category);

    setQaForm({
      category: isStandardCategory ? qa.category : 'other',
      categoryOther: isStandardCategory ? '' : qa.category,
      question: qa.question,
      answer: qa.answer,
      keywords: qa.keywords.join(', '),
      requires_image: qa.requires_image
    });
    setEditingQA(qa.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQADelete = async (id: number) => {
    if (!confirm('Delete this Q&A entry?')) return;

    try {
      setSaving(`qa_delete_${id}`);

      const response = await fetch(`/api/admin/qa-knowledge?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setKnowledgeMessage({ type: 'success', text: '✅ Q&A deleted successfully!' });
        await fetchKnowledge();
      } else {
        setKnowledgeMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (error) {
      setKnowledgeMessage({ type: 'error', text: 'Error deleting Q&A' });
    } finally {
      setSaving(null);
    }
  };

  const handleQAToggleActive = async (id: number, is_active: boolean) => {
    try {
      const response = await fetch('/api/admin/qa-knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !is_active })
      });

      const data = await response.json();

      if (data.success) {
        await fetchKnowledge();
      }
    } catch (error) {
      console.error('Error toggling Q&A:', error);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();

      if (response.ok) {
        setDocuments(data.documents || []);
        setStats(data.stats || null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load documents' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully uploaded ${data.filename}. Indexed ${data.total_chunks} chunks.`
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Reload documents
        await loadDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedDocs.size === 0) {
      setMessage({ type: 'error', text: 'No documents selected' });
      return;
    }

    if (!confirm(`Delete ${selectedDocs.size} document(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: Array.from(selectedDocs) }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Deleted ${data.deleted_count} document(s)` });
        setSelectedDocs(new Set());
        await loadDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Delete failed' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDocSelection = (id: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocs(newSelected);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Pagination helpers
  const getPaginatedDocuments = () => {
    const startIndex = (docsCurrentPage - 1) * docsPerPage;
    const endIndex = startIndex + docsPerPage;
    return documents.slice(startIndex, endIndex);
  };

  const totalDocsPages = Math.ceil(documents.length / docsPerPage);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);
      setImageMessage(null);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      setImageMessage({ type: 'error', text: 'Please select at least one image' });
      return;
    }

    if (!imageCategory.trim()) {
      setImageMessage({ type: 'error', text: 'Please enter a category name' });
      return;
    }

    setUploadingImages(true);
    setImageMessage(null);

    try {
      const formData = new FormData();
      imageFiles.forEach(file => formData.append('images', file));
      formData.append('category', imageCategory);
      formData.append('description', imageDescription);

      const response = await fetch('/api/upload-images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImageMessage({
          type: 'success',
          text: data.message || `Successfully uploaded ${imageFiles.length} images`
        });
        setImageFiles([]);
        setImageCategory('');
        setImageDescription('');

        // Reload documents
        await loadDocuments();
      } else {
        setImageMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error) {
      setImageMessage({ type: 'error', text: 'Upload failed. Please try again.' });
    } finally {
      setUploadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base Admin</h1>
              <p className="text-gray-600">Upload and manage documents for the Bajaringan chatbot</p>
            </div>
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ke Chat
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'documents'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
            >
              Dokumen
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'knowledge'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
            >
              Knowledge Q&A
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'contacts'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300'
              }`}
            >
              WhatsApp
            </button>
          </div>
        </div>

        {/* Documents Tab Content */}
        {activeTab === 'documents' && (
          <>
            {/* Stats */}
            {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Dokumen</p>
              <p className="text-3xl font-bold text-blue-600">{stats.total_documents}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Chunks</p>
              <p className="text-3xl font-bold text-green-600">{stats.total_chunks}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-sm text-gray-600">Total Queries</p>
              <p className="text-3xl font-bold text-purple-600">{stats.total_queries}</p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Dokumen</h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih File (PDF, DOCX, TXT, MD)
              </label>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                disabled={uploading}
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Terpilih: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {uploading ? 'Memproses...' : 'Upload & Index'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Image Upload Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Gambar (Bulk Training)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload beberapa gambar yang dikelompokkan berdasarkan kategori/kasus untuk training AI. Contoh: "kebocoran atap yang harus diganti", "rangka baja berkarat", dll.
          </p>

          <form onSubmit={handleImageUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori / Nama Kasus *
                </label>
                <input
                  type="text"
                  value={imageCategory}
                  onChange={(e) => setImageCategory(e.target.value)}
                  placeholder="contoh: kebocoran atap yang harus diganti"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingImages}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  value={imageDescription}
                  onChange={(e) => setImageDescription(e.target.value)}
                  placeholder="Konteks tambahan tentang gambar ini"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingImages}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Gambar (JPG, PNG, WebP) *
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                disabled={uploadingImages}
              />
              <p className="mt-1 text-xs text-gray-500">
                Maksimal 20 gambar per upload, 10MB per gambar
              </p>
            </div>

            {imageFiles.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    {imageFiles.length} gambar terpilih
                  </p>
                  <button
                    type="button"
                    onClick={() => setImageFiles([])}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Hapus semua
                  </button>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {imageFiles.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={imageFiles.length === 0 || !imageCategory.trim() || uploadingImages}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {uploadingImages ? 'Memproses Gambar...' : `Upload & Index ${imageFiles.length} Gambar`}
            </button>
          </form>

          {imageMessage && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                imageMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {imageMessage.text}
            </div>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Dokumen Terindex</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={selectedDocs.size === 0 || loading}
                className="flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Terpilih ({selectedDocs.size})
              </button>
              <button
                onClick={loadDocuments}
                disabled={loading}
                className="flex items-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading && documents.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <p className="text-gray-500">Memuat...</p>
            </div>
          ) : documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Belum ada dokumen. Upload dokumen pertama Anda!</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedDocs.size === getPaginatedDocuments().length && getPaginatedDocuments().length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocs(new Set([...selectedDocs, ...getPaginatedDocuments().map(d => d.id)]));
                            } else {
                              const currentPageIds = new Set(getPaginatedDocuments().map(d => d.id));
                              setSelectedDocs(new Set([...selectedDocs].filter(id => !currentPageIds.has(id))));
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama File
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ukuran
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chunks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getPaginatedDocuments().map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDocs.has(doc.id)}
                            onChange={() => toggleDocSelection(doc.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.filename}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.file_type}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.total_chunks}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              doc.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : doc.status === 'processing'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {doc.status === 'completed' ? 'Selesai' : doc.status === 'processing' ? 'Memproses' : 'Error'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalDocsPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Menampilkan {(docsCurrentPage - 1) * docsPerPage + 1} - {Math.min(docsCurrentPage * docsPerPage, documents.length)} dari {documents.length} dokumen
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDocsCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={docsCurrentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Sebelumnya
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalDocsPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setDocsCurrentPage(page)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            page === docsCurrentPage
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setDocsCurrentPage(prev => Math.min(totalDocsPages, prev + 1))}
                      disabled={docsCurrentPage === totalDocsPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
          </>
        )}

        {/* Contacts Tab Content */}
        {activeTab === 'contacts' && (
          <>
            {contactsLoading ? (
              <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Memuat kontak...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Message */}
                {contactMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${contactMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {contactMessage.text}
                  </div>
                )}

                {/* Contact Settings */}
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 mb-6">
                  {contacts
                    .filter(contact => contact.setting_key !== 'operating_hours')
                    .map((contact) => (
                      <form key={contact.id} onSubmit={handleContactSubmit} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <input type="hidden" name="setting_key" value={contact.setting_key} />

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            {contact.setting_key === 'wa_cs' && <><Phone className="w-4 h-4" /> WhatsApp Customer Service</>}
                            {contact.setting_key === 'wa_sales' && <><Phone className="w-4 h-4" /> WhatsApp Sales</>}
                            {contact.setting_key === 'email_cs' && <><Mail className="w-4 h-4" /> Email Customer Service</>}
                          </label>
                          <p className="text-xs text-gray-500 mb-3">
                            {contact.description || `Atur ${contact.setting_key}`}
                          </p>

                          <div className="flex gap-3">
                            <input
                              type="text"
                              name="setting_value"
                              defaultValue={contact.setting_value}
                              placeholder={contact.setting_key.startsWith('wa_') ? '6281234567890' : 'cs@bajaringan.com'}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />

                            <button
                              type="submit"
                              disabled={saving === contact.setting_key}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium min-w-[100px]"
                            >
                              {saving === contact.setting_key ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Menyimpan...
                                </span>
                              ) : (
                                'Update'
                              )}
                            </button>
                          </div>

                          {/* Help text */}
                          {contact.setting_key.startsWith('wa_') && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> Format: country code + nomor (tanpa + atau spasi). Contoh: 6281234567890
                            </p>
                          )}

                          {/* Preview */}
                          {contact.setting_key.startsWith('wa_') && contact.setting_value && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-semibold text-gray-700 mb-1">Preview Link:</p>
                              <a
                                href={`https://wa.me/${contact.setting_value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm break-all"
                              >
                                https://wa.me/{contact.setting_value}
                              </a>
                            </div>
                          )}
                        </div>
                      </form>
                    ))}
                </div>

                {/* Operating Hours Picker */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Jam Operasional</h3>
                  <p className="text-xs text-gray-500 mb-4">Pilih hari dan jam kerja untuk customer service</p>

                  {/* Day Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Hari Kerja</label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            operatingHours.days.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Range Selector */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jam Buka</label>
                      <input
                        type="time"
                        value={operatingHours.startTime}
                        onChange={(e) => setOperatingHours(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jam Tutup</label>
                      <input
                        type="time"
                        value={operatingHours.endTime}
                        onChange={(e) => setOperatingHours(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 bg-blue-50 rounded-lg mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Preview:</p>
                    <p className="text-blue-800">{formatOperatingHours(operatingHours)}</p>
                  </div>

                  {/* Update Button */}
                  <button
                    onClick={handleOperatingHoursUpdate}
                    disabled={saving === 'operating_hours' || operatingHours.days.length === 0}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
                  >
                    {saving === 'operating_hours' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </span>
                    ) : (
                      'Update Jam Operasional'
                    )}
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Tips:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Nomor WhatsApp harus dalam format internasional (country code + nomor)</li>
                    <li>• Untuk Indonesia: 628xxx (bukan 08xxx atau +628xxx)</li>
                    <li>• Perubahan akan langsung aktif di chatbot setelah di-update</li>
                    <li>• Klik "Preview Link" untuk test apakah nomor valid</li>
                    <li>• Pilih minimal 1 hari untuk jam operasional</li>
                  </ul>
                </div>
              </>
            )}
          </>
        )}

        {/* Knowledge Tab Content */}
        {activeTab === 'knowledge' && (
          <KnowledgeTab
            behaviors={behaviors}
            qaEntries={qaEntries}
            loading={knowledgeLoading}
            message={knowledgeMessage}
            qaForm={qaForm}
            editingQA={editingQA}
            saving={saving}
            onBehaviorUpdate={handleBehaviorUpdate}
            onQASubmit={handleQASubmit}
            onQAFormChange={(updates) => setQaForm(prev => ({ ...prev, ...updates }))}
            onQAEdit={handleQAEdit}
            onQADelete={handleQADelete}
            onQAToggleActive={handleQAToggleActive}
            onCancelEdit={() => {
              setEditingQA(null);
              setQaForm({
                category: '',
                categoryOther: '',
                question: '',
                answer: '',
                keywords: '',
                requires_image: false
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
