# velinfo
A serveless application to detect locked Velib stations (Paris' bicycle sharing system).
Hosted on AWS Serveless and visible at www.velinfo.fr

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
aws s3 rm s3://velinfo-frontend --recursive
aws s3 cp dist/velinfo s3://velinfo-frontend --recursive --cache-control max-age=31536000
```