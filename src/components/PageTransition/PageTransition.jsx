import { useEffect, useState } from 'react';

export default function PageTransition({ children, routeKey }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		setVisible(false);
		window.scrollTo({ top: 0, behavior: 'auto' });

		const frame = window.requestAnimationFrame(() => {
			setVisible(true);
		});

		return () => window.cancelAnimationFrame(frame);
	}, [routeKey]);

	return (
		<div className={`page-transition${visible ? ' page-visible' : ''}`}>
			{children}
		</div>
	);
}
