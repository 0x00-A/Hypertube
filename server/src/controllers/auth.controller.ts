import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { env, MAX_AGE_ACCESS_TOKEN, MAX_AGE_REFRESH_TOKEN } from '../config/env';
import { IJWTPayload, ILoginDTO, ISignupDTO } from '../interfaces/auth.interface';
import { UnauthorizedError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';
import { JWTService } from '../services/jwt.service';

export class AuthController {

  constructor(private _authService: AuthService, private _jwtService: JWTService) {}

  signUp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated!.body as ISignupDTO;

    await this._authService.signUp(body);
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
    });
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.validated!.body as { token: string };
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const isVerified = await this._authService.verifyEmail(token);
    if (!isVerified) {
      throw new UnauthorizedError('Invalid or expired verification token');
    }
    return res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  });

  logIn = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated!.body as ILoginDTO;

    const user = await this._authService.logIn(body);
    if (!user) {
      throw new UnauthorizedError('Invalid identifier or password');
    }
    const payload: IJWTPayload = { userId: user._id! };
    const tokens = this._jwtService.generateTokens(payload);

    res.cookie('accessToken', tokens.access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' && env.CLIENT_URL.startsWith('https'),
      sameSite: 'strict',
      path: '/',
      maxAge: MAX_AGE_ACCESS_TOKEN
    });
    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' && env.CLIENT_URL.startsWith('https'),
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-token',
      maxAge: MAX_AGE_REFRESH_TOKEN
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }
    const result = await this._jwtService.refreshToken(refreshToken);

    res.cookie('accessToken', result.access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' && env.CLIENT_URL.startsWith('https'),
      sameSite: 'strict',
      path: '/',
      maxAge: MAX_AGE_ACCESS_TOKEN
    });
    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' && env.CLIENT_URL.startsWith('https'),
      sameSite: 'strict',
      path: '/',
      maxAge: MAX_AGE_ACCESS_TOKEN
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production' && env.CLIENT_URL.startsWith('https'),
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-token',
      maxAge: MAX_AGE_REFRESH_TOKEN
    });
    return res.status(200).json({
      status: 'success',
      message: 'Logout successful',
    });
  });

  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.validated!.body as { email: string };

    await this._authService.requestPasswordReset(email);
    return res.status(200).json({
      status: 'success',
      message: 'Password reset email sent if the email exists in our system',
    });
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.validated!.body as { token: string; newPassword: string };

    await this._authService.resetPassword(token, newPassword);
    return res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully',
    });
  });

}