import type { NextFunction, Request, Response } from "express";
declare const verifyToken: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export default verifyToken;
//# sourceMappingURL=verifyToken.d.ts.map