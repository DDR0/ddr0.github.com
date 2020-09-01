`
${include('site shell intro.html.frag.js', {
	title: 'Contact',
	header: {
		badge: '/images/icons/chat2.svg',
		titleImg: '/images/text-contact.png',
		titleAlt: 'contact',
	},
})}
${indent(4, `
	<p>You can reach me at d@ddr0.com, on Github as DDR0, or on Discord as DDR#0001.</p>
	
	<p>See also: <a href="/files/personal/resume.pdf">my resume</a>.</p>
`)}
${paste('site shell outro.html.frag')}
`