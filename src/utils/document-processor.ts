/**
 * Document Processing Utilities
 * Handles extraction and chunking of various file formats
 */

import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export interface ProcessedDocument {
  content: string;
  metadata: {
    pages?: number;
    wordCount?: number;
    [key: string]: any;
  };
}

export interface DocumentChunk {
  content: string;
  metadata: {
    chunk_index: number;
    page?: number;
    start?: number;
    end?: number;
    [key: string]: any;
  };
}

/**
 * Extract text from PDF file
 */
export async function extractPDF(buffer: Buffer): Promise<ProcessedDocument> {
  try {
    const data = await pdf(buffer);

    return {
      content: data.text,
      metadata: {
        pages: data.numpages,
        wordCount: data.text.split(/\s+/).length,
        info: data.info
      }
    };
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    throw new Error('Failed to extract PDF content');
  }
}

/**
 * Extract text from DOCX file
 */
export async function extractDOCX(buffer: Buffer): Promise<ProcessedDocument> {
  try {
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value;
    const wordCount = text.split(/\s+/).length;

    return {
      content: text,
      metadata: {
        wordCount,
        messages: result.messages
      }
    };
  } catch (error) {
    console.error('❌ DOCX extraction error:', error);
    throw new Error('Failed to extract DOCX content');
  }
}

/**
 * Extract text from plain text file
 */
export async function extractText(buffer: Buffer): Promise<ProcessedDocument> {
  const text = buffer.toString('utf-8');
  const wordCount = text.split(/\s+/).length;

  return {
    content: text,
    metadata: {
      wordCount
    }
  };
}

/**
 * Extract text from markdown file
 */
export async function extractMarkdown(buffer: Buffer): Promise<ProcessedDocument> {
  return extractText(buffer); // For now, treat as plain text
}

/**
 * Extract text from any supported file type
 */
export async function extractDocument(
  buffer: Buffer,
  fileType: string
): Promise<ProcessedDocument> {
  const type = fileType.toLowerCase();

  switch (type) {
    case 'pdf':
    case 'application/pdf':
      return extractPDF(buffer);

    case 'docx':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDOCX(buffer);

    case 'md':
    case 'markdown':
    case 'text/markdown':
      return extractMarkdown(buffer);

    case 'txt':
    case 'text/plain':
      return extractText(buffer);

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Chunk text into smaller pieces with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 800,
  overlap: number = 200
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  // Clean and normalize text
  const cleanText = text.replace(/\r\n/g, '\n').trim();

  if (cleanText.length === 0) {
    return chunks;
  }

  let start = 0;
  let chunkIndex = 0;

  while (start < cleanText.length) {
    let end = start + chunkSize;

    // If not the last chunk, try to break at sentence boundary
    if (end < cleanText.length) {
      // Look for sentence endings within the chunk
      const sentenceEndings = ['. ', '.\n', '! ', '!\n', '? ', '?\n'];
      let bestBreak = -1;

      for (const ending of sentenceEndings) {
        const idx = cleanText.lastIndexOf(ending, end);
        if (idx > start && idx > bestBreak) {
          bestBreak = idx + ending.length;
        }
      }

      // If no sentence break found, try paragraph break
      if (bestBreak === -1) {
        const paraBreak = cleanText.lastIndexOf('\n\n', end);
        if (paraBreak > start) {
          bestBreak = paraBreak + 2;
        }
      }

      // If no good break found, try word boundary
      if (bestBreak === -1) {
        const spaceIdx = cleanText.lastIndexOf(' ', end);
        if (spaceIdx > start) {
          bestBreak = spaceIdx + 1;
        }
      }

      if (bestBreak > start) {
        end = bestBreak;
      }
    } else {
      end = cleanText.length;
    }

    const chunkContent = cleanText.substring(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        metadata: {
          chunk_index: chunkIndex,
          start,
          end
        }
      });

      chunkIndex++;
    }

    // Move start position with overlap
    start = end - overlap;

    // Ensure we don't get stuck in infinite loop
    const lastChunk = chunks[chunks.length - 1];
    if (lastChunk && lastChunk.metadata.start !== undefined && start <= lastChunk.metadata.start) {
      start = end;
    }

    // Break if we've reached the end
    if (start >= cleanText.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Chunk PDF with page information
 */
export async function chunkPDF(
  buffer: Buffer,
  chunkSize: number = 800,
  overlap: number = 200
): Promise<DocumentChunk[]> {
  const data = await pdf(buffer);
  const chunks: DocumentChunk[] = [];

  // Process each page
  for (let pageNum = 1; pageNum <= data.numpages; pageNum++) {
    // Note: pdf-parse doesn't provide per-page text extraction easily
    // For production, consider using pdf.js or pdfplumber for better page tracking
    // For now, we'll chunk the full text and estimate pages
  }

  // Fallback: chunk entire document and estimate pages
  const textChunks = chunkText(data.text, chunkSize, overlap);

  return textChunks.map(chunk => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      page: Math.floor((chunk.metadata.start || 0) / 3000) + 1 // Rough estimate
    }
  }));
}

/**
 * Get file type from filename
 */
export function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'md': 'text/markdown'
  };

  return mimeTypes[ext] || ext;
}

/**
 * Validate file type
 */
export function isValidFileType(filename: string): boolean {
  const validExtensions = ['pdf', 'docx', 'txt', 'md'];
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return validExtensions.includes(ext);
}

/**
 * Process file and return chunks
 */
export async function processFile(
  buffer: Buffer,
  filename: string,
  chunkSize?: number,
  overlap?: number
): Promise<{ document: ProcessedDocument; chunks: DocumentChunk[] }> {
  const fileType = getFileType(filename);

  if (!isValidFileType(filename)) {
    throw new Error(`Invalid file type: ${fileType}. Supported: PDF, DOCX, TXT, MD`);
  }

  const document = await extractDocument(buffer, fileType);

  const size = chunkSize || parseInt(process.env.CHUNK_SIZE || '800');
  const overlapSize = overlap || parseInt(process.env.CHUNK_OVERLAP || '200');

  const chunks = chunkText(document.content, size, overlapSize);

  return { document, chunks };
}
