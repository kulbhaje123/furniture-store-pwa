import { getQueuedChanges, markCartItemSynced } from '../db/indexedDB';
import { syncCartItem } from './api';

export async function syncPendingCart() {
	const changes = await getQueuedChanges();
	for (const change of changes) {
		await syncCartItem(change);
		await markCartItemSynced(change);
	}
}
