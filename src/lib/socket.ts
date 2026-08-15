/**
 * PGfy realtime socket — a single shared connection for every server-push feature.
 *
 * The backend is Feathers over socket.io: services publish events as `"<path> <verb>"`
 * (e.g. `"v1/profile-kyc created"`) and the connection is authenticated by *calling*
 * the virtual `authentication` service (`emit('create', 'authentication', …)`) rather than
 * by sending a header. We therefore keep one authenticated socket for the whole session and
 * let features subscribe to the events they care about.
 *
 * Lifecycle is owned by `AuthContext`: it calls `socketManager.connect(token)` when a session
 * is established (login / refresh / boot) and `socketManager.disconnect()` on sign-out. The
 * token is re-sent automatically on every (re)connect, and `connect` is idempotent — passing a
 * new token just re-authenticates the existing socket.
 *
 * Everything here is intentionally framework-free so any screen, hook or context can import
 * `socketManager` and add listeners. KYC is the first consumer (see `SnapKycSheet`).
 */
import { io, type Socket } from 'socket.io-client';
import { config } from './config';
import { DEVICE_TYPE, getDeviceId } from './device';
import { getFcmToken } from './messaging';

/**
 * Connect to `API_URL` exactly as the reference client does — socket.io derives the handshake
 * endpoint (`/socket.io/`) and namespace from this string identically across its clients, so
 * passing the same URL the app already talks REST to keeps the socket in lockstep with the
 * backend's proven setup. (`API_URL` ends in `/api`, which socket.io reads as the namespace.)
 */
function socketUrl(): string {
  return config.apiUrl.replace(/\/+$/, '');
}

/** Well-known server events. Add new ones here so subscribers share a single source of truth. */
export const SocketEvents = {
  /** SnapKYC profile-kyc record was created (status transitions to VERIFIED / REJECTED). */
  snapKycPatched: 'v1/profile-kyc created',
} as const;

type Listener = (...args: unknown[]) => void;

class SocketManager {
  private socket: Socket | null = null;
  private accessToken: string | null = null;
  /** Our own listener registry so we can (re)attach across reconnects and tear down cleanly. */
  private listeners = new Map<string, Set<Listener>>();

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Open (or re-authenticate) the shared socket. Idempotent: the first call creates the
   * connection; later calls with a changed token just re-run authentication.
   */
  connect(accessToken: string): void {
    this.accessToken = accessToken;

    if (this.socket) {
      // Already connected — just refresh auth with the (possibly new) token.
      if (this.socket.connected) void this.authenticate();
      return;
    }

    const socket = io(socketUrl(), {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      forceNew: false,
    });
    this.socket = socket;

    // Re-authenticate and re-bind every subscriber on each (re)connect.
    socket.on('connect', () => {
      void this.authenticate();
      this.rebindListeners();
      console.warn('Socket connected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message ?? err);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[socket] disconnected', reason);
    });

    this.rebindListeners();
  }

  /** Close the socket and forget the token. Listener registrations are preserved for reconnect. */
  disconnect(): void {
    this.accessToken = null;
    if (!this.socket) return;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
  }

  /**
   * Subscribe to a server event. Returns an unsubscribe fn. Safe to call before `connect()` —
   * the handler is bound now (if a socket exists) and re-bound automatically on reconnect.
   */
  on(event: string, handler: Listener): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    this.socket?.on(event, handler);

    return () => {
      set?.delete(handler);
      this.socket?.off(event, handler);
      if (set && set.size === 0) this.listeners.delete(event);
    };
  }

  /**
   * Authenticate the socket against Feathers' virtual `authentication` service. Feathers acks
   * with `(error, result)`, so we use the callback form (not `emitWithAck`, which would resolve
   * with the error slot) and reject on a non-null error.
   */
  private async authenticate(): Promise<void> {
    const socket = this.socket;
    const token = this.accessToken;
    if (!socket || !token) return;

    const [deviceId, fcmId] = await Promise.all([getDeviceId(), getFcmToken()]);
    const payload = {
      deviceId,
      deviceType: DEVICE_TYPE,
      accessToken: token,
      strategy: 'jwt',
      ...(fcmId ? { fcmId } : {}),
    };

    await new Promise<void>((resolve) => {
      socket.emit('create', 'authentication', payload, (error: unknown) => {
        if (error) {
          console.warn('[socket] authentication failed', error);
        }
        resolve();
      });
    });
  }

  /** (Re)attach every registered listener to the live socket — used on connect/reconnect. */
  private rebindListeners(): void {
    const socket = this.socket;
    if (!socket) return;
    this.listeners.forEach((set, event) => {
      set.forEach((handler) => {
        socket.off(event, handler);
        socket.on(event, handler);
      });
    });
  }
}

/** App-wide singleton. Import this, never construct your own. */
export const socketManager = new SocketManager();
