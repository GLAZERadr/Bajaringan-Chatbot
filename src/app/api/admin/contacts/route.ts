import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/contacts
 * Get all contact settings
 */
export async function GET() {
  try {
    const db = getDB();
    await db.init();

    const result = await db.executeQuery(
      'SELECT * FROM contact_settings ORDER BY id ASC'
    );

    return NextResponse.json({
      success: true,
      contacts: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/contacts
 * Update contact settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value } = body;

    if (!setting_key || !setting_value) {
      return NextResponse.json(
        { success: false, error: 'setting_key and setting_value are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    // Update setting
    const result = await db.executeQuery(
      `UPDATE contact_settings
       SET setting_value = $1, updated_at = NOW()
       WHERE setting_key = $2
       RETURNING *`,
      [setting_value, setting_key]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Setting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contact: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/contacts
 * Create new contact setting
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value, description } = body;

    if (!setting_key || !setting_value) {
      return NextResponse.json(
        { success: false, error: 'setting_key and setting_value are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    // Insert new setting
    const result = await db.executeQuery(
      `INSERT INTO contact_settings (setting_key, setting_value, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [setting_key, setting_value, description || null]
    );

    return NextResponse.json({
      success: true,
      contact: result.rows[0]
    });
  } catch (error: any) {
    console.error('❌ Error creating contact:', error);

    // Check for duplicate key error
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Setting key already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}
