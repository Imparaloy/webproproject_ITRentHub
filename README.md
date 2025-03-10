# webproproject_ITRentHub
# Group-3-App

A project for running a Node.js application with simple setup instructions for both Windows and macOS/Linux.

## Installation & Running the Application

### For Windows
1. Extract the file `Group-3-App.zip`.
2. Run the application using one of the following methods:
   - Double-click `runfile.bat`.
   - Open Command Prompt and run:
     ```sh
     cd [Extracted Folder Path]
     start runfile.bat
     ```

### For macOS/Linux
1. Extract the file `Group-3-App.zip`.
2. Open Terminal and navigate to the extracted folder:
   ```sh
   cd [Extracted Folder Path]
   ```
3. Run the script:
   ```sh
   ./runfile.sh
   ```

## Troubleshooting
If you encounter permission errors on macOS/Linux, try:
```sh
chmod +x runfile.sh
./runfile.sh
```

If you see a `bad interpreter` error, convert line endings to LF:
```sh
sed -i $'s/\r$//' runfile.sh
```

## License
This project is licensed under the MIT License.
