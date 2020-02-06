const entries = [
	{
		title: "-",
		desc: "No feed available.",
		url: "https://ddr0.github.io/gallery.html",
	},
]

;`
<?xml version="1.0"?>
<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'>
	<channel>
		<title>DDR's Gallery</title>
		<link>https://ddr0.github.com/gallery</link>
		<description>Updates to DDR's gallery. Get notified of new projects!</description>
		<atom:link href='https://ddr0.github.io'></atom:link>
		<atom:link href='https://ddr0.github.io/gallery-rss-feed.xml'
			rel='self' type='application/rss+xml'></atom:link>
		
		
		${entries.map(entry => `
		<item>
			<title>${entry.title}</title>
			<description>${entry.desc}</description>
			<link>${entry.url}</link>
			<guid isPermaLink='true'>${entry.url}</guid>
			<source url="${entry.url}"></source>
		</item>
		`).join('')}
	</channel>
</rss>
`