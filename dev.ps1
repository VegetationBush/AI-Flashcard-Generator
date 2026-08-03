Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; sam local start-api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"