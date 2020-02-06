`
${include('site shell intro.html.frag.js', {
	title: 'Contact',
	header: {
		badge: 'images/icons/chat2.svg',
		titleImg: 'images/text-contact.png',
		titleAlt: 'contact',
	},
})}
${indent(4, `
	You can reach me at robertsdavidddr@gmail.com, on Github as DDR0, or on IRC as DDR on freenode.net.
`)}
${paste('site shell outro.html.frag')}
`