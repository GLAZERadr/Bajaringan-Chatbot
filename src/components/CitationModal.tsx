/**
 * Citation Modal Component
 * Displays full content of a citation when clicked
 */

'use client';

interface Citation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  content: string;
  page?: number;
}

interface CitationModalProps {
  citation: Citation;
  index: number;
  onClose: () => void;
}

export function CitationModal({ citation, index, onClose }: CitationModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700">{index + 1}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {citation.document_name}
              </h3>
              {citation.page && (
                <p className="text-sm text-gray-600">Halaman {citation.page}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {citation.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Chunk #{citation.chunk_index} • Document ID: {citation.document_id.substring(0, 8)}...
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
