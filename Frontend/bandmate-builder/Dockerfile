FROM node:lts
# Set working directory
WORKDIR /Frontend/bandmate-builder


# install node modules
COPY ./package*.json ./

RUN npm install


# Copy all files from current directory to working dir in image
COPY . .

EXPOSE 3000

ENV HOST 0.0.0.0


CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
