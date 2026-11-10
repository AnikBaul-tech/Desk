import { getUser } from '@/lib/auth';
import { sql, type Row } from '@/lib/db';
import { isUuid } from '@/lib/utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser();
    if (!user) return new Response('Please log in again.', { status: 401 });
    if (!isUuid(params.id)) return new Response('Not found', { status: 404 });
    const rows: Row[] = await sql`
      select d.name, d.mime, encode(d.data, 'base64') as b64
      from documents d join projects p on p.id = d.project_id
      where d.id = ${params.id} and p.user_id = ${user.id}`;
    if (!rows.length) return new Response('This file no longer exists.', { status: 404 });
    const { name, mime, b64 } = rows[0];
    const download = new URL(req.url).searchParams.has('download');
    return new Response(Buffer.from(b64, 'base64'), {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(name)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (e) {
    console.error('[documents]', e);
    return new Response("Couldn't load this file right now. Please try again in a moment.", { status: 500 });
  }
}
