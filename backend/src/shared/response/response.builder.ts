
import { HttpStatus } from '@nestjs/common';

export class Response<T> {
    statusCode: number;
    message: string;
    service?: string;
    data?: T;

    constructor(statusCode: number, message: string, data?: T, service?: string) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.service = service;
    }

    static builder<T>() {
        return new ResponseBuilder<T>();
    }
}

class ResponseBuilder<T> {
    private _statusCode: number = HttpStatus.OK;
    private _message: string = 'default.message.success';
    private _service: string = process.env.SERVICE_NAME || 'Backend-Service';
    private _data?: T;

    status(status: HttpStatus): ResponseBuilder<T> {
        this._statusCode = status;
        return this;
    }

    statusCode(statusCode: number): ResponseBuilder<T> {
        this._statusCode = statusCode;
        return this;
    }

    message(message: string): ResponseBuilder<T> {
        this._message = message;
        return this;
    }

    service(service: string): ResponseBuilder<T> {
        this._service = service;
        return this;
    }

    data(data: T): ResponseBuilder<T> {
        this._data = data;
        return this;
    }

    build(): Response<T> {
        return new Response<T>(this._statusCode, this._message, this._data, this._service);
    }
}
