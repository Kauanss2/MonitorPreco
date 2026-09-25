import express, { NextFunction, Response, Request } from "express";
import { ApiError } from "./apiErrors";





export const errorMiddleware = (error: Error & Partial<ApiError>, req: Request, res: Response, next: NextFunction) => {

    console.log(error.message)
    console.log(error.statuscode)
    if (!error.statuscode) {
        return res.status(500).json("Internal Server Error")
    }

    return res.status(error.statuscode).json({ message: error.message })

}