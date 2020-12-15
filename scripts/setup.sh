#!/bin/bash

#First, update DNS if needed. We will need it for certs, but we can use ip for everything else.

#after ssh-copy-id «target», run on target:
apt update
apt install ufw nginx nodejs rsync vim snapd curl --yes
mkdir /etc/nginx/site-fragments
mkdir /opt/ddr0.ca

#Ensure node --version returns 12 or so. Update system if not.

#While that's happening, sort out ipv6.
#	- Probably something like adding the following to /etc/network/interfaces
#		iface ens160 inet6 static
#		address 2607:8880::A000:25D5
#		gateway 2607:8880::A000:2501
#		netmask 120

#follow https://certbot.eff.org/lets-encrypt to get https
	snap install core; snap refresh core
	snap install --classic certbot
	ln -s /snap/bin/certbot /usr/bin/certbot
	certbot --nginx
	

#then run deploy.sh locally &
#on the server, edit /etc/nginx/sites-available/default
#	- add in the `include /etc/nginx/site-fragments/ddr0;` line from ~/site-config/ddr0
#	- Remove the unused stuff in the file, but fill in server_name and leave
#     the root directive and listens.
service nginx reload

systemctl enable dice.service
systemctl enable dice2.service
systemctl enable dice3.service
systemctl start dice.service
systemctl start dice2.service
systemctl start dice3.service