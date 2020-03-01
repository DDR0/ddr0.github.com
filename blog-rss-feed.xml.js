const entries = [
	{
		title: "The Start",
		desc: "This is the start of the blog. That's all there is, there is no more.",
		url: "https://ddr0.ca/blog-posts/01.The_Start_at_the_End.html",
	},{
		title: "Diagrams and Charts of Game Mechanics",
		desc: "Computer games are, in broad terms, systems of exchange. The player can exchange gold coins for a fancy sword; time and attention for progress; or the player can sit back and watch the game exchange stuff with itself. By graphing interactions between the player and bits of the game, we can see what the focus of the play of the game will be. Lets start off by looking at the simplest example there is, Progress Quest.",
		url: "https://ddr0.ca/blog-posts/02.Flowcharts_of_Game_Mechanics.html",
	},{
		title: "Practical CreateJS Examples",
		desc: "I have found it difficult to find nice, simple examples of how to lay out an EaselJS program. The documentation and examples generally do a good job of covering the nuts and bolts of the library, but I find that some additional assembly instructions would be helpful. So, in rough order of my progression through the library, here are 5 examples:",
		url: "https://ddr0.ca/blog-posts/03.CreateJS_Examples.html",
	},{
		title: "Gifs to Pngs",
		desc: "An improved script to convert gif animations to spritesheet pngs.",
		url: "https://ddr0.ca/blog-posts/04.GIFs_To_PNGs.html",
	},{
		title: "Gallery Update",
		desc: "Added ComeFrom 2 and canvasgame entries to gallery.",
		url: "https://ddr0.ca/gallery.html",
	},{
		title: "Calculating a Bounce",
		desc: "Given a ball and a curved wall, how do we calculate the angle of the bounce of the ball?",
		url: "https://ddr0.ca/blog-posts/05.Calculating_a_Bounce.html",
	},{
		title: "A Case Against Text Templating",
		desc: "By throwing out valuable structural information, text templating makes you write bad code.",
		url: "https://ddr0.ca/blog-posts/06.Text_Templating.html",
	},{
		title: "Fixing Wacom Tablets for Hearthstone in Windows",
		desc: "As of 2016-10-29, there is some sort of bug with Hearthstone where it will ignore clicks coming from a tablet. AHK can work around this.",
		url: "https://ddr0.ca/blog-posts/07.Wacom_for_Hearthstone.html",
	},{
		title: "Balancing Braces",
		desc: "Let's write a Javascript function, isBalanced, that returns true if a set of braces is balanced.",
		url: "https://ddr0.ca/blog-posts/08.Balancing_Braces.html",
	}
]

;`
<?xml version="1.0"?>
<rss version='2.0' xmlns:atom='http://www.w3.org/2005/Atom'>
	<channel>
		<title>DDR's Blog</title>
		<atom:id>https://ddr0.ca</atom:id>
		<link>https://ddr0.ca/blog.html</link>
		<description>Updates to DDR's Blog. Get notified of new posts!</description>
		<atom:updated>${new Date().toISOString()}</atom:updated>
		<atom:link href='https://ddr0.ca/blog.html'></atom:link>
		<atom:link href='https://ddr0.ca/blog-rss-feed.xml'
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