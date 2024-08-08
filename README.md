dev tips

### mongodb

docker run --name mongodb-marslife -p 27017:27017 -d mongo --replSet=rs0
mongodb://localhost:27017/?directConnection=true

docker exec -it mongodb-marslife /bin/bash

mongosh
rs.initiate()
rs.status()

### primsa

npx prisma init  
npx prisma generate

npx prisma db push
npx prisma studio

### next-auth

### tailwind

### shadcn-ui

npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label
