#!/bin/bash
#Bash script to compile ddr0.github.com.

#Config Vars:
blog_post_directory="Blog Posts"
style_directory="css"


#script
#set -e #-e prevents us from handling errors, too.
set -u

IFS='
' #Makes for in loop work on newlines and not, say, escaped spaces.

bold=`tput bold`
norm=`tput sgr0`
red="\e[00;31m"
green="\e[00;32m"

echo "Compiling ${PWD##*/}:"

function render {
	echo -n "  ${bold}$[$(grep --only-matching \n <<< $2 | wc -l)+1]${norm} $3"

	for target_name in $2
	do
		dest_name=$(echo $target_name |sed 's/.\{5\}$//')
		compile_results=$($1 "$target_name" "$dest_name" 2>&1 >/dev/null)
		if [[ $compile_results ]]; then
			echo -e " ${red}✘${norm}\n\n${bold}$target_name${norm}:\n$compile_results\n"
			exit 1;
		fi
	done
	echo -e " ${green}✔${norm}"
}

#===Blog Posts===
#Compile blog posts first, because the .html is needed to compile the blog.
render haml "$(find $blog_post_directory/*.haml)" "blog posts"


#===Other Pages===
#Now that we've got the blog fragments rendered, we can compile the main site.
render haml "$(find *.haml)" "pages"


#===CSS===
render lessc "$(find $style_directory/*.less)" "styles"


exit 0;