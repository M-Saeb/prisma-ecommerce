import { Prisma, PrismaClient } from '@prisma/client';
import express from 'express';
import { sha256 } from 'js-sha256';
import {
	updateOrder,
	encryptPassword,
	secretKeyIsSet,
	checkPassword,
	getUsreById,
	linkSessionToUser,
	getOrCreateDraftOrder,
	getSessionFromHeader,
	getSessionFromHeaderOrThrow,
	getUsreByEmail
} from './util'
import {
	userInfoRepsponse,
	OrderUpdateRequestType
} from './interface'

const prisma = new PrismaClient()
const app = express()
app.use(express.json())

// session_id => 1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3 (user_id: fffa964d-484a-4ab1-8ffe-66c15f3e348c)
// session_id => 72fd6a12-d59e-446a-998c-1217a65fbdcc

app.post("/session", async(req, res) => {
	const result = await prisma.session.create({data: {}})
	res.send(result.id)
})

app.get("/info", async(req, res) => {
	const session = await getSessionFromHeader(req)
	if (!session){
		res.status(404)
		res.send(null)
		return
	}
	let result: userInfoRepsponse = {
		email: null,
		firstName: null,
		lastName: null
	}
	if (session.userId){
		const user = await getUsreById(session.userId)
		if (user){
			result.email = user.email
			result.firstName = user.firstName
			result.lastName = user.lastName
		}
	}

	res.json(result)
})

// TODO: test this enpoint
app.post("/register", async(req, res) => {
	const session = await getSessionFromHeaderOrThrow(req, res)
	if (!session){
		return
	}
	const {email, password, firstName, lastName} = req.body
	if (!email || !password || !firstName || !lastName){
		res.status(400)
		res.json({
			"message": "required fields were not sent"
		})
		return
	}
	const encrypted_password = encryptPassword(password)
	const user = await prisma.user.create({
		data: {
			email: email,
			password: encrypted_password,
			firstName: firstName,
			lastName: lastName
		}
	})
	linkSessionToUser(user, session)
	let result: userInfoRepsponse = {
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName
	}
	res.status(201)
	res.json(result)
})

// TODO: test this enpoint
app.post("/login", async(req, res) => {
	const session = await getSessionFromHeaderOrThrow(req, res)
	if (!session){
		return
	}
	const {email, password} = req.body
	if (!email || !password ){
		res.status(400)
		res.json({
			"message": "required fields were not sent"
		})
		return
	}
	const user = await getUsreByEmail(email)
	if (!user){
		res.status(401)
		res.json({
			"message": "Email or password is not correct"
		})
		return
	}
	const passwrodIsCorrect = checkPassword(user, password)
	if (!passwrodIsCorrect){
		res.status(401)
		res.json({
			"message": "Email or password is not correct"
		})
		return
	}

	linkSessionToUser(user, session)
	let result: userInfoRepsponse = {
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName
	}
	res.json(result)
})

app.get("/order", async(req, res) => {
	const requestedOrderId = req.query.id as string
	const requestedOrderStatus = req.query.status as Prisma.EnumOrderStatusFilter
	const orders = await prisma.order.findMany({
		where: {
			id: requestedOrderId,
			status: requestedOrderStatus
		}
	})
	res.json(orders)
})

app.post("/basket/update", async(req, res) => {
	const session = await getSessionFromHeader(req)
	if (!session){
		res.status(404)
		res.send(null)
		return
	}

	const {productId, amount} = req.body
	if (!productId || !amount ){
		res.status(400)
		res.json({
			"message": "required fields were not sent"
		})
		return
	}

	const orderUpdateRequest: OrderUpdateRequestType = {
		product: productId,
		quantityToUpdate: amount
	}
	const draftOrder = await getOrCreateDraftOrder(session.id)
	await updateOrder(draftOrder, orderUpdateRequest)

})

const server = app.listen(3000, () => {
		if (!secretKeyIsSet()){
			throw "The variable 'SECRECT_KEY' is not set in the .env file, please set its value and run 'npm run server' again"
		}

		console.log(`
		🚀 Server ready at: http://localhost:3000
		⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api
		`)
	}
)