<!--
	published: 2016-11-21,
	tags: csp web-dev xss microblog,
	desc: Should a Content Security Policy be set on all website content?,
	title: Web Security\: Should CSP be set for my HTML files only\, or my HTML files and all my assets?,
-->
<p>Yes. "Some web framework automatically generate html on error pages and we found xss issues in those in the past, so setting <a href="https://developer.mozilla.org/en/docs/Web/Security/CSP">CSP</a> on everything is best." --ulfr from <a href="irc://irc.mozilla.org">Moznet</a></p>