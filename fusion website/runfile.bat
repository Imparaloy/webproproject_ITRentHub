@echo off

:: Check if node_modules exists
IF NOT EXIST node_modules (
  echo Installing node_modules...
  call npm install
  IF %ERRORLEVEL% NEQ 0 (
    echo Error installing node_modules. Please check the console for details.
    pause
    exit /b 1
  )
) ELSE (
  echo node_modules already exists. Skipping installation...
)

:: Start the app
npm start
IF %ERRORLEVEL% NEQ 0 (
  echo Error starting the app. Please check the console for details.
  pause
  exit /b 1
)

echo App started successfully.
pause