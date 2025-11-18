/**
 * Documents API Route
 * List and delete documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/documents - List all documents
 */
export async function GET() {
  try {
    const db = getDB();
    await db.init();

    const documents = await db.listDocuments();
    const stats = await db.getStats();

    return NextResponse.json({
      documents,
      stats
    });
  } catch (error) {
    console.error('❌ List documents error:', error);

    return NextResponse.json(
      {
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents - Delete documents
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_ids } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json(
        { error: 'document_ids array is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    await db.deleteDocuments(document_ids);

    console.log(`✅ Deleted ${document_ids.length} documents`);

    return NextResponse.json({
      success: true,
      deleted_count: document_ids.length
    });
  } catch (error) {
    console.error('❌ Delete documents error:', error);

    return NextResponse.json(
      {
        error: 'Failed to delete documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
