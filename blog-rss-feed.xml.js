//Entries is populated by compile-blog.node.js, which is called from build.js.
`
<?xml version="1.0"?>
<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'>
	<channel>
		<title>DDR's Blog</title>
		<atom:id>https://ddr0.ca</atom:id>
		<link>https://ddr0.ca/blog.html</link>
		<description>Updates to DDR's Blog. Get notified of new posts!</description>
		<atom:updated>${new Date().toISOString()}</atom:updated>
		<atom:link href='https://ddr0.ca/blog.html'></atom:link>
		<atom:link href='https://ddr0.ca/blog-rss-feed.xml' rel='self'></atom:link>
		
		
		${entries.map(entry => `
		<item>
			<title>${entry.get('header')}</title>
			<description>${entry.get('desc')}</description>
			<link>https://ddr0.ca/blog-posts/${entry.get('file')}</link>
			<guid isPermaLink='true'>https://ddr0.ca/blog-posts/${entry.get('file')}</guid>
			<source url="https://ddr0.ca/blog-posts/${entry.get('file')}"></source>
			<pubDate>${new Date(entry.get('published')).toUTCString()}</pubDate>
		</item>
		`).join('')}
	</channel>
</rss>
`