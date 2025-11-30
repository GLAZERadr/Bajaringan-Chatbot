import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/qa-knowledge
 * Get all Q&A knowledge entries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('active_only') === 'true';

    const db = getDB();
    await db.init();

    let query = 'SELECT * FROM qa_knowledge WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    if (activeOnly) {
      query += ` AND is_active = true`;
    }

    query += ' ORDER BY priority DESC, created_at DESC';

    const result = await db.executeQuery(query, params);

    return NextResponse.json({
      success: true,
      qa_entries: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching Q&A knowledge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Q&A knowledge' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/qa-knowledge
 * Create new Q&A entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, question, answer, keywords, priority, requires_image } = body;

    if (!category || !question || !answer) {
      return NextResponse.json(
        { success: false, error: 'category, question, and answer are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    const result = await db.executeQuery(
      `INSERT INTO qa_knowledge (category, question, answer, keywords, priority, requires_image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        category,
        question,
        answer,
        keywords || [],
        priority || 0,
        requires_image || false
      ]
    );

    return NextResponse.json({
      success: true,
      qa_entry: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error creating Q&A entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Q&A entry' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/qa-knowledge
 * Update Q&A entry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category, question, answer, keywords, priority, requires_image, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(category);
    }

    if (question !== undefined) {
      setClauses.push(`question = $${paramIndex++}`);
      values.push(question);
    }

    if (answer !== undefined) {
      setClauses.push(`answer = $${paramIndex++}`);
      values.push(answer);
    }

    if (keywords !== undefined) {
      setClauses.push(`keywords = $${paramIndex++}`);
      values.push(keywords);
    }

    if (priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(priority);
    }

    if (requires_image !== undefined) {
      setClauses.push(`requires_image = $${paramIndex++}`);
      values.push(requires_image);
    }

    if (is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.executeQuery(
      `UPDATE qa_knowledge SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Q&A entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      qa_entry: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating Q&A entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update Q&A entry' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/qa-knowledge
 * Delete Q&A entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    const result = await db.executeQuery(
      'DELETE FROM qa_knowledge WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Q&A entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Q&A entry deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting Q&A entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete Q&A entry' },
      { status: 500 }
    );
  }
}
