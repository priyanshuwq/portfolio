import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const VISITORS_FILE = path.join(process.cwd(), 'visitors-count.json');
const BIN_ID = process.env.JSONBIN_BIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface VisitorData {
  count: number;
  lastUpdated: string;
}

// File-based storage (local development fallback)
function readVisitorCountFromFile(): VisitorData {
  try {
    if (fs.existsSync(VISITORS_FILE)) {
      const data = fs.readFileSync(VISITORS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // Silent fail, return default
  }
  return { count: 0, lastUpdated: new Date().toISOString() };
}

function writeVisitorCountToFile(data: VisitorData): void {
  try {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(data, null, 2));
  } catch {
    // Silent fail
  }
}

// JSONbin persistent storage (production)
async function readVisitorCountFromKV(): Promise<VisitorData> {
  try {
    if (!BIN_ID || !API_KEY) {
      throw new Error('JSONbin credentials not configured');
    }

    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY,
      },
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json();
      return data.record;
    }
  } catch {
    // Fallback to file if KV fails
  }

  return readVisitorCountFromFile();
}

async function writeVisitorCountToKV(data: VisitorData): Promise<void> {
  try {
    if (!BIN_ID || !API_KEY) {
      throw new Error('JSONbin credentials not configured');
    }

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY,
      },
      body: JSON.stringify(data),
    });
  } catch {
    // Fallback to file if KV fails
    writeVisitorCountToFile(data);
  }
}

// Unified interface
async function readVisitorCount(): Promise<VisitorData> {
  if (IS_PRODUCTION && BIN_ID && API_KEY) {
    return await readVisitorCountFromKV();
  }
  return readVisitorCountFromFile();
}

async function writeVisitorCount(data: VisitorData): Promise<void> {
  if (IS_PRODUCTION && BIN_ID && API_KEY) {
    await writeVisitorCountToKV(data);
  } else {
    writeVisitorCountToFile(data);
  }
}

export async function GET() {
  const data = await readVisitorCount();
  return NextResponse.json({ count: data.count });
}

export async function POST() {
  const data = await readVisitorCount();
  data.count += 1;
  data.lastUpdated = new Date().toISOString();
  await writeVisitorCount(data);
  
  return NextResponse.json({ count: data.count });
}
