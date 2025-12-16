import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { env } from '../config/env';
import { IUser } from '../interfaces/user.interface';
import { VerificationEmailRepository } from '../repositories/verificationEmail.repository';
import { EmailBuilder } from '../templates/email.builder';
import { IVerificationEmail } from '../interfaces/auth.interface';

export class EmailService {
  private _transporter;
  private _verificationEmailRepo: VerificationEmailRepository;

  constructor(verificationEmailRepo: VerificationEmailRepository) {
    this._transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: Number(env.EMAIL_PORT),
      secure: false,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
    this._verificationEmailRepo = verificationEmailRepo;
  }

  /**
   * Create and send email verification
   */
  async createVerificationEmail(user: Partial<IUser>): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await this._verificationEmailRepo.create({
      userId: user._id!,
      token: hashedToken,
    });

    const verificationLink = `${env.CLIENT_URL}/verify-email?token=${token}`;
    const html = EmailBuilder.renderVerification({ verificationLink });

    await this.sendEmail(user.email!, 'Verify your email', html);
  }

  async deleteVerificationToken(token: string): Promise<void> {
    await this._verificationEmailRepo.deleteByToken(token);
  }

  async verifyEmailToken(token: string): Promise<IVerificationEmail | null> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this._verificationEmailRepo.findByToken(hashedToken);
    return verification;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: Partial<IUser>, resetToken: string): Promise<void> {
    const resetLink = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const html = EmailBuilder.renderPasswordReset({
      username: user.username!,
      resetLink,
    });

    await this.sendEmail(user.email!, 'Reset your password', html);
  }

  async sendWelcomeEmail(user: Partial<IUser>): Promise<void> {
    const html = EmailBuilder.renderWelcome({
      username: user.username!,
      appUrl: env.CLIENT_URL,
    });

    await this.sendEmail(user.email!, 'Welcome to Hypertube!', html);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"Hypertube" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    await this._transporter.sendMail(mailOptions);
  }
}