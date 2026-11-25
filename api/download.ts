export default async function handler(_req: any, res: any) {
  try {
    const upstream = await fetch(
      'https://github.com/sahildandia/TALKORA/releases/latest/download/Talkora.apk',
      { redirect: 'follow' }
    );

    if (!upstream.ok || !upstream.body) {
      res.status(503).setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send('Talkora APK is not available yet. Please try again shortly.');
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="Talkora.apk"');
    res.setHeader('Cache-Control', 'no-store');
    const { Readable } = await import('node:stream');
    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch {
    res.status(502).setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send('Unable to download Talkora right now. Please try again.');
  }
}
