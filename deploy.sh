rsync --recursive --links --times --itemize-changes \
	./ "cac2:/var/www/html/" \
	--exclude=".*" \
	--exclude="site-config" \
	--exclude="*.node.js" \
	--exclude="node_modules" \
	&

rsync --recursive --links --times --itemize-changes \
	site-config/ddr0 cac2:/etc/nginx/default/ddr0 \
	&

rsync --recursive --links --times --itemize-changes \
	site-config/dice.service cac2:/lib/systemd/system/ \
	&

rsync --recursive --links --times --itemize-changes \
	site-config/dice2.service cac2:/lib/systemd/system/ \
	&

rsync --recursive --links --times --itemize-changes \
	⚀/dice.node.js cac2:/opt/ddr0.ca/⚀/ \
	&

rsync --recursive --links --times --itemize-changes \
	⚁/dice.node.js cac2:/opt/ddr0.ca/⚁/ \
	&

rsync --recursive --links --times --itemize-changes \
	node_modules cac2:/opt/ddr0.ca/ \
	&

wait