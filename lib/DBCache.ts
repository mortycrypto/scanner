import { Cache } from "./Cache";

export class DBCache extends Cache {
    public static async new(): Promise<DBCache> {
        return super.new(`${__dirname}/../db.json`);
    }
}