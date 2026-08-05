import { NextFunction, Request, Response } from 'express';

/**
 * Express 4 does not forward rejected promises from async handlers to the
 * error middleware on its own — without this, a throw inside an async
 * route just hangs the request instead of producing a 500.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
