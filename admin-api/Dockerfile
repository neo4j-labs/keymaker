FROM node:22.23.4

RUN mkdir -p /app
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "serve"]