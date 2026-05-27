import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const queuePath = path.join(os.tmpdir(), 'whatsflow_webhook_queue.json');

export async function GET() {
  try {
    if (fs.existsSync(queuePath)) {
      const data = fs.readFileSync(queuePath, 'utf8');
      const queue = data ? JSON.parse(data) : [];
      return NextResponse.json({ queue }, { status: 200 });
    }
  } catch (error) {
    console.error('Error reading queue file:', error);
  }
  return NextResponse.json({ queue: [] }, { status: 200 });
}

export async function DELETE() {
  try {
    if (fs.existsSync(queuePath)) {
      fs.writeFileSync(queuePath, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error clearing queue file:', error);
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
