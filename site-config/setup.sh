#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

REMOTE=bb

#First, update DNS if needed. We will need it for certs, but we can use ip for everything else.
#(Also make sure the packages and everything are up to date.)

#after ssh-copy-id «target», run on target:
ssh $REMOTE << UPDATE
	sudo su -
	# pkcon update
	# pkcon refresh
	# pkcon install ufw nginx nodejs rsync vim snapd curl -y
	apt update
	apt install ufw nginx nodejs rsync vim snapd curl --yes
UPDATE

echo -en "Ensure the server's \`node --version\` returns 10.12 or so. Update system if not.\nNode version: "
ssh $REMOTE <<< "node --version"
read -p "Press enter to continue."

#While that's happening, sort out ipv6. If available.
#	- Probably something like adding the following to /etc/network/interfaces
#		iface ens160 inet6 static
#		address 2607:8880::A000:25D5
#		gateway 2607:8880::A000:2501
#		netmask 120


#on remote as root, let rsync deploy. (We can't run rsync as root or with sudo, neither works.)
ssh $REMOTE << INITIALIZE_FILES
	sudo su -
	mkdir /etc/nginx/site-fragments
	chown ddr:root /etc/nginx/site-fragments
	mkdir /opt/ddr0.ca
	chown ddr:root /opt/ddr0.ca
	mkdir /var/www/ddr0.ca
	chown ddr:root /var/www/ddr0.ca
	cd /lib/systemd/system/
	touch dice.service dice2.service dice3.service
	chown ddr:root dice.service dice2.service dice3.service
INITIALIZE_FILES

echo "Ensure \$REMOTE is set to $REMOTE in deploy.sh."
read -p "Press enter to continue."
./deploy.sh &

ssh $REMOTE <<< "sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/ddr0.ca"
cat << NOTES
Manual Action Needed
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
On the server, edit /etc/nginx/sites-available/ddr0.ca
	- add in the \`include /etc/nginx/site-fragments/ddr0;\` line from ~/site-config/ddr0
	- Remove the unused stuff in the file, but fill in server_name and leave
	  the root directive and listens.
	- Set the root directive to /var/www/ddr0.ca

Press enter to continue.
NOTES
read
wait

ssh $REMOTE << ENABLE_EVERYTHING
	sudo su -
	systemctl enable dice3.service
	systemctl start dice3.service
	rm /etc/nginx/sites-enabled/default
	ln -s /etc/nginx/sites-available/ddr0.ca /etc/nginx/sites-enabled/ddr0.ca
	service nginx reload
ENABLE_EVERYTHING

echo "do the rest manually"
exit 0

#only after site name is defined in the above,
#follow https://certbot.eff.org/lets-encrypt to get https
ssh $REMOTE << HTTPS
	sudo su -
	#Will this work? Do we need to run this manually for stdin?
	if ! type -f certbot; then
		snap install core; snap refresh core
		snap install --classic certbot
		ln -s /snap/bin/certbot /usr/bin/certbot
	fi
	certbot --nginx --domains ddr0.ca
HTTPS

cat << NOTES
Manual Action Needed
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
Add \`http2` to the lines specifying to listen on port 443 to /etc/nginx/sites-available/ddr0.ca

Press enter to continue.
NOTES
read
echo "All done!"
xdg-open "https://ddr0.ca"