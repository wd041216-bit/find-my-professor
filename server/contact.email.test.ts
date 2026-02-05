import { describe, it, expect, vi } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { notifyOwner } from './_core/notification';

// Mock the notifyOwner function
vi.mock('./_core/notification', () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-contact-email',
    email: 'test-contact@example.com',
    name: 'Test Contact User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };
}

describe('Contact Message Email Notification', () => {
  const ctx = createUserContext();
  const caller = appRouter.createCaller(ctx);

  it('should send email notification when contact message is created', async () => {
    const messageData = {
      messageType: 'support' as const,
      subject: 'Test Support Question',
      message: 'This is a test message to verify email notifications work correctly.',
    };

    // Send contact message
    const result = await caller.contact.send(messageData);

    // Verify message was created
    expect(result.success).toBe(true);
    expect(result.messageId).toBeGreaterThan(0);

    // Verify notifyOwner was called
    expect(notifyOwner).toHaveBeenCalled();
    
    // Get the call arguments
    const calls = vi.mocked(notifyOwner).mock.calls;
    const lastCall = calls[calls.length - 1];
    const [payload] = lastCall;

    // Verify email content
    expect(payload.title).toContain('New Contact Message');
    expect(payload.title).toContain(messageData.subject);
    expect(payload.content).toContain('Problem/Question'); // Message type label
    expect(payload.content).toContain('Test Contact User'); // User name
    expect(payload.content).toContain(messageData.message);
    expect(payload.content).toContain('admin/messages'); // Admin panel link
  });

  it('should include correct message type labels in email', async () => {
    const testCases = [
      { type: 'business' as const, expectedLabel: 'Business Cooperation' },
      { type: 'support' as const, expectedLabel: 'Problem/Question' },
      { type: 'purchase' as const, expectedLabel: 'Purchase Credits' },
    ];

    for (const testCase of testCases) {
      // Clear previous calls
      vi.mocked(notifyOwner).mockClear();

      await caller.contact.send({
        messageType: testCase.type,
        subject: `Test ${testCase.type} message`,
        message: 'Test message content',
      });

      // Verify correct label was used
      const calls = vi.mocked(notifyOwner).mock.calls;
      const lastCall = calls[calls.length - 1];
      const [payload] = lastCall;
      
      expect(payload.content).toContain(testCase.expectedLabel);
    }
  });

  it('should not fail if email notification fails', async () => {
    // Mock notifyOwner to throw error
    vi.mocked(notifyOwner).mockRejectedValueOnce(new Error('Email service unavailable'));

    // Send contact message
    const result = await caller.contact.send({
      messageType: 'support',
      subject: 'Test message with email failure',
      message: 'This should still succeed even if email fails',
    });

    // Verify message was still created successfully
    expect(result.success).toBe(true);
    expect(result.messageId).toBeGreaterThan(0);

    // Restore mock
    vi.mocked(notifyOwner).mockResolvedValue(true);
  });

  it('should include user email in notification when available', async () => {
    vi.mocked(notifyOwner).mockClear();

    await caller.contact.send({
      messageType: 'business',
      subject: 'Business inquiry',
      message: 'I would like to discuss a partnership opportunity.',
    });

    const calls = vi.mocked(notifyOwner).mock.calls;
    const lastCall = calls[calls.length - 1];
    const [payload] = lastCall;

    expect(payload.content).toContain('test-contact@example.com');
  });
});
