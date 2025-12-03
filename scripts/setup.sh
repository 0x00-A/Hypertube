#!/bin/bash
# Checks if .env exists, if not copies example
if [ ! -f ./server/.env ]; then
  cp ./server/.env.example ./server/.env
  echo "⚠️ Created ./server/.env from example. Please fill in your keys!"
fi
if [ ! -f ./client/.env ]; then
  cp ./client/.env.example ./client/.env
  echo "⚠️ Created ./client/.env from example. Please fill in your keys!"
fi
make dev
