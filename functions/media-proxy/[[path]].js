const GITHUB_BASE = 'https://github.com/albahr51/turath-media/releases/download';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathAfterProxy = decodeURIComponent(url.pathname.replace('/media-proxy/', ''));
  if (!pathAfterProxy) return new Response('Not found', { status: 404 });

  const parts = pathAfterProxy.split('/');
  let version, fileName;
  if (parts.length >= 2 && /^v\d+$/.test(parts[0])) {
    version = parts[0];
    fileName = parts.slice(1).join('/');
  } else {
    version = 'v3';
    fileName = pathAfterProxy;
  }

  const githubUrl = `${GITHUB_BASE}/${version}/${fileName}`;

  const reqHeaders = new Headers(context.request.headers);
  const init = { headers: {} };

  const range = reqHeaders.get('range');
  if (range) init.headers['Range'] = range;

  try {
    const response = await fetch(githubUrl, init);

    if (response.status === 404) {
      return new Response('File not found on upstream', { status: 404 });
    }

    const headers = new Headers(response.headers);

    headers.set('Content-Type', 'audio/mpeg');
    headers.delete('Content-Disposition');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Accept-Ranges', 'bytes');

    const status = response.status === 206 ? 206 : (response.ok ? 200 : response.status);
    return new Response(response.body, { status, headers });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
