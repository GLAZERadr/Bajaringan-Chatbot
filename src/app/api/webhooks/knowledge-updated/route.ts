/**
 * Webhook handler for WordPress knowledge updates
 * Clears cache when knowledge is published/updated in WordPress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWordPressKnowledgeService } from '@/services/wordpress-knowledge.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');

    if (!webhookSecret || webhookSecret !== process.env.WEBHOOK_SECRET) {
      console.error('❌ Invalid webhook secret');
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log('🔔 Webhook received:', payload.event);
    console.log('📦 Payload:', payload.data);

    // Clear WordPress knowledge cache
    const wpKnowledge = getWordPressKnowledgeService();
    wpKnowledge.clearCache();

    console.log('✅ Cache cleared, fresh data will be fetched on next query');

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'knowledge-updated webhook',
    timestamp: new Date().toISOString()
  });
}
