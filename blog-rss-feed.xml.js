const entries = [
	{
		title: "The Start",
		desc: "This is the start of the blog. That's all there is, there is no more.",
		url: "https://ddr0.github.io/blog.html#1",
	},{
		title: "Diagrams and Charts of Game Mechanics",
		desc: "Computer games are, in broad terms, systems of exchange. The player can exchange gold coins for a fancy sword; time and attention for progress; or the player can sit back and watch the game exchange stuff with itself. By graphing interactions between the player and bits of the game, we can see what the focus of the play of the game will be. Lets start off by looking at the simplest example there is, Progress Quest.",
		url: "https://ddr0.github.io/blog.html#2",
	},{
		title: "Practical CreateJS Examples",
		desc: "I have found it difficult to find nice, simple examples of how to lay out an EaselJS program. The documentation and examples generally do a good job of covering the nuts and bolts of the library, but I find that some additional assembly instructions would be helpful. So, in rough order of my progression through the library, here are 5 examples:",
		url: "https://ddr0.github.io/blog.html#3",
	},{
		title: "Gifs to Pngs",
		desc: "An improved script to convert gif animations to spritesheet pngs.",
		url: "https://ddr0.github.io/blog.html#4",
	},{
		title: "Gallery Update",
		desc: "Added ComeFrom 2 and canvasgame entries to gallery.",
		url: "https://ddr0.github.io/gallery.html",
	},{
		title: "Calculating a Bounce",
		desc: "Given a ball and a curved wall, how do we calculate the angle of the bounce of the ball?",
		url: "https://ddr0.github.io/blog.html#5",
	},{
		title: "A Case Against Text Templating",
		desc: "By throwing out valuable structural information, text templating makes you write bad code.",
		url: "https://ddr0.github.io/blog.html#6",
	}
]

;`
<?xml version="1.0"?>
<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'>
	<channel>
		<title>DDR's Blog</title>
		<link>https://ddr0.github.com</link>
		<description>Updates to DDR's Blog. Get notified of new posts!</description>
		<atom:link href='https://ddr0.github.io'></atom:link>
		<atom:link href='https://ddr0.github.io/blog-rss-feed.xml'
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