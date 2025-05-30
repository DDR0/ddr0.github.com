const entries = [
	{
		title: "Added a few things I worked on at EA to the gallery.",
		desc: "In Full: \"Between 2021 and 2025 I worked at Electronic Arts Inc. Initially I worked on FIFA 22 as a UI engineer, but after release moved to Skate where I am currently a tools engineer.\"",
		url: "https://ddr0.github.io/gallery.html",
		date: "2025-05-14",
	},{
		title: "Fixed easter egg not responding to clicks.",
		desc: "Some CSS had disabled input for the easter egg.",
		url: "https://ddr0.github.io/gallery.html",
		date: "2020-02-28",
	},{
		title: "Added two projects to gallery.",
		desc: "Added two projects to gallery, the Chronos Camera UI and old Cityecho. This brings the gallery fully up to date again.",
		url: "https://ddr0.github.io/gallery.html",
		date: "2020-08-04",
	},{
		title: "Added two small side-projects to gallery.",
		desc: "I have built an accessible, multi-player <a href=\"https://ddr0.ca/%F0%9F%8E%B2\">dice roller</a> and a tiny <a href=\"https://ddr0.ca/side%20projects/reminder\">periodic reminder tool</a>, both added to the final section of the gallery.",
		url: "https://ddr0.github.io/gallery.html",
		date: "2022-04-11",
	},{
		title: "Added another side-project to gallery.",
		desc: "Added the <a href=\"https://ddr0.ca/side projects/visual-emoji-tester\">Visual Emoji Tester</a> side-project, and took another stab at the <a href=\"https://ddr0.ca/side%20projects/reminder\">periodic reminder tool</a>.",
		url: "https://ddr0.github.io/gallery.html",
		date: "2022-12-13",
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
			<source url="${entry.url}"></source>
			<pubDate>${new Date(entry.date).toUTCString()}</pubDate>
		</item>
		`).join('')}
	</channel>
</rss>
`

//Note: removed <guid isPermaLink='true'>${entry.url}</guid> from
//	<items>, gallery items are not currently uniquely referencable.