import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { env } from '../config/env';
import { IUser } from '../interfaces/user.interface';
import { VerificationEmailRepository } from '../repositories/verificationEmail.repository';
import { EmailBuilder } from '../templates/email.builder';
import { IVerificationEmail } from '../interfaces/auth.interface';
import { logger } from '../utils/logger';

export class EmailService {
  private _transporter;
  private _verificationEmailRepo: VerificationEmailRepository;

  constructor(verificationEmailRepo: VerificationEmailRepository) {
    this._transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: Number(env.EMAIL_PORT),
      secure: false, // false for 587, true for 465
      requireTLS: true, // Required for Gmail SMTP
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
    this._verificationEmailRepo = verificationEmailRepo;
  }

  async createEmailToken(
    user: Partial<IUser>,
    type: 'verification' | 'password_reset',
  ): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Delete any existing token of this type for this user (best practice: only most recent token is valid)
    await this._verificationEmailRepo.deleteByUserIdAndType(user._id!, type);

    await this._verificationEmailRepo.create({
      userId: user._id!,
      token: hashedToken,
      type,
    });

    if (type === 'verification') {
      const verificationLink = `${env.CLIENT_URL}/verify-email?token=${token}`;
      const html = EmailBuilder.renderVerification({ verificationLink });
      await this.sendEmail(user.email!, 'Verify your email', html);
    } else {
      const resetLink = `${env.CLIENT_URL}/reset-password?token=${token}`;
      const html = EmailBuilder.renderPasswordReset({
        username: user.username!,
        resetLink,
      });
      await this.sendEmail(user.email!, 'Reset your password', html);
    }
  }

  async deleteVerificationToken(token: string): Promise<void> {
    await this._verificationEmailRepo.deleteByToken(token);
  }

  async verifyEmailToken(token: string): Promise<IVerificationEmail | null> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this._verificationEmailRepo.findByToken(hashedToken);
    if (!verification || verification.type !== 'verification') return null;

    return {
      userId: verification.userId.toString(),
      token: verification.token,
      type: verification.type,
    };
  }

  async verifyPasswordResetToken(token: string): Promise<IVerificationEmail | null> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this._verificationEmailRepo.findByToken(hashedToken);
    if (!verification || verification.type !== 'password_reset') return null;

    return {
      userId: verification.userId.toString(),
      token: verification.token,
      type: verification.type,
    };
  }

  async sendWelcomeEmail(user: Partial<IUser>): Promise<void> {
    const html = EmailBuilder.renderWelcome({
      username: user.username!,
      appUrl: env.CLIENT_URL,
    });

    await this.sendEmail(user.email!, 'Welcome to Hypertube!', html);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    const mailOptions = {
      from: `"Hypertube" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    try {
      await this._transporter.sendMail(mailOptions);
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown email error';
      logger.error({ to, subject, err: errorMessage }, 'Failed to send email');
      return false;
    }
  }
}
