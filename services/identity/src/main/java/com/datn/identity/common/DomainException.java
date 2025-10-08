package com.datn.identity.common;

public class DomainException extends RuntimeException {
    public DomainException(String code){ super(code); }
    public DomainException(String code, String detail){ super(code + (detail != null? (":" + detail) : "")); }
}