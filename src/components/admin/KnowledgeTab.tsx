'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, Edit2, Trash2, CheckCircle, Circle, Camera, MessageSquarePlus, Lightbulb } from 'lucide-react';

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

interface QAForm {
  category: string;
  categoryOther?: string;
  question: string;
  answer: string;
  keywords: string;
  requires_image: boolean;
}

interface KnowledgeTabProps {
  behaviors: BehaviorSetting[];
  qaEntries: QAEntry[];
  loading: boolean;
  message: { type: 'success' | 'error', text: string } | null;
  qaForm: QAForm;
  editingQA: number | null;
  saving: string | null;
  onBehaviorUpdate: (setting_key: string, setting_value: string) => void;
  onQASubmit: (e: React.FormEvent) => void;
  onQAFormChange: (updates: Partial<QAForm>) => void;
  onQAEdit: (qa: QAEntry) => void;
  onQADelete: (id: number) => void;
  onQAToggleActive: (id: number, is_active: boolean) => void;
  onCancelEdit: () => void;
}

export default function KnowledgeTab({
  behaviors,
  qaEntries,
  loading,
  message,
  qaForm,
  editingQA,
  saving,
  onBehaviorUpdate,
  onQASubmit,
  onQAFormChange,
  onQAEdit,
  onQADelete,
  onQAToggleActive,
  onCancelEdit
}: KnowledgeTabProps) {
  // Local state for behavior settings form
  const [behaviorForm, setBehaviorForm] = useState<Record<string, string>>({});
  const [toneOther, setToneOther] = useState('');

  // Pagination for Q&A entries
  const [qaCurrentPage, setQaCurrentPage] = useState(1);
  const qaPerPage = 5;

  // Initialize behavior form when behaviors load
  useEffect(() => {
    const initialForm: Record<string, string> = {};
    behaviors.forEach(b => {
      initialForm[b.setting_key] = b.setting_value;
    });
    setBehaviorForm(initialForm);
  }, [behaviors]);

  const handleBehaviorSave = (setting_key: string) => {
    const value = setting_key === 'tone' && behaviorForm[setting_key] === 'other'
      ? toneOther
      : behaviorForm[setting_key];
    onBehaviorUpdate(setting_key, value);
  };

  // Pagination helpers for Q&A
  const getPaginatedQA = () => {
    const startIndex = (qaCurrentPage - 1) * qaPerPage;
    const endIndex = startIndex + qaPerPage;
    return qaEntries.slice(startIndex, endIndex);
  };

  const totalQaPages = Math.ceil(qaEntries.length / qaPerPage);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat knowledge...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* AI Behavior Settings */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Pengaturan Perilaku AI</h2>
        <p className="text-sm text-gray-600 mb-6">Atur perilaku dan gaya respons AI</p>

        <div className="space-y-6">
          {behaviors
            .filter(b => b.setting_key !== 'max_response_length' && b.setting_key !== 'use_emoji')
            .map((behavior) => (
              <div key={behavior.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {behavior.setting_key === 'tone' && 'Nada Bicara'}
                  {behavior.setting_key === 'response_style' && 'Gaya Respons'}
                </label>
                <p className="text-xs text-gray-500 mb-3">{behavior.description}</p>

                <div className="space-y-3">
                  {behavior.setting_key === 'response_style' ? (
                    <textarea
                      value={behaviorForm[behavior.setting_key] || behavior.setting_value}
                      onChange={(e) => setBehaviorForm(prev => ({ ...prev, [behavior.setting_key]: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : behavior.setting_key === 'tone' ? (
                    <>
                      <select
                        value={behaviorForm[behavior.setting_key] || behavior.setting_value}
                        onChange={(e) => setBehaviorForm(prev => ({ ...prev, [behavior.setting_key]: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="casual_friendly">Santai & Ramah</option>
                        <option value="professional">Profesional</option>
                        <option value="technical">Teknis</option>
                        <option value="other">Lainnya</option>
                      </select>
                      {(behaviorForm[behavior.setting_key] || behavior.setting_value) === 'other' && (
                        <input
                          type="text"
                          value={toneOther}
                          onChange={(e) => setToneOther(e.target.value)}
                          placeholder="Masukkan nada bicara kustom..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      value={behaviorForm[behavior.setting_key] || behavior.setting_value}
                      onChange={(e) => setBehaviorForm(prev => ({ ...prev, [behavior.setting_key]: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  <button
                    onClick={() => handleBehaviorSave(behavior.setting_key)}
                    disabled={saving === behavior.setting_key}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Save className="w-4 h-4" />
                    {saving === behavior.setting_key ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Q&A Knowledge Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          {editingQA ? (
            <><Edit2 className="w-5 h-5" /> Edit Entri Q&A</>
          ) : (
            <><Plus className="w-5 h-5" /> Tambah Entri Q&A</>
          )}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Tambahkan pertanyaan umum dan jawabannya untuk knowledge base AI
        </p>

        <form onSubmit={onQASubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori *
            </label>
            <select
              value={qaForm.category}
              onChange={(e) => onQAFormChange({ category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Pilih kategori...</option>
              <option value="umum">Umum</option>
              <option value="material">Material</option>
              <option value="pemasangan">Pemasangan</option>
              <option value="garansi">Garansi & AMC</option>
              <option value="visual">Visual / Foto</option>
              <option value="harga">Harga & Estimasi</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          {qaForm.category === 'other' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Kategori Kustom *
              </label>
              <input
                type="text"
                value={qaForm.categoryOther || ''}
                onChange={(e) => onQAFormChange({ categoryOther: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contoh: Perawatan, Troubleshooting, dll."
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pertanyaan *
            </label>
            <input
              type="text"
              value={qaForm.question}
              onChange={(e) => onQAFormChange({ question: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Berapa lama garansi atap baja ringan?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jawaban *
            </label>
            <textarea
              value={qaForm.answer}
              onChange={(e) => onQAFormChange({ answer: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jawaban lengkap untuk pertanyaan ini..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={qaForm.keywords}
              onChange={(e) => onQAFormChange({ keywords: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., garansi, berapa lama, warranty"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requires_image"
              checked={qaForm.requires_image}
              onChange={(e) => onQAFormChange({ requires_image: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="requires_image" className="text-sm text-gray-700 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Memerlukan Analisa Gambar/Foto (untuk pertanyaan yang perlu analisa gambar)
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving === 'qa_form'}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition font-medium"
            >
              {saving === 'qa_form' ? 'Menyimpan...' : editingQA ? 'Update Q&A' : 'Tambah Q&A'}
            </button>

            {editingQA && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Q&A Entries List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Basis Knowledge Q&A ({qaEntries.length})</h2>

        {qaEntries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada entri Q&A. Tambahkan yang pertama di atas!</p>
        ) : (
          <>
            <div className="space-y-4">
              {getPaginatedQA().map((qa) => (
              <div
                key={qa.id}
                className={`border rounded-lg p-4 ${qa.is_active ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50 opacity-60'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {qa.category}
                      </span>
                      {qa.requires_image && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Perlu Gambar
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{qa.question}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{qa.answer}</p>
                    {qa.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {qa.keywords.map((keyword, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => onQAToggleActive(qa.id, qa.is_active)}
                      className={`p-2 rounded transition ${
                        qa.is_active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={qa.is_active ? 'Aktif' : 'Nonaktif'}
                    >
                      {qa.is_active ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onQAEdit(qa)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onQADelete(qa.id)}
                      disabled={saving === `qa_delete_${qa.id}`}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition disabled:bg-gray-100"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>

            {/* Pagination Controls */}
            {totalQaPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Menampilkan {(qaCurrentPage - 1) * qaPerPage + 1} - {Math.min(qaCurrentPage * qaPerPage, qaEntries.length)} dari {qaEntries.length} entri
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQaCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={qaCurrentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalQaPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setQaCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          page === qaCurrentPage
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setQaCurrentPage(prev => Math.min(totalQaPages, prev + 1))}
                    disabled={qaCurrentPage === totalQaPages}
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

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Tips:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Kategori "visual" untuk pertanyaan yang butuh analisa foto/gambar</li>
          <li>• Keywords membantu AI menemukan jawaban yang tepat</li>
          <li>• Toggle active/inactive untuk enable/disable Q&A tanpa menghapus</li>
          <li>• Behavior settings mengatur style dan tone respons AI</li>
        </ul>
      </div>
    </>
  );
}
