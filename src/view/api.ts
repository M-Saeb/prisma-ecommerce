import { Prisma, PrismaClient } from '@prisma/client';
import express, { Request, Response } from 'express';
import {secretKeyIsSet} from '../util'
import {SessionModel, SessionOutput} from '../model/session'
import {UserModel} from '../model/user'
import {OrderModel, RequestBodyType} from '../model/order'
import {ProductModel} from '../model/product'


const prisma = new PrismaClient()
const sessionModel = new SessionModel(prisma)
const userModel = new UserModel(prisma)
const orderModel = new OrderModel(prisma)
const productModel = new ProductModel(prisma)

const app = express()
app.use(express.json())

async function getSessionOrRepond(req: Request, res: Response): Promise<SessionOutput | null>{
	const session = await sessionModel.getSessionFromHeader(req)
	if (!session){
		res.status(401)
		res.json({
			"message": "require session authentication"
		})
		return null
	}
	return session
}

app.post("/session", async(req, res) => {
	const newSession = await sessionModel.create()
	res.json(newSession)
})

app.get("/info", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
		return
	}
	res.json(session)
})

// TODO: test this enpoint
app.post("/register", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
		return
	}
	const {email, password, phoneNumber, firstName, lastName} = req.body
	if (!email || !password || !phoneNumber || !firstName || !lastName){
		res.status(400)
		res.json({
			"message": "required fields were not sent"
		})
		return
	}
	const user = await userModel.register(
		email,
		password,
		phoneNumber,
		firstName,
		lastName
	)
	sessionModel.linkSessionToUser(session, user)
	res.json(user)
})

// TODO: test this enpoint
app.post("/login", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
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
	const user = await userModel.logIn(email, password)
	if (!user){
		res.status(401)
		res.json({
			"message": "Email or password is not correct"
		})
		return
	}
	sessionModel.linkSessionToUser(session, user)
	res.json(session)
})

app.get("/order", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
		return
	}
	const requestedOrderId = req.query.id as string
	const requestedOrderStatus = req.query.status as Prisma.EnumOrderStatusFilter
	const orders = await orderModel.findMany({
		where: {
			id: requestedOrderId,
			status: requestedOrderStatus
		}
	})
	res.json(orders)
})

app.get("/order/basket", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
		return
	}
	const draftOrder = await orderModel.getOrCreateSessionsDraftOrder(session)
	res.json(draftOrder)
})

app.post("/order/basket/update", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
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
	const draftOrder = await orderModel.getOrCreateSessionsDraftOrder(session)
	const product = await productModel.getById(productId)
	const updatedDraftOrder = await orderModel.updateOrderProductQuantity(
		session,
		draftOrder,
		product,
		amount,
	)
	res.json(updatedDraftOrder)
})

app.post("/order/basket/confirm", async(req, res) => {
	const session = await getSessionOrRepond(req, res)
	if (!session){
		return
	}
	const {email, phoneNumber} = req.body
	if (!email || !phoneNumber ){
		res.status(400)
		res.json({
			"message": "required fields were not sent"
		})
		return
	}
	const draftOrder = await orderModel.getDraftOrder(session)
	if (!draftOrder){
		res.status(404)
		res.json({
			"message": "basket is not found"
		})
		return
	}
	if ( orderModel.isOrderEmpty(draftOrder) ){
		res.status(401)
		res.json({
			"message": "basket is empty"
		})
		return
	}
	let result
	if (draftOrder.phoneNumber && draftOrder.email){
		result = await orderModel.confirmOrder( draftOrder.id)
	} else {
		const requestBody: RequestBodyType = {
			email: email,
			phoneNumber: phoneNumber,		
		}
		result = await orderModel.confirmOrder(draftOrder.id, requestBody)
	}
	res.json(result)
})

export const ApiSserver = app.listen(3000, () => {
		if (!secretKeyIsSet()){
			throw "The variable 'SECRECT_KEY' is not set in the .env file, please set its value and run 'npm run server' again\n The value of SECRECT_KEY can be any random string"
		}

		console.log(`
		🚀 Server ready at: http://localhost:3000
		⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api
		`)
	}
)