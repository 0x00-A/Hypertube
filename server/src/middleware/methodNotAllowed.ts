import { Request, Response } from 'express';

export const methodNotAllowed = (req: Request, res: Response): void => {
  res.status(405).json({ status: 'error', message: `Method ${req.method} not allowed on this endpoint` });
};
