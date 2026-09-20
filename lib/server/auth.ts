import { env } from "cloudflare:workers";

import { HttpError } from "./http";

const SESSION_COOKIE = "civicflow_admin_session";
const CSRF_COOKIE = "civicflow_csrf";
const SESSION_DURATION_SECONDS = 30 * 60;
const DEFAULT_SESSION_SECRET = "civicflow-portfolio-session-key-change-before-production";

interface AdminSession {
  username: string;
  csrfToken: string;
  expiresAt: number;
}

const encoder = new TextEncoder();

function runtimeEnv(): Cloudflare.Env {
  return env as Cloudflare.Env;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = runtimeEnv().SESSION_SECRET?.trim() || DEFAULT_SESSION_SECRET;
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), encoder.encode(value));
  return toBase64Url(new Uint8Array(signature));
}

async function makeSessionToken(session: AdminSession): Promise<string> {
  const payload = toBase64Url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload)}`;
}

async function parseSessionToken(token: string): Promise<AdminSession | null> {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  try {
    const verified = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      fromBase64Url(signature).buffer as ArrayBuffer,
      encoder.encode(payload),
    );
    if (!verified) return null;

    const parsed = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Partial<AdminSession>;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.csrfToken !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }
    return parsed as AdminSession;
  } catch {
    return null;
  }
}

function cookieMap(request: Request): Map<string, string> {
  const result = new Map<string, string>();
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    result.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return result;
}

function cookieAttributes(request: Request, maxAge: number, httpOnly: boolean): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; SameSite=Strict${httpOnly ? "; HttpOnly" : ""}${secure}`;
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) throw new HttpError(403, "This action must come from the CivicFlow app.");

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      throw new HttpError(403, "This action must come from the CivicFlow app.");
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(403, "This action must come from the CivicFlow app.");
  }
}

export function validateAdminCredentials(username: string, password: string): boolean {
  const configuredUsername = runtimeEnv().ADMIN_USERNAME?.trim() || "admin";
  const configuredPassword = runtimeEnv().ADMIN_PASSWORD || "admin";
  return constantTimeEqual(username, configuredUsername) && constantTimeEqual(password, configuredPassword);
}

export async function createAdminSession(request: Request): Promise<{
  csrfToken: string;
  setCookies: string[];
}> {
  const username = runtimeEnv().ADMIN_USERNAME?.trim() || "admin";
  const csrfToken = randomToken();
  const token = await makeSessionToken({
    username,
    csrfToken,
    expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1_000,
  });

  return {
    csrfToken,
    setCookies: [
      `${SESSION_COOKIE}=${token}; ${cookieAttributes(request, SESSION_DURATION_SECONDS, true)}`,
      `${CSRF_COOKIE}=${csrfToken}; ${cookieAttributes(request, SESSION_DURATION_SECONDS, false)}`,
    ],
  };
}

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const token = cookieMap(request).get(SESSION_COOKIE);
  if (!token) return null;
  return parseSessionToken(token);
}

export async function requireAdminSession(request: Request, requireCsrf = false): Promise<AdminSession> {
  const session = await getAdminSession(request);
  if (!session) throw new HttpError(401, "Your admin session has expired. Sign in again.");

  if (requireCsrf) {
    assertSameOrigin(request);
    const csrfHeader = request.headers.get("x-csrf-token") ?? "";
    const csrfCookie = cookieMap(request).get(CSRF_COOKIE) ?? "";
    if (
      !constantTimeEqual(csrfHeader, session.csrfToken) ||
      !constantTimeEqual(csrfCookie, session.csrfToken)
    ) {
      throw new HttpError(403, "The security token is missing or invalid. Refresh and try again.");
    }
  }

  return session;
}

export function appendSessionCookies(headers: Headers, cookies: string[]): void {
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
}

export function clearSessionCookies(request: Request): string[] {
  return [
    `${SESSION_COOKIE}=; ${cookieAttributes(request, 0, true)}`,
    `${CSRF_COOKIE}=; ${cookieAttributes(request, 0, false)}`,
  ];
}
