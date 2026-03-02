import { getDatabase, type User, user } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export async function getUser(userId: number, platform: App.Platform): Promise<User | null> {
	const db = getDatabase(platform);
	const [result] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
	return result ?? null;
}
