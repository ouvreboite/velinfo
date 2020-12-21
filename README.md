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
aws s3 cp frontend s3://velinfo-frontend --recursive
```