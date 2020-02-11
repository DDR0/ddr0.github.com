rsync --recursive --delete --links --inplace --times --itemize-changes \
	./ "cac2:/var/www/html/" \
	--exclude=".*"