package com.tretto.exception;

import org.springframework.http.HttpStatus;

public class TrettoException extends RuntimeException {

    private final HttpStatus status;

    public TrettoException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
