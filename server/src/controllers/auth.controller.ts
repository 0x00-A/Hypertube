import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const service = new AuthService();


export async function signUp(req: Request, res: Response, next: NextFunction) {
    try {
        // Validation is handled by middleware, get validated data
        const { body } = (req as any).validated;

        const newUser = await service.signUp(body);
        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                userId: newUser.id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (err) {
        next(err);
    }
}
