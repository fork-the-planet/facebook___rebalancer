import {NextResponse} from 'next/server';

// Dev-only endpoint - proxies console-bridge.js script from sidecar (port 9335)

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({error: 'Dev-only endpoint'}, {status: 403});
  }

  try {
    const response = await fetch('http://localhost:9335/console-bridge.js');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const script = await response.text();

    return new NextResponse(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error(
      '[Console Bridge] Failed to fetch script from sidecar:',
      error,
    );
    return new NextResponse(
      'console.debug("[Console Bridge] Sidecar not available");',
      {
        status: 200,
        headers: {'Content-Type': 'application/javascript'},
      },
    );
  }
}
