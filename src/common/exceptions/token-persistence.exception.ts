export class TokenPersistenceError extends Error {
    public name: string;

    constructor(
        message = 'Failed to persist authentication tokens to secure storage'
    ) {
        super(message);
        this.name = 'TokenPersistenceError';
    }
}
