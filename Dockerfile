FROM node:4.2.0

ENV HOME=/home/app/

COPY package.json $HOME/harvesterjs/

COPY npm-shrinkwrap.json $HOME/harvesterjs/

WORKDIR $HOME/harvesterjs/

RUN npm install --progress=false

COPY . $HOME/harvesterjs/

CMD ["npm", "test"]
