import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/vector/neondb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/behavior
 * Get all AI behavior settings
 */
export async function GET() {
  try {
    const db = getDB();
    await db.init();

    const result = await db.executeQuery(
      'SELECT * FROM ai_behavior ORDER BY setting_key ASC'
    );

    return NextResponse.json({
      success: true,
      settings: result.rows
    });
  } catch (error) {
    console.error('❌ Error fetching behavior settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch behavior settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/behavior
 * Update behavior setting
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { setting_key, setting_value } = body;

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json(
        { success: false, error: 'setting_key and setting_value are required' },
        { status: 400 }
      );
    }

    const db = getDB();
    await db.init();

    const result = await db.executeQuery(
      `UPDATE ai_behavior
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
      setting: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating behavior setting:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update behavior setting' },
      { status: 500 }
    );
  }
}
