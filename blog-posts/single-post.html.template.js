`
${include('site shell intro.html.frag.js', {
	title: metadata.get('title'),
	header: {
		badge: '/images/icons/page.svg',
		titleImg: '/images/text-blog.png',
		titleAlt: 'blog',
	},
	additionalHeadFields: [
		`<link href='/css/blog.css' rel='stylesheet'>`,
		`<link rel="alternate" type="application/rss+xml" title="DDR's Blog" href="/blog-rss-feed.xml" />`,
	],
	...global,
})}
${indent(4, content)}
${paste('site shell outro.html.frag')}
`