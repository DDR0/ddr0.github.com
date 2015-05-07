#!/bin/bash
#Bash script to compile ddr0.github.com.

#Config Vars:
blog_post_directory="Blog Posts"
style_directory="css"
coffee_directory="background town"


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
	files=$(find $2)
	echo -n "  ${bold}$(find $2 | wc -l)${norm} $3" #Pipe results directly to wc, can't provide as arg to wc and can't echo to wc without loosing newlines.

	for target_name in $files
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
# rm $blog_post_directory/*.html #Removed because haml is inflexible.
render haml "$blog_post_directory/*.haml" "blog posts"


#===Other Pages===
#Now that we've got the blog fragments rendered, we can compile the main site.
render haml "*.haml" "pages"
cp blog.html index.html


#===CSS===
render lessc "$style_directory/*.less" "styles"


#===Script===
files=$(find $coffee_directory -name "*.coffee")
echo -n "  ${bold}$(find $coffee_directory -name "*.coffee" | wc -l)${norm} coffeescripts"

for target_name in $files
do
	compile_results=$(coffee -c -m "$target_name" 2>&1 >/dev/null)
	if [[ $compile_results ]]; then
		echo -e " ${red}✘${norm}\n\n${bold}$target_name${norm}:\n$compile_results\n"
		exit 1;
	fi
done
echo -e " ${green}✔${norm}"

exit 0;