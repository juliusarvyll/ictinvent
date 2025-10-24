// public/sw.js - Service Worker for request interception
self.addEventListener('fetch', (event) => {
  // Only intercept API requests in production
  if (event.request.url.includes('/api/') && !self.location.hostname.includes('localhost')) {
    // Option 1: Block the request entirely
    // event.respondWith(new Response(null, { status: 404 }));

    // Option 2: Redirect to a dummy response
    // event.respondWith(new Response(JSON.stringify({ hidden: true }), {
    //   headers: { 'Content-Type': 'application/json' }
    // }));

    // Option 3: Add no-cache headers to prevent logging
    const modifiedRequest = new Request(event.request, {
      headers: {
        ...event.request.headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Hidden-Request': 'true'
      }
    });

    event.respondWith(fetch(modifiedRequest));
  }
});
