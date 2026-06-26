import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';

const BACKEND_URL = process.env.INTERNAL_API_URL || 'http://backend:5000';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || '';

async function proxyRequest(req: NextRequest, params: { path: string[] }, method: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = params.path.join('/');
  const url = new URL(req.url);
  const queryString = url.search;
  const backendUrl = `${BACKEND_URL}/api/${path}${queryString}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-internal-secret': INTERNAL_SECRET,
    'x-user-email': session.user.email,
  };

  const options: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    try {
      options.body = await req.text();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(backendUrl, options);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Backend proxy error:', err);
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'DELETE');
}

export async function PATCH(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxyRequest(req, params, 'PATCH');
}
