FROM node:16.13.0

WORKDIR /usr/src/smart-brain

COPY ./ ./

RUN npm install

CMD ["/bin/bash"]