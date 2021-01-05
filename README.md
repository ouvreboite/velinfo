# velinfo
A serveless application to detect locked Velib stations (Paris' bicycle sharing system)

## Build and deploy 
Backend
``` 
npm run build
sam deploy
``` 
Frontend
```
cd frontend
ng build --prod
aws s3 cp dist/velinfo s3://velinfo-frontend --recursive
```