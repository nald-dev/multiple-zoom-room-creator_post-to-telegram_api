import * as express from 'express'
import fetch from 'node-fetch'
import * as moment from 'moment'
import { Pool, PoolConfig } from 'pg'

type CustomPoolConfig = PoolConfig & { url: string }

const pool = new Pool({
  user: process.env['DB_USER'],
  host: process.env['DB_HOST'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  port: Number(process.env['DB_PORT']),
  url: process.env['DB_URL']
} as CustomPoolConfig)

function giveResponse(
  response: express.Response,
  status: 'success' | 'created' | 'bad_request' | 'not_found',
  data: any,
  info?: string
) {
  let statusCode: number

  if(status == 'success') {
    statusCode = 200
  } else if(status == 'created') {
    statusCode = 201
  } else if(status == 'bad_request') {
    statusCode = 400
  } else if(status == 'not_found') {
    statusCode = 404
  }

  response.status(statusCode!).json({
    status,
    info,
    data
  })
}

function createRooms(req: express.Request, res: express.Response) {
  type ItemType = {
    id: number,
    class_name: string,
    activity_name: string,
    password: number,
    telegram_student_group_chat_id: number
  }

  const data = req.fields.data as any as ItemType[]

  const results = Array(data.length).fill(null)

  for (const itemIndex in data) {
    fetch(
      'https://zoom.us/v2/users/me/meetings',
      {
          method: 'POST',
          headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: '' // FIXME: Fill with zoom authorization
          },
          body: JSON.stringify({
              "topic": data[Number(itemIndex)].class_name + ' | ' + data[Number(itemIndex)].activity_name,
              "type": 2,
              "start_time": req.fields.start_time,
              "duration": 120,
              "password": data[Number(itemIndex)].password
          })
      }
    )
    .then(resZoom => resZoom.json())
    .then(async(resZoomJSON) => {
      results[Number(itemIndex)] = {
        id: resZoomJSON.id,
        join_url: resZoomJSON.join_url,
        topic: resZoomJSON.topic,
        password: resZoomJSON.password,
        start_time: moment(new Date(resZoomJSON.start_time)).format('DD MMMM YYYY, HH:mm'),
        duration: resZoomJSON.duration
      }

      let isThereNullResult = false

      for (const result of results) {
        if (result == null) {
          isThereNullResult = true

          break
        }
      }

      if (!isThereNullResult) {
        let text = ''
  
        for (const resultIndex in results) {
          const result = results[Number(resultIndex)]
  
          text += `Topic: ${result.topic}\nTime: ${result.start_time} (${result.duration} mins)\n\nJoin Zoom Meeting\n${result.join_url}\n\nMeeting ID: ${result.id}\nPassword: ${result.password}`
  
          if (Number(resultIndex) != results.length - 1) {
            text += '\n\n---------------------------\n\n'
          }
        }
         
        const telegram_token = '' // FIXME: Fill with telegram token
        const chat_id = 0 // FIXME: Fill with telegram chat id

        await fetch(
          `https://api.telegram.org/bot${telegram_token}/sendMessage`,
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text,
              chat_id
            })
          }
        )

        giveResponse(res, 'created', {})
      }
    })
  }
}

export default {
  createRooms
}