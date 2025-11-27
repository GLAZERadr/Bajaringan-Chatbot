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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none md:rounded-lg shadow-xl w-full h-full md:max-w-3xl md:w-full md:h-auto md:max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs md:text-sm font-bold text-blue-700">{index + 1}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                {citation.document_name}
              </h3>
              {citation.page && (
                <p className="text-xs md:text-sm text-gray-600">Halaman {citation.page}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 ml-2 p-1 active:scale-90"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm md:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
              {citation.content}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 md:px-6 py-3 md:py-4 bg-gray-50 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center flex-shrink-0">
          <div className="text-xs md:text-sm text-gray-500 truncate">
            Bagian #{citation.chunk_index} • ID Dokumen: {citation.document_id.substring(0, 8)}...
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
