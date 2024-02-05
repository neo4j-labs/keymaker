FROM node:14

ARG MAX_OLD_SPACE_SIZE=1024
ENV NODE_OPTIONS=--max-old-space-size=${MAX_OLD_SPACE_SIZE}

RUN mkdir -p /app
WORKDIR /app
COPY . ./
RUN npm install
RUN npm run build

EXPOSE 4001

CMD ["npm", "run", "serve"]