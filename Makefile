#Turn off some implicit behaviour for simplicity.
.POSIX:
.SUFFIXES:
.SECONDARY:
.DEFAULT_GOAL := html


#Compile recipes for the HTML files.
DEFAULT_HTML_SOURCES = *.html.frag *.html.frag.js compile.node.js
blog.html: blog.html.js ./Blog\ Posts/*.html $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@
gallery.html: gallery.html.js $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@
contact.html: contact.html.js $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@

HTML_SRC = $(shell find ./ -name "*.html.js")
HTML_DEST = $(patsubst %.html.js,%.html,$(HTML_SRC))
html: $(HTML_DEST)


#Remove all the built files.
clean:
	rm -f $(HTML_DEST)