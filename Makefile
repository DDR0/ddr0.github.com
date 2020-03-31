#Turn off some implicit behaviour for simplicity.
.POSIX:
.SUFFIXES:
.SECONDARY:
.DEFAULT_GOAL := all


#Compile recipes for the HTML files.
DEFAULT_HTML_SOURCES = *.html.frag *.html.frag.js compile-template.node.js render-file.node.js
blog.html: blog.html.js $(DEFAULT_HTML_SOURCES)
	@./compile-template.node.js $< > $@
gallery.html: gallery.html.js $(DEFAULT_HTML_SOURCES)
	@./compile-template.node.js $< > $@
background-town.html: background-town.html.js $(DEFAULT_HTML_SOURCES)
	@./compile-template.node.js $< > $@
contact.html: contact.html.js $(DEFAULT_HTML_SOURCES)
	@./compile-template.node.js $< > $@

HTML_SRC = $(shell find ./ -name "*.html.js")
HTML_DEST = $(patsubst %.html.js,%.html,$(HTML_SRC))

BLOG_RAW_SRC = $(shell find "./blog-posts/" -name "*.html.frag")
BLOG_RAW_DEST = $(patsubst %.html.frag,%.html,$(BLOG_RAW_SRC))
BLOG_TMLP_SRC = $(shell find "./blog-posts/" -name "*.html.frag.js")
BLOG_TMLP_DEST = $(patsubst %.html.frag.js,%.html,$(BLOG_TMLP_SRC))
BLOG_DEPS = compile-blog.node.js blog-posts/single-post.html.template.js blog-posts/tags.html.template.js
BLOG_SRCS = $(BLOG_RAW_SRC) $(BLOG_TMLP_SRC) $(BLOG_DEPS)

#I can't figure out how to say "all these files are generated from all
#these files at once by this command". It seems to run it three times
#at least. https://www.gnu.org/software/make/manual/make.html#Multiple-Targets
#is of little help - it mentions grouped targets, which seems to be what we
#want here, but they don't have the effect we want although they do seem
#to have SOME effect in the right direction.
#$(BLOG_RAW_DEST) $(BLOG_TMLP_DEST) tags.html &: $(BLOG_RAW_SRC) $(BLOG_TMLP_SRC) compile-blog.node.js blog-posts/single-post.html.template.js blog-posts/tags.html.template.js 
tags.html &: $(BLOG_SRCS)
	./compile-blog.node.js

html: $(HTML_DEST) tags.html


#Compile recipes for the RSS XML files.
%.xml: %.xml.js compile-template.node.js render-file.node.js
	@./compile-template.node.js $< > $@

XML_SRC = $(shell find ./ -name "*.xml.js")
XML_DEST = $(patsubst %.xml.js,%.xml,$(XML_SRC))
xml: $(XML_DEST)


#Compile recipes for Background Town's coffeescript.
background-town/%.js: background-town/%.coffee
	coffee --map --compile $<

JS_SRC = $(shell find ./background-town/ -name "*.coffee")
JS_DEST = $(patsubst %.coffee,%.js,$(JS_SRC))
js: $(JS_DEST)


#Compile recipes for the LESS files.
css/%.css: css/%.less
	lessc --source-map --no-ie-compat --strict-math=on $< $@

CSS_SRC = $(shell find ./css/ -name "*.less")
CSS_DEST = $(patsubst %.less,%.css,$(CSS_SRC))
styles: $(CSS_DEST) #Can't be named "css" because that's a folder, and the folder is up to date. -_-


all: html xml js styles


#Remove all the built files, and the generated .map files from coffee and lessc.
clean:
	rm -f $(HTML_DEST) $(XML_DEST) $(JS_DEST) $(CSS_DEST) **/*.map


watch:
	+ echo "ls **/*.html.js **/*.less **/*.html.frag **/*.html.frag.js background-town/*.coffee" "$(BLOG_DEPS)" compile-template.node.js render-file.node.js \
	| zsh | tee /dev/tty | entr make



install-build-reqs:
	#graphvis for dot, for debugging, not strictly needed.
	sudo apt install nginx nodejs npm node-less coffeescript graphviz


install-deploy-reqs:
	ssh -t cac2 "apt install nginx nodejs"


debug:
	@echo "HTML src/dest"
	@echo $(HTML_SRC)
	@echo $(HTML_DEST)
	@echo
	@echo "HTML blog raw src/dest"
	@echo $(BLOG_RAW_SRC)
	@echo $(BLOG_RAW_DEST)
	@echo
	@echo "HTML blog template src/dest"
	@echo $(BLOG_TMLP_SRC)
	@echo $(BLOG_TMLP_DEST)
	@echo
	@echo "HTML blog all sources"
	@echo $(BLOG_SRCS)
	@echo
	@echo "XML src/dest"
	@echo $(XML_SRC)
	@echo $(XML_DEST)
	@echo
	@echo "CoffeeScript src/dest"
	@echo $(JS_SRC)
	@echo $(JS_DEST)
	@echo
	@echo "CoffeeScript src/dest"
	@echo $(CSS_SRC)
	@echo $(CSS_DEST)