import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';


export class AuthController {
    private _service: AuthService;

    constructor(service: AuthService) {
        this._service = service;
    }

    async signUp(req: Request, res: Response, next: NextFunction) {
        try {
            // Validation is handled by middleware, get validated data
            const { body } = (req as any).validated;

            const newUser = await this._service.signUp(body);
            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: newUser,
            });
        } catch (err) {
            next(err);
        }
    }
}
