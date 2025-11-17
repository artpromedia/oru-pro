import { logger } from '../utils/logger';

export type EmailContext = {
  subject: string;
  body: string;
};

const enqueueEmail = async (to: string, context: EmailContext) => {
  logger.info('Email stub invoked', { to, subject: context.subject });
};

export const emailService = {
  async sendInvite(to: string, temporaryPassword: string) {
    await enqueueEmail(to, {
      subject: 'You have been invited to Oonru',
      body: `Temporary password: ${temporaryPassword}`,
    });
  },

  async sendPasswordReset(to: string) {
    await enqueueEmail(to, {
      subject: 'Your password was reset',
      body: 'Password has been reset. Please log in with your new credentials.',
    });
  },

  async sendMfaReminder(to: string) {
    await enqueueEmail(to, {
      subject: 'MFA verification required',
      body: 'Please complete MFA verification to access the control tower.',
    });
  },
};
