export class ApiError extends Error {

    public readonly statuscode: number

    constructor(message: string, statuscode: number) {
        super(message)
        this.statuscode = statuscode
    }
}

export class NotFoundError extends ApiError {

    constructor(message: string) {
        super(message, 404)
    }
}