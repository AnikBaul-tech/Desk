/** Shared shapes for server actions. Not a 'use server' file, so it can export values and classes. */
export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** `undefined` = nothing has been submitted yet, or the action redirected (the page is switching). */
export type ActionState = ActionResult | undefined;

export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (error: string): ActionResult => ({ ok: false, error });

/** Throw inside an action for an expected problem; its message is shown to the user as-is. */
export class UserError extends Error {}
