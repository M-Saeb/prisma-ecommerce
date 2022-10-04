import { Prisma, PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid';
import express from 'express'

const prisma = new PrismaClient()
const app = express()
app.use(express.json())

app.post("/session", async(req, res) => {
	const result = await prisma.session.create({
		data: {
			"key": uuidv4()
		}
	})
	res.json(result)
	res.status(201)
})


const server = app.listen(3000, () =>
  	console.log(`
		🚀 Server ready at: http://localhost:3000
		⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api
	`),
)