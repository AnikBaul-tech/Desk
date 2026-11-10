'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { sql, type Row } from './db';
import { createSession, destroySession, requireUser } from './auth';
import { MAX_AVATAR_BYTES, MAX_DOC_BYTES, PALETTES, PROJECT_LEVELS, PROJECT_STATUS, PROJECT_TYPES, fmtBytes, isUuid } from './utils';
import { AVATAR_PRESETS } from './avatars';
import { fail, ok, UserError, type ActionState } from './action-result';
import { guard } from './guard';

// Every form action has the (previousState, formData) shape used by useFormState and returns an ActionResult,
// or redirects. Expected problems come back as { ok: false, error } instead of crashing the page.

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const pick = <T extends readonly string[]>(list: T, v: string, fallback: T[number]): T[number] => (list.includes(v) ? v : fallback);
const today = () => new Date().toISOString().slice(0, 10);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LIMIT = { name: 120, title: 200, comment: 2000, key: 60, value: 500, notes: 100_000 };

/** Clears the client router cache + cached pages so lists/counters are never stale after a change. */
const refresh = () => revalidatePath('/', 'layout');

function tooLong(label: string, v: string, max: number) {
  return v.length > max ? fail(`${label} must be ${max.toLocaleString('en')} characters or fewer.`) : null;
}
function dateOrThrow(v: string, label: string): string | null {
  if (!v) return null;
  if (!DATE.test(v) || Number.isNaN(Date.parse(v))) throw new UserError(`${label} is not a valid date.`);
  return v;
}

// ---------- auth ----------
export async function signup(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const name = str(f, 'name');
    const email = str(f, 'email').toLowerCase();
    const password = String(f.get('password') ?? '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return fail('Enter your name and a valid email.');
    const long = tooLong('Name', name, LIMIT.name);
    if (long) return long;
    if (password.length < 8) return fail('Password must be at least 8 characters.');
    const existing: Row[] = await sql`select 1 from users where email = ${email}`;
    if (existing.length) return fail('An account with this email already exists.');
    const hash = await bcrypt.hash(password, 10);
    const rows: Row[] = await sql`insert into users (name, email, password_hash) values (${name}, ${email}, ${hash}) returning id`;
    await createSession(rows[0].id);
    redirect('/');
  }, "We couldn't create your account right now. Please try again.");
}

export async function login(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const email = str(f, 'email').toLowerCase();
    const password = String(f.get('password') ?? '');
    if (!email || !password) return fail('Enter your email and password.');
    const rows: Row[] = await sql`select id, password_hash from users where email = ${email}`;
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return fail('Wrong email or password.');
    await createSession(rows[0].id);
    redirect('/');
  }, "We couldn't log you in right now. Please try again.");
}

export async function logout(_?: ActionState, __?: FormData): Promise<ActionState> {
  destroySession();
  redirect('/login');
}

// ---------- ownership guard ----------
async function owned(projectId: string) {
  const user = await requireUser();
  if (!isUuid(projectId)) throw new UserError('That project no longer exists.');
  const rows: Row[] = await sql`select id from projects where id = ${projectId} and user_id = ${user.id}`;
  if (!rows.length) throw new UserError('That project no longer exists.');
  return user;
}

// ---------- projects ----------
export async function createProject(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    const name = str(f, 'name');
    if (!name) return fail('Give your project a name.');
    const long = tooLong('Project name', name, LIMIT.name);
    if (long) return long;
    const start = dateOrThrow(str(f, 'start_date'), 'Start date') ?? today();
    const deadline = dateOrThrow(str(f, 'deadline'), 'Deadline');
    const rows: Row[] = await sql`
      insert into projects (user_id, name, start_date, type, status, level, deadline)
      values (${user.id}, ${name}, ${start}::date,
              ${pick(PROJECT_TYPES, str(f, 'type'), 'development')},
              ${pick(PROJECT_STATUS, str(f, 'status'), 'running')},
              ${pick(PROJECT_LEVELS, str(f, 'level'), 'mini')},
              ${deadline}::date)
      returning id`;
    refresh();
    redirect(`/projects/${rows[0].id}`);
  }, "Couldn't create the project. Please try again.");
}

export async function updateProject(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    const name = str(f, 'name');
    if (!name) return fail('The project needs a name.');
    const long = tooLong('Project name', name, LIMIT.name);
    if (long) return long;
    const start = dateOrThrow(str(f, 'start_date'), 'Start date') ?? today();
    const deadline = dateOrThrow(str(f, 'deadline'), 'Deadline');
    await sql`
      update projects set name = ${name},
        start_date = ${start}::date,
        type = ${pick(PROJECT_TYPES, str(f, 'type'), 'development')},
        status = ${pick(PROJECT_STATUS, str(f, 'status'), 'running')},
        level = ${pick(PROJECT_LEVELS, str(f, 'level'), 'mini')},
        deadline = ${deadline}::date
      where id = ${id}`;
    refresh();
    return ok('Project updated');
  }, "Couldn't save the project. Please try again.");
}

export async function deleteProject(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    await sql`update projects set deleted_at = now() where id = ${id}`; // soft delete keeps the record + usage history
    refresh();
    redirect('/records');
  }, "Couldn't delete the project. Please try again.");
}

export async function restoreProject(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    await sql`update projects set deleted_at = null where id = ${id}`;
    refresh();
    redirect(`/projects/${id}`);
  }, "Couldn't restore the project. Please try again.");
}

export async function saveNotes(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    const notes = String(f.get('notes') ?? '');
    const long = tooLong('Notes', notes, LIMIT.notes);
    if (long) return long;
    await sql`update projects set notes = ${notes}, last_worked = now() where id = ${id}`;
    refresh();
    return ok('Notes saved');
  }, "Couldn't save your notes. Your text is still in the box — please try again.");
}

// ---------- details (key/value) ----------
export async function saveDetail(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    const key = str(f, 'key');
    const value = str(f, 'value');
    await owned(id);
    if (!key) return fail('Give the detail a name.');
    const long = tooLong('The name', key, LIMIT.key) ?? tooLong('The value', value, LIMIT.value);
    if (long) return long;
    const patch = JSON.stringify({ [key]: value });
    await sql`update projects set details = details || ${patch}::jsonb where id = ${id}`;
    refresh();
    return ok(`“${key}” saved`);
  }, "Couldn't save that detail. Please try again.");
}

export async function removeDetail(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    await sql`update projects set details = details - ${str(f, 'key')}::text where id = ${id}`;
    refresh();
    return ok('Detail removed');
  }, "Couldn't remove that detail. Please try again.");
}

// ---------- tasks ----------
export async function addTask(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    const title = str(f, 'title');
    await owned(id);
    if (!title) return fail('Type a task first.');
    const long = tooLong('A task', title, LIMIT.title);
    if (long) return long;
    await sql`insert into tasks (project_id, title) values (${id}, ${title})`;
    await sql`update projects set last_worked = now() where id = ${id}`;
    refresh();
    return ok();
  }, "Couldn't add the task. Please try again.");
}

export async function toggleTask(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    const rows: Row[] = await sql`
      update tasks set done = not done, done_at = case when done then null else now() end
      where id = ${str(f, 'task')} and project_id in (select id from projects where user_id = ${user.id})
      returning id`;
    refresh();
    if (!rows.length) return fail('That task no longer exists.');
    return ok();
  }, "Couldn't update the task. Please try again.");
}

export async function deleteTask(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    await sql`delete from tasks where id = ${str(f, 'task')} and project_id in (select id from projects where user_id = ${user.id})`;
    refresh();
    return ok();
  }, "Couldn't delete the task. Please try again.");
}

// ---------- comments ----------
export async function addComment(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    const body = str(f, 'body');
    await owned(id);
    if (!body) return fail('Write something first.');
    const long = tooLong('A comment', body, LIMIT.comment);
    if (long) return long;
    await sql`insert into comments (project_id, body) values (${id}, ${body})`;
    await sql`update projects set last_worked = now() where id = ${id}`;
    refresh();
    return ok();
  }, "Couldn't post the comment. Please try again.");
}

export async function deleteComment(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    await sql`delete from comments where id = ${str(f, 'comment')} and project_id in (select id from projects where user_id = ${user.id})`;
    refresh();
    return ok('Comment deleted');
  }, "Couldn't delete the comment. Please try again.");
}

// ---------- library ----------
export async function uploadDocument(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const id = str(f, 'id');
    await owned(id);
    const files = f.getAll('file').filter((x): x is File => x instanceof File && x.size > 0);
    if (!files.length) return fail('Choose at least one file first.');
    const tooBig = files.find((x) => x.size > MAX_DOC_BYTES);
    if (tooBig) return fail(`“${tooBig.name}” is ${fmtBytes(tooBig.size)}. Files can be up to ${fmtBytes(MAX_DOC_BYTES)}.`);
    await Promise.all(
      files.map(async (file) => {
        const hex = '\\x' + Buffer.from(await file.arrayBuffer()).toString('hex');
        await sql`insert into documents (project_id, name, mime, size, data)
                  values (${id}, ${file.name}, ${file.type || 'application/octet-stream'}, ${file.size}, ${hex}::bytea)`;
      }),
    );
    refresh();
    return ok(files.length === 1 ? `Uploaded “${files[0].name}”` : `Uploaded ${files.length} files`);
  }, "Couldn't upload. Please try again, or try a smaller file.");
}

export async function deleteDocument(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    await sql`delete from documents where id = ${str(f, 'doc')} and project_id in (select id from projects where user_id = ${user.id})`;
    refresh();
    return ok('File deleted');
  }, "Couldn't delete the file. Please try again.");
}

// ---------- tracking (called from the browser in the background; the caller ignores failures) ----------
export async function recordVisit(projectId: string) {
  await owned(projectId);
  await sql`update projects set visits = visits + 1, last_worked = now() where id = ${projectId}`;
}

export async function heartbeat(projectId: string, seconds: number) {
  const user = await owned(projectId);
  const s = Math.min(Math.max(Math.round(seconds), 0), 120);
  if (!s) return;
  await sql`
    insert into activity (user_id, project_id, day, seconds) values (${user.id}, ${projectId}, current_date, ${s})
    on conflict (project_id, day) do update set seconds = activity.seconds + excluded.seconds`;
  await sql`update projects set last_worked = now() where id = ${projectId}`;
}

// ---------- settings ----------
export async function updateProfile(_: ActionState, f: FormData): Promise<ActionState> {
  return guard(async () => {
    const user = await requireUser();
    const name = str(f, 'name') || user.name;
    const long = tooLong('Name', name, LIMIT.name);
    if (long) return long;
    const palette = PALETTES.some((p) => p.id === str(f, 'palette')) ? str(f, 'palette') : user.palette;
    let avatar = user.avatar;
    const preset = str(f, 'avatarPreset');
    if (AVATAR_PRESETS.some((p) => `preset:${p.id}` === preset)) avatar = preset;
    const file = f.get('avatarFile');
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith('image/')) return fail('The avatar must be an image file.');
      if (file.size > MAX_AVATAR_BYTES) return fail(`That image is ${fmtBytes(file.size)}. Avatars can be up to ${fmtBytes(MAX_AVATAR_BYTES)}.`);
      avatar = `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
    }
    await sql`update users set name = ${name}, palette = ${palette}, avatar = ${avatar} where id = ${user.id}`;
    refresh();
    return ok('Settings saved');
  }, "Couldn't save your settings. Please try again.");
}
