import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const search = request.nextUrl.search;
  const url = `${API_URL}/api/${path}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.text();
    if (body) {
      init.body = body;
    } else {
      headers.delete('content-type');
    }
  }

  try {
    const response = await fetch(url, init);
    const responseBody = await response.text();

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: { code: 'PROXY_ERROR', message: 'Failed to reach API server' } },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(request, params.path);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(request, params.path);
}

export async function PATCH(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(request, params.path);
}
