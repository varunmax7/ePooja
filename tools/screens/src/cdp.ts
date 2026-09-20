/**
 * A minimal Chrome DevTools Protocol client.
 *
 * Node 26 ships a global `WebSocket`, and Chrome writes the port it chose into
 * `DevToolsActivePort`, so driving a headless browser needs no dependency at
 * all — worth avoiding, given this runs only to produce the Phase 1
 * screenshots.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

export interface ChromeSession {
  send: (method: string, params?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  close: () => Promise<void>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function findChrome(): Promise<string> {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) return fromEnv;

  const { access } = await import('node:fs/promises');
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // try the next one
    }
  }
  throw new Error(
    `No Chrome found. Looked in:\n  ${CHROME_CANDIDATES.join('\n  ')}\nSet CHROME_PATH to override.`,
  );
}

/** Chrome writes `<port>\n<browser ws path>` here once the debugger is up. */
async function readDevToolsEndpoint(userDataDir: string, timeoutMs: number): Promise<string> {
  const file = join(userDataDir, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const [port, path] = (await readFile(file, 'utf8')).split('\n');
      if (port && path) return `ws://127.0.0.1:${port}${path}`;
    } catch {
      // not written yet
    }
    await sleep(100);
  }
  throw new Error('Chrome did not report a DevTools port within the timeout');
}

function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener('open', () => resolve(socket), { once: true });
    socket.addEventListener('error', () => reject(new Error(`Could not connect to ${url}`)), {
      once: true,
    });
  });
}

/**
 * Launches headless Chrome and attaches to one blank page, returning a `send`
 * bound to that page's session.
 */
export async function launchChrome(): Promise<ChromeSession> {
  const chrome = await findChrome();
  const userDataDir = await mkdtemp(join(tmpdir(), 'epooja-screens-'));

  const child: ChildProcess = spawn(
    chrome,
    [
      '--headless=new',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      // The dev server is plain HTTP on localhost, and CanvasKit's wasm is
      // fetched from it.
      '--allow-insecure-localhost',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  const socket = await connect(await readDevToolsEndpoint(userDataDir, 20_000));

  let nextId = 1;
  const pending = new Map<
    number,
    { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void }
  >();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as {
      id?: number;
      result?: Record<string, unknown>;
      error?: { message: string };
    };
    if (message.id === undefined) return; // an event; this client does not listen for any

    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);

    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result ?? {});
  });

  const rawSend = (
    method: string,
    params: Record<string, unknown> = {},
    sessionId?: string,
  ): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });

  const { targetId } = (await rawSend('Target.createTarget', { url: 'about:blank' })) as {
    targetId: string;
  };
  const { sessionId } = (await rawSend('Target.attachToTarget', {
    targetId,
    flatten: true,
  })) as { sessionId: string };

  return {
    send: (method, params) => rawSend(method, params, sessionId),
    close: async () => {
      socket.close();
      child.kill();
      await rm(userDataDir, { recursive: true, force: true });
    },
  };
}
