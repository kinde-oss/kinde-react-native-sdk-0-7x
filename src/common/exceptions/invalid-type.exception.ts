export class InvalidTypeException extends Error {
    public name: string;

    constructor(result: string, expected: string) {
        super(`InvalidType ${result}. Expected: ${expected}`);
        this.name = 'InvalidTypeException';
    }
}
