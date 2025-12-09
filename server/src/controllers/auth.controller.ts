import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';
import { ILoginDTO, ISignupDTO } from '../interfaces/auth.interface';
import { UnauthorizedError } from '../core/errors/customErrors';
import { asyncHandler } from '../utils/asyncHandler';

export class AuthController {
  private _service: AuthService;

  constructor(service: AuthService) {
    this._service = service;
  }

  signUp = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated!.body as ISignupDTO;

    const newUser = await this._service.signUp(body);
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: newUser,
    });
  });

  logIn = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validated!.body as ILoginDTO;

    const result = await this._service.logIn(body);
    if (!result) {
      throw new UnauthorizedError('Invalid identifier or password');
    }
    // Set tokens in httpOnly cookies
    res.cookie('accessToken', result.access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });
    res.cookie('refreshToken', result.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth/refresh-token',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        userId: result.user._id,
        username: result.user.username,
        email: result.user.email,
      },
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }
    const result = await this._service.refreshToken(refreshToken);

    res.cookie('accessToken', result.access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 1 * 60 * 60 * 1000, // 1 hour
    });
    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
    });
  });
}
