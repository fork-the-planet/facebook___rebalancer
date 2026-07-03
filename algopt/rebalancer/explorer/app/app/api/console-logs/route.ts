import {NextRequest, NextResponse} from 'next/server';

// Dev-only endpoint - proxies to console-bridge-server sidecar (port 9335)
// The sidecar is automatically started by `nest dev` and handles all storage/filtering logic

// Only accept requests from whitelisted Nest domains
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.nest\.x2p\.facebook\.net$/,
  /^https:\/\/[a-z0-9-]+\.ai-web-agents\.edge\.x2p\.facebook\.net$/,
];

function isValidOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({error: 'Dev-only endpoint'}, {status: 403});
  }

  const origin = request.headers.get('origin');
  if (!isValidOrigin(origin)) {
    return NextResponse.json({error: 'Invalid origin'}, {status: 403});
  }

  const body = await request.text();
  const response = await fetch('http://localhost:9335/console-logs', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {'Content-Type': 'application/json'},
  });
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({error: 'Dev-only endpoint'}, {status: 403});
  }

  const origin = request.headers.get('origin');
  if (!isValidOrigin(origin)) {
    return NextResponse.json({error: 'Invalid origin'}, {status: 403});
  }

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const url = `http://localhost:9335/console-logs${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: {'Content-Type': 'application/json'},
  });
}
