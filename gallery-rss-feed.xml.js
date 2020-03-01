const entries = [
	{
		title: "Fixed easter egg not responding to clicks.",
		desc: "Some CSS had disabled input for the easter egg.",
		url: "https://ddr0.github.io/gallery.html",
		date: "2020-02-28",
	},
]

;`
<?xml version="1.0"?>
<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'>
	<channel>
		<title>DDR's Gallery</title>
		<atom:id>https://ddr0.ca/gallery</atom:id>
		<link>https://ddr0.ca/gallery</link>
		<description>Updates to DDR's gallery. Get notified of new projects!</description>
		<atom:updated>${new Date().toISOString()}</atom:updated>
		<atom:link href='https://ddr0.ca/gallery'></atom:link>
		<atom:link href='https://ddr0.ca/gallery-rss-feed.xml'
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