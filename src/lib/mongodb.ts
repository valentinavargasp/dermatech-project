import mongoose from 'mongoose';
import { seedDatabase } from './seed';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    seeded: boolean;
    uri?: string;
}

declare global {
    var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
    conn: null,
    promise: null,
    seeded: false,
};

if (!global.mongooseCache) {
    global.mongooseCache = cached;
}

export async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error('Por favor define la variable MONGODB_URI en .env.local');
    }

    if (cached.conn && cached.uri === MONGODB_URI && mongoose.connection.readyState === 1) {
        if (!cached.seeded) {
            await seedDatabase();
            cached.seeded = true;
        }
        return cached.conn;
    }

    if (cached.uri && cached.uri !== MONGODB_URI) {
        try {
            await mongoose.disconnect();
        } catch {
            // ignore disconnect error
        }
        cached.conn = null;
        cached.promise = null;
        cached.seeded = false;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.uri = MONGODB_URI;
        cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
            console.log('Conectado a MongoDB Atlas:', mongooseInstance.connection.name);
            await seedDatabase();
            cached.seeded = true;
            return mongooseInstance;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}
