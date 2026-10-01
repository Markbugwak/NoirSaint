import { useEffect, useState } from 'react';

export default function PageTransition({ children, routeKey }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		setVisible(false);
		window.scrollTo({ top: 0, behavior: 'instant' });
		const timer = window.setTimeout(() => setVisible(true), 40);
		return () => window.clearTimeout(timer);
	}, [routeKey]);

	return (
		<div className={`page-transition${visible ? ' page-visible' : ''}`}>
			{children}
		</div>
	);
}
