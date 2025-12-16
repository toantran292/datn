package com.datn.identity.application;

/**
 * Exception thrown when a user tries to login with Google,
 * but an account with that email already exists and is not linked to Google.
 * This allows the handler to redirect to a page where user can link with password.
 */
public class EmailExistsNotLinkedException extends RuntimeException {
    private final String email;
    private final String googleSub;

    public EmailExistsNotLinkedException(String email, String googleSub) {
        super("email_exists_not_linked");
        this.email = email;
        this.googleSub = googleSub;
    }

    public String getEmail() {
        return email;
    }

    public String getGoogleSub() {
        return googleSub;
    }
}
