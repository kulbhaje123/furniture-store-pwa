function SyncIndicator({ isOnline, pendingCount, isSyncing }) {
	const label = isSyncing
		? 'Syncing...'
		: !isOnline
			? 'Offline'
			: pendingCount > 0
				? `${pendingCount} pending`
				: 'Online';

	return (
		<span className="connection-status" role="status" aria-live="polite">{label}</span>
	);
}

export default SyncIndicator;
