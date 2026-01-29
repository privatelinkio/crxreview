import type { Env, Session } from '../types/index';
import { generateSessionId } from '../utils/helpers';
import { getLogger } from '../utils/logger';

/**
 * Session service for KV namespace operations
 */
export class SessionService {
  private sessionTtl: number;

  constructor(
    private kv: KVNamespace,
    sessionTtl: string = '1800',
    private logger = getLogger()
  ) {
    this.sessionTtl = parseInt(sessionTtl, 10);
  }

  /**
   * Create a new session
   */
  async createSession(data: Record<string, any>): Promise<Session> {
    try {
      const id = generateSessionId();
      const now = Date.now();
      const expiresAt = now + this.sessionTtl * 1000;

      const session: Session = {
        id,
        createdAt: now,
        expiresAt,
        data,
      };

      await this.kv.put(
        `session:${id}`,
        JSON.stringify(session),
        {
          expirationTtl: this.sessionTtl,
        }
      );

      this.logger.info('Session created', { id });
      return session;
    } catch (error) {
      this.logger.error('Failed to create session', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<Session | null> {
    try {
      const data = await this.kv.get(`session:${id}`);

      if (!data) {
        this.logger.warn('Session not found', { id });
        return null;
      }

      const session = JSON.parse(data) as Session;

      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        this.logger.warn('Session expired', { id });
        await this.deleteSession(id);
        return null;
      }

      return session;
    } catch (error) {
      this.logger.error('Failed to get session', error, { id });
      throw error;
    }
  }

  /**
   * Update session data
   */
  async updateSession(id: string, data: Record<string, any>): Promise<Session | null> {
    try {
      const session = await this.getSession(id);

      if (!session) {
        return null;
      }

      const updated: Session = {
        ...session,
        data: {
          ...session.data,
          ...data,
        },
      };

      await this.kv.put(
        `session:${id}`,
        JSON.stringify(updated),
        {
          expirationTtl: this.sessionTtl,
        }
      );

      this.logger.info('Session updated', { id });
      return updated;
    } catch (error) {
      this.logger.error('Failed to update session', error, { id });
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(id: string): Promise<void> {
    try {
      await this.kv.delete(`session:${id}`);
      this.logger.info('Session deleted', { id });
    } catch (error) {
      this.logger.error('Failed to delete session', error, { id });
      throw error;
    }
  }

  /**
   * Set session value
   */
  async setSessionValue(
    sessionId: string,
    key: string,
    value: any
  ): Promise<void> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      const updated = await this.updateSession(sessionId, {
        [key]: value,
      });

      if (!updated) {
        throw new Error('Failed to update session');
      }

      this.logger.info('Session value set', { sessionId, key });
    } catch (error) {
      this.logger.error('Failed to set session value', error, { sessionId, key });
      throw error;
    }
  }

  /**
   * Get session value
   */
  async getSessionValue(sessionId: string, key: string): Promise<any> {
    try {
      const session = await this.getSession(sessionId);

      if (!session) {
        return null;
      }

      return session.data[key] || null;
    } catch (error) {
      this.logger.error('Failed to get session value', error, { sessionId, key });
      throw error;
    }
  }

  /**
   * Extend session expiration
   */
  async extendSession(id: string): Promise<Session | null> {
    try {
      const session = await this.getSession(id);

      if (!session) {
        return null;
      }

      const extended: Session = {
        ...session,
        expiresAt: Date.now() + this.sessionTtl * 1000,
      };

      await this.kv.put(
        `session:${id}`,
        JSON.stringify(extended),
        {
          expirationTtl: this.sessionTtl,
        }
      );

      this.logger.info('Session extended', { id });
      return extended;
    } catch (error) {
      this.logger.error('Failed to extend session', error, { id });
      throw error;
    }
  }

  /**
   * Clear all sessions (admin operation)
   */
  async clearAllSessions(): Promise<number> {
    try {
      let count = 0;
      const list = await this.kv.list({ prefix: 'session:' });

      for (const item of list.keys) {
        await this.kv.delete(item.name);
        count++;
      }

      this.logger.info('Sessions cleared', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to clear sessions', error);
      throw error;
    }
  }
}
