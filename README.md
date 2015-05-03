This is the website of DDR. Contributions, changes, and so on are welcomed. The site can be found live ddr0.github.io.

Contributing:
The main site is generated using Less and Haml in place of the standard CSS and HTML. Before editing a html file, make sure there isn't a haml file next to it. When the site is compiled, the haml file will overwrite the html file. To compile the site, run {{{./compile.sh}}}. You can install less and haml via {{{npm install -g less}}} and {{{sudo gem install haml}}}.
