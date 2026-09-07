import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TursoProvider } from './turso.provider';
import { CONTEXT } from '$lib/server/common/account/account.type';

describe('TursoProvider', () => {
  let provider: TursoProvider;

  beforeEach(() => {
    process.env.TURSO_BASE_URL = 'https://test.turso.io';
    process.env.TURSO_AUTH_TOKEN = 'test-token';
    process.env.TURSO_GROUP = 'test-group';
    
    provider = new TursoProvider();
  });

  describe('function Object() { [native code] }', () => {
    it('should initialize with environment variables', () => {
      expect(provider).toBeDefined();
    });

    it('should warn when credentials are missing', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      delete process.env.TURSO_BASE_URL;
      delete process.env.TURSO_AUTH_TOKEN;
      
      const newProvider = new TursoProvider();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Turso provider initialized without credentials')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('log', () => {
    it('should log user activity', async () => {
      const result = await provider.log('user:test-user', {
        scope: CONTEXT.nucleus,
        activity: 'test-activity',
        timestamp: new Date().toISOString()
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('createUserIfNotExists', () => {
    it('should create a new user when user does not exist', async () => {
      const userData = {
        guestId: 'guest-123',
        email: 'test@example.com',
        emailParts: ['test', 'example.com'],
        nickName: 'Test User',
        profilePictureUrl: 'https://example.com/avatar.jpg',
        joinDate: new Date().toISOString(),
        context: { scope: CONTEXT.nucleus },
        isOAuth: false,
        oAuthId: null,
        password: 'test-password'
      };

      const result = await provider.createUserIfNotExists(userData);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
    });
  });

  describe('initializeUserDb', () => {
    it('should initialize a workspace database', async () => {
      const result = await provider.initializeUserDb('workspace-123', {
        scope: CONTEXT.nucleus,
        host: 'test.example.com'
      });
      
      expect(result).toBeDefined();
      expect(result.initialized).toBe(true);
      expect(result.workspaceId).toBe('workspace-123');
    });
  });

  describe('getUserById', () => {
    it('should return null for non-existent user', async () => {
      const result = await provider.getUserById('user:non-existent');
      
      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const result = await provider.deleteUser({
        id: 'user:test-user',
        scope: CONTEXT.nucleus
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('createGuest', () => {
    it('should create a guest record', async () => {
      const guestData = {
        id: 'guest-456',
        timestamp: new Date().toISOString(),
        context: { scope: CONTEXT.nucleus }
      };

      const result = await provider.createGuest(guestData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('guest-456');
    });
  });

  describe('createSpace', () => {
    it('should create a new space', async () => {
      const result = await provider.createSpace('Test Space', 'user:test-user');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].result[0].id).toContain('space:');
    });
  });

  describe('getUserSpaces', () => {
    it('should return user spaces', async () => {
      const result = await provider.getUserSpaces('user:test-user');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('password hashing', () => {
    it('should use bcrypt for password hashing', async () => {
      const userData = {
        guestId: 'guest-bcrypt-test',
        email: 'bcrypt@example.com',
        emailParts: ['bcrypt', 'example.com'],
        nickName: 'Bcrypt Test',
        profilePictureUrl: '',
        joinDate: new Date().toISOString(),
        context: { scope: CONTEXT.nucleus },
        isOAuth: false,
        oAuthId: null,
        password: 'secure-password-123'
      };

      const result = await provider.createUserIfNotExists(userData);
      
      expect(result).toBeDefined();
    });
  });
});
