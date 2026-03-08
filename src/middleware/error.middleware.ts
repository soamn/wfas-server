import type { Response } from "express";
import { AppError } from "../errors/AppError.js";

export function errorHandler(err: Error, res: Response) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  return res.status(500).json({
    error: {
      message: err.message,
      code: err.name,
    },
  });
}
