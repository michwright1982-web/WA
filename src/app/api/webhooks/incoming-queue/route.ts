import { NextResponse } from 'next/server';

// Reference the same serverless-safe global in-memory queue
const globalForQueue = global as unknown as { webhookQueue: any[] };
if (!globalForQueue.webhookQueue) {
  globalForQueue.webhookQueue = [];
}

export async function GET() {
  const queue = [...globalForQueue.webhookQueue];
  return NextResponse.json({ queue }, { status: 200 });
}

export async function DELETE() {
  globalForQueue.webhookQueue = [];
  return NextResponse.json({ success: true }, { status: 200 });
}
