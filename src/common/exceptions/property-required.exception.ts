export class PropertyRequiredException extends Error {
    public name: string;
    public property: string;
    constructor(msg: string) {
        super(`${msg} cannot be empty`);
        this.name = 'PropertyRequiredException';
        this.property = msg;
    }
}
