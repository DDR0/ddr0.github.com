`
<!DOCTYPE html>
<html lang='en'>
	<head>
		<meta charset='utf-8'>
		<title>${title}</title>
		<link href='css/Grey and Blue.css' rel='stylesheet'>
		<meta name="theme-color" content="#3377FF">
		${(global.additionalHeadFields||[]).join('\t\t\n')}
	</head>
	<body>
		<a href='#content' id='skip-nav'>Skip navigation.</a>
		<div id='badge'><img alt='' src='${header.badge}'></div>
		<div id='icon-bar'>
			<a href='blog.html'><img alt='' src='images/icons/page.svg'><div>blog</div></a>
			<a href='gallery.html'><img alt='' src='images/icons/work.svg'><div>gallery</div></a>
			<a href='contact.html'><img alt='' src='images/icons/chat2.svg'><div>contact</div></a>
			<a href='rss.xml'><img alt='' src='images/icons/rss.svg'><div>rss</div></a>
		</div>
		<div id='content-holder'>
			<h1><img alt='${header.titleAlt}' src='${header.titleImg}'></h1>
			<a name='content'></a>
			<div id='content-pane'>
`