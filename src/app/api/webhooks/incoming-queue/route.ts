import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_FILE_PATH = path.join(process.cwd(), 'src/app/api/webhooks/whatsapp/queue.json');

function readQueue() {
  if (!fs.existsSync(QUEUE_FILE_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(QUEUE_FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading queue file:', err);
    return [];
  }
}

function clearQueue() {
  try {
    fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify([]), 'utf-8');
  } catch (err) {
    console.error('Error clearing queue file:', err);
  }
}

export async function GET() {
  const queue = readQueue();
  return NextResponse.json({ queue }, { status: 200 });
}

export async function DELETE() {
  clearQueue();
  return NextResponse.json({ success: true }, { status: 200 });
}
