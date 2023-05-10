export class UnAuthenticatedException extends Error {
    public name: string;
    public property: string;
    constructor(msg?: string) {
        super(msg ?? 'Request is missing required authentication credential');
        this.name = 'UnAuthenticatedException';
        this.property =
            msg ?? 'Request is missing required authentication credential';
    }
}
