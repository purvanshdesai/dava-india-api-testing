#!/bin/bash

set -e

export NVM_DIR="$HOME/.nvm"

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

systemctl stop start-services

cd /home/pm2user/dava-india-api

git pull origin production

AWS_SECRET_ID="davaindia-production-json"
AWS_REGION="ap-south-1"
ENVFILE="/home/pm2user/dava-india-api/config/production.json"

aws secretsmanager get-secret-value --secret-id $AWS_SECRET_ID --region $AWS_REGION --query 'SecretString' --output text > $ENVFILE


yarn

yarn compile

pm2 restart davaindia-api




cd /home/pm2user/dava-india-admin

git pull origin production

AWS_SECRET_ID="davaindia-admin-env-local"
AWS_REGION="ap-south-1"
ENVFILE="/home/pm2user/dava-india-admin/.env.local"

aws secretsmanager get-secret-value --secret-id $AWS_SECRET_ID --region $AWS_REGION --query 'SecretString' --output text > $ENVFILE

yarn

yarn build

pm2 restart dava-admin



cd /home/pm2user/dava-india-client

git pull origin production

AWS_SECRET_ID="davaindia-client-env-local"
AWS_REGION="ap-south-1"
ENVFILE="/home/pm2user/dava-india-client/.env.local"

aws secretsmanager get-secret-value --secret-id $AWS_SECRET_ID --region $AWS_REGION --query 'SecretString' --output text > $ENVFILE

yarn

yarn build

pm2 restart dava-client




cd /home/pm2user/davaindia-website-mobile

git pull origin production

AWS_SECRET_ID="davaindia-client-env-local"
AWS_REGION="ap-south-1"
ENVFILE="/home/pm2user/davaindia-website-mobile/.env.local"

aws secretsmanager get-secret-value --secret-id $AWS_SECRET_ID --region $AWS_REGION --query 'SecretString' --output text > $ENVFILE

yarn

yarn build

pm2 restart dava-client-mobile-web

pm2 save
