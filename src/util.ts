import dotenv from 'dotenv';
import { sha256 } from 'js-sha256';
import { Request, Response} from 'express';
import { Order, PrismaClient, Session, User } from '@prisma/client';
import { OrderUpdateRequestType } from './interface';

const env = dotenv.config()

function getSeceretKey(){
	return env.parsed?.SECRECT_KEY
}

export function secretKeyIsSet(){
	return Boolean(getSeceretKey())
}

export function encryptPassword(raw_password: string){
	const secret_key = getSeceretKey()
	const hashedPassword = sha256(raw_password + secret_key)
	return hashedPassword
}

export async function getUsreById(userId: string){
	const prisma = new PrismaClient()
	const user = await prisma.user.findUnique({
		where: {
			id: userId
		}
	})
	prisma.$disconnect()
	return user
}

export async function getUsreByEmail(userEmail: string){
	const prisma = new PrismaClient()
	const user = await prisma.user.findUnique({
		where: {
			email: userEmail
		}
	})
	prisma.$disconnect()
	return user
}

export function checkPassword(user: User, rawPassword: string){
	const encryptedPassword = encryptPassword(rawPassword)
	return user.password == encryptedPassword
}

export async function getSessionFromHeader(req: Request) {
	const prisma = new PrismaClient();
	const session_id = req.headers.session_id as string || ""
	const result = await prisma.session.findUnique({
		where: {
			id: session_id
		}
	})
	prisma.$disconnect()
	return result
	
}

export async function getSessionFromHeaderOrThrow(req: Request, res: Response){
	let session = await getSessionFromHeader(req)
	if (!session){
		res.status(401)
		res.json({
			message: "Authentication Failed"
		})
	}
	return session
}

export async function getOrCreateDraftOrder(sessionId: string){
	const prisma = new PrismaClient();
	const order = await prisma.order.findFirst({
		where: {
			status: "DRAFT",
			sessionId: sessionId
		}
	})
	if (order){
		return order
	}
	const newOrder = await prisma.order.create({
		data: {
			sessionId: sessionId
		}
	})
	prisma.$disconnect()
	return newOrder
}

function updateOrderTotalPrice(){

}

export async function updateOrder(draftOrder: Order, orderUpdateRequest: OrderUpdateRequestType){
	const prisma = new PrismaClient();
	// fetching order line
	let orderLine = await prisma.orderLine.findFirst({
		where: {
			orderId: draftOrder.id,
			productId: orderUpdateRequest.product.id
		}
	})
	if (!orderLine){
		orderLine = await prisma.orderLine.create({
			data: {
				orderId: draftOrder.id,
				productId: orderUpdateRequest.product.id,
				quantity: 0,
				unitPrice: orderUpdateRequest.product.unitPrice,
				totalPrice: 0
			  
			}
		})
	}

	// updating quantity
	const newQuantity = orderLine.quantity + orderUpdateRequest.quantityToUpdate
	const toRemoveOrderLine = newQuantity < 1
	if (toRemoveOrderLine){
		await prisma.orderLine.delete({
			where: {
				id: orderLine.id
			}
		})
	} else {		
		await prisma.orderLine.update({
			where: {
				id: orderLine.id
			},
			data: {
				quantity: newQuantity,
				totalPrice: newQuantity * orderLine.unitPrice 
			}
		})
	}

	// updating order total price
	
}

export async function userIsAuthenticated(req: Request){
	const session = await getSessionFromHeader(req)
	return Boolean(session?.userId)
}

export async function linkSessionToUser(user: User, session: Session){
	const prisma = new PrismaClient();
	await prisma.session.update({
		where: {
			id: session.id
		},
		data: {
			userId: user.id
		}
	})
	// updating all orders created from this session and not assigend to user to be linked with the given user
	await prisma.order.updateMany({
		where: {
			sessionId: session.id,
			userId: null
		},
		data: {
			userId: user.id
		}
	})
	prisma.$disconnect()
}