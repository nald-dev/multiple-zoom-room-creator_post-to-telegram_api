import * as dotenv from 'dotenv'
import * as cors from 'cors'

dotenv.config()

import * as express from 'express'
import * as formidable from 'express-formidable'

import db from './query-functions'

const app = express()
const port = process.env['PORT']

app.use(formidable())
app.use(cors())

app.get('/', (request, response) => response.status(200).send({
    info: `API | Express & PostgreSQL API using TypeScript`
}))

app.post('/create-rooms', db.createRooms)

app.listen(port, () => console.log(`App running on port ${port}.`))