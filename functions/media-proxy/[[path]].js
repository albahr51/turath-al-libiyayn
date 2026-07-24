const GITHUB_BASE = 'https://github.com/albahr51/turath-media/releases/download/v3';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const latinName = decodeURIComponent(url.pathname.replace('/media-proxy/', ''));

  if (!latinName) {
    return new Response('Not found', { status: 404 });
  }

  const githubUrl = `${GITHUB_BASE}/${latinName}`;

  const reqHeaders = new Headers(context.request.headers);
  const init = {};

  const range = reqHeaders.get('range');
  const ifRange = reqHeaders.get('if-range');
  if (range) {
    init.headers = {};
    init.headers['Range'] = range;
    if (ifRange) init.headers['If-Range'] = ifRange;
  }

  try {
    const response = await fetch(githubUrl, init);
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'audio/mpeg');
    headers.delete('Content-Disposition');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');

    const status = response.status === 206 ? 206 : 200;

    return new Response(response.body, {
      status,
      headers
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
