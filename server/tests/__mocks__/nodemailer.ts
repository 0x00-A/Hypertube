/**
 * Mock implementation of nodemailer for testing
 * Prevents real SMTP connections during test execution
 */

const sendMailMock = jest.fn().mockResolvedValue({
  messageId: 'test-message-id',
  accepted: ['test@example.com'],
  rejected: [],
  response: '250 Message accepted',
});

const createTransportMock = jest.fn().mockReturnValue({
  sendMail: sendMailMock,
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn(),
});

export default {
  createTransport: createTransportMock,
};

// Export for resetting in tests
export { sendMailMock, createTransportMock };
