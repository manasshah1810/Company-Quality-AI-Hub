import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../../db.json");

class DocumentSnapshot {
    constructor(public id: string, private dataObj: any | undefined) { }
    get exists() { return this.dataObj !== undefined; }
    data() { return this.dataObj; }
}

class Query {
    constructor(private pathParts: string[], private root: LocalDb, private ops: any[] = []) { }

    orderBy(field: string, direction: "asc" | "desc" = "asc") {
        return new Query(this.pathParts, this.root, [...this.ops, { type: "order", field, direction }]);
    }

    limit(n: number) {
        return new Query(this.pathParts, this.root, [...this.ops, { type: "limit", count: n }]);
    }

    where(field: string, op: string, value: any) {
        return new Query(this.pathParts, this.root, [...this.ops, { type: "where", field, op, value }]);
    }

    async get() {
        let collectionData = this.root.readPath(this.pathParts) || {};
        let docs = Object.entries(collectionData).map(([id, data]) => new DocumentSnapshot(id, data));

        for (const op of this.ops) {
            if (op.type === "where") {
                docs = docs.filter(doc => {
                    const data = doc.data();
                    if (op.op === "==") return data?.[op.field] === op.value;
                    return true;
                });
            }
            if (op.type === "order") {
                docs.sort((a, b) => {
                    const valA = a.data()?.[op.field];
                    const valB = b.data()?.[op.field];
                    if (valA < valB) return op.direction === "asc" ? -1 : 1;
                    if (valA > valB) return op.direction === "asc" ? 1 : -1;
                    return 0;
                });
            }
            if (op.type === "limit") {
                docs = docs.slice(0, op.count);
            }
        }

        return {
            docs,
            empty: docs.length === 0,
            forEach: (callback: (doc: any) => void) => docs.forEach(callback)
        };
    }
}

class DocumentReference {
    constructor(public id: string, private pathParts: string[], private root: LocalDb) { }

    collection(name: string) {
        return new CollectionReference([...this.pathParts, name], this.root);
    }

    async get() {
        const data = this.root.readPath(this.pathParts);
        return new DocumentSnapshot(this.id, data);
    }

    async set(data: any) {
        this.root.writePath(this.pathParts, data);
    }

    async update(data: any) {
        const current = this.root.readPath(this.pathParts) || {};
        this.root.writePath(this.pathParts, { ...current, ...data });
    }
}

class CollectionReference {
    constructor(private pathParts: string[], private root: LocalDb) { }

    doc(id: string) {
        return new DocumentReference(id, [...this.pathParts, id], this.root);
    }

    async add(data: any) {
        const id = "job_" + Math.random().toString(36).substring(2, 11);
        const docRef = this.doc(id);
        await docRef.set(data);
        return docRef;
    }

    orderBy(field: string, direction: "asc" | "desc" = "asc") {
        return new Query(this.pathParts, this.root).orderBy(field, direction);
    }

    limit(n: number) {
        return new Query(this.pathParts, this.root).limit(n);
    }

    where(field: string, op: string, value: any) {
        return new Query(this.pathParts, this.root).where(field, op, value);
    }

    async get() {
        return new Query(this.pathParts, this.root).get();
    }
}

export class LocalDb {
    private data: any = {};

    constructor() {
        this.load();
    }

    private load() {
        if (fs.existsSync(DB_PATH)) {
            try {
                this.data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
            } catch (e) {
                this.data = {};
            }
        }
    }

    private save() {
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
    }

    readPath(parts: string[]) {
        let current = this.data;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    writePath(parts: string[], val: any) {
        let current = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== "object") {
                current[part] = {};
            }
            current = current[part];
        }
        current[parts[parts.length - 1]] = val;
        this.save();
    }

    collection(name: string) {
        return new CollectionReference([name], this);
    }

    settings(conf: any) {
        // Mock for Firestore settings
    }
}
