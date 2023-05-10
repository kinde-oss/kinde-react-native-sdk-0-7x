export class UnexpectedException extends Error {
    public name: string;
    public property: string;

    constructor(msg: string) {
        super(`Unexpected ${msg}`);
        this.name = 'UnexpectedException';
        this.property = msg;
    }
}
