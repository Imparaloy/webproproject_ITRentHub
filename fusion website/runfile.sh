#!/bin/bash

# แปลงไฟล์ให้ใช้ Line Ending ที่ถูกต้อง (LF)
sed -i $'s/\r$//' "$0"

# ให้สิทธิ์รันไฟล์ (ป้องกันปัญหา permission)
chmod +x "$0"

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
echo "Server is running on http://localhost:3000"
read -p "Press Enter to continue..."

echo "Process completed. Do you want to close the terminal? (y/n)"
read choice
if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
    exit
fi
