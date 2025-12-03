#!/bin/bash
# Checks if .env exists, if not copies example
env_created=0
if [ ! -f ./server/.env ]; then
  cp ./server/.env.example ./server/.env
  echo "⚠️ Created ./server/.env from example. Please fill in your keys!"
  env_created=1
fi
if [ ! -f ./client/.env ]; then
  cp ./client/.env.example ./client/.env
  echo "⚠️ Created ./client/.env from example. Please fill in your keys!"
  env_created=1
fi
if [ "$env_created" -eq 1 ]; then
  echo ""
  echo "Please edit the newly created .env files to add your keys, then re-run this script."
  exit 1
fi
make dev
