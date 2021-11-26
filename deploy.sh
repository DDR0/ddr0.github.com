#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

REMOTE=bb

rsync --recursive --links --times --itemize-changes \
	./                    $REMOTE:/var/www/ddr0.ca/ \
	--exclude=".*" \
	--exclude="site-config" \
	--exclude="*.node.js" \
	--exclude="node_modules" \
	&

rsync --recursive --links --times --itemize-changes \
	site-config/ddr0      $REMOTE:/etc/nginx/site-fragments/ddr0 \
	&

#The system folder isn't writable, can't create temp files so --inplace.
rsync --recursive --links --times --itemize-changes \
	--inplace \
	site-config/*.service $REMOTE:/lib/systemd/system/ \
	&

rsync --recursive --links --times --itemize-changes \
	⚀/dice.node.js        $REMOTE:/opt/ddr0.ca/⚀/ \
	&

rsync --recursive --links --times --itemize-changes \
	⚁/dice.node.js        $REMOTE:/opt/ddr0.ca/⚁/ \
	&

rsync --recursive --links --times --itemize-changes \
	⚂/dice.node.js        $REMOTE:/opt/ddr0.ca/⚂/ \
	&

rsync --recursive --links --times --itemize-changes \
	node_modules           $REMOTE:/opt/ddr0.ca/ \
	&

wait