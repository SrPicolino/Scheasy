import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]', err.stack || err.message);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Um erro inesperado ocorreu no servidor.'
  });
};
