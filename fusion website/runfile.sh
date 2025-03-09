#!/bin/bash

chmod +x runfile.sh

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing node_modules..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error installing node_modules. Please check the console for details."
        read -p "Press Enter to continue..."
        exit 1
    fi
else
    echo "node_modules already exists. Skipping installation..."
fi

# Start the app
npm start
if [ $? -ne 0 ]; then
    echo "Error starting the app. Please check the console for details."
    read -p "Press Enter to continue..."
    exit 1
fi

echo "App started successfully."
read -p "Press Enter to continue..."