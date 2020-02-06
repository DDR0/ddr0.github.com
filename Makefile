#Turn off some implicit behaviour for simplicity.
.POSIX:
.SUFFIXES:
.SECONDARY:
.DEFAULT_GOAL := all


#Compile recipes for the HTML files.
DEFAULT_HTML_SOURCES = *.html.frag *.html.frag.js compile.node.js
blog.html: blog.html.js ./Blog\ Posts/*.html $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@
gallery.html: gallery.html.js $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@
background-town.html: background-town.html.js $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@
contact.html: contact.html.js $(DEFAULT_HTML_SOURCES)
	@./compile.node.js $< > $@

HTML_SRC = $(shell find ./ -name "*.html.js")
HTML_DEST = $(patsubst %.html.js,%.html,$(HTML_SRC))
html: $(HTML_DEST)


#Compile recipes for the RSS XML files.
blog-rss-feed.xml: blog-rss-feed.xml.js compile.node.js
	@./compile.node.js $< > $@
gallery-rss-feed.xml: gallery-rss-feed.xml.js compile.node.js
	@./compile.node.js $< > $@

XML_SRC = $(shell find ./ -name "*.xml.js")
XML_DEST = $(patsubst %.xml.js,%.xml,$(XML_SRC))
xml: $(XML_DEST)


background-town/%.js: background-town/%.coffee
	coffee --map --compile $<

COFFEE_SRC = $(shell find ./background-town/ -name "*.coffee")
COFFEE_DEST = $(patsubst %.coffee,%.js,$(COFFEE_SRC))
coffee: $(COFFEE_DEST)


all: html xml coffee


#Remove all the built files.
clean:
	rm -f $(HTML_DEST) $(XML_DEST)


install-build-reqs:
	sudo apt install nodejs npm node-less coffeescript


debug:
	@echo "HTML src/dest"
	@echo $(HTML_SRC)
	@echo $(HTML_DEST)
	@echo
	@echo "XML src/dest"
	@echo $(XML_SRC)
	@echo $(XML_DEST)
	@echo
	@echo "CoffeeScript src/dest"
	@echo $(COFFEE_SRC)
	@echo $(COFFEE_DEST)