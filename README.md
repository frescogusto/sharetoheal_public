# share to heal

this is the share to heal repo.
below you can find the information to install and run the project
a version of this is currently running at [https://sharetoheal.herokuapp.com](https://sharetoheal.herokuapp.com)

## setup
- create a mongodb database. we recommend using cloud hosted mongodb atlas [https://docs.atlas.mongodb.com/getting-started/](https://docs.atlas.mongodb.com/getting-started/)
- get the connection string to your database [https://docs.mongodb.com/guides/cloud/connectionstring/](https://docs.mongodb.com/guides/cloud/connectionstring/)
- clone the repo
- create a .env file in the root of the project with the following content:
    ``` MONGO_URL=connection_string ``` replace "connection_string" with the connection string you had from step 2
- run ``` npm i ```
- run ``` npm start ```

