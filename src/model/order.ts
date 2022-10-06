import { 
	Prisma,
	PrismaClient,
	Order as OrderType,
} from '@prisma/client'
import {SessionOutput} from './session'
import {OrderLineOutput, OrderLineModel} from './orderLine'
import { ProductOutput } from './product'
import { UserModel } from './user'


export type OrderOutput = {
	id: string,
	email: string | null,
	phoneNumber: string | null,
	sessionId: string,
	userId: string | null,
	status: string,
	orderLines: OrderLineOutput[],
	totalPrice: number,
}

export type RequestBodyType = {
	email: string,
	phoneNumber: string,

}

export class OrderModel {
	constructor(private readonly prisma: PrismaClient) {}

	async convertOrderToOrderOutput(order: OrderType): Promise<OrderOutput>{
		const orderLineModel = new OrderLineModel(this.prisma)
		const orderLine = await this.prisma.orderLine.findMany({
			where: {
				orderId: order.id
			}
		})
		let orderLines: OrderLineOutput[] = []
		let totalPrice = 0
		for (const line of orderLine){
			const lineOutput = await orderLineModel.convertOrderLineToOrderLineOutput(line)
			totalPrice += lineOutput.totalPrice
			orderLines.push(lineOutput)
		}
		let result: OrderOutput = {
			id: order.id,
			email: order.email,
			phoneNumber: order.phoneNumber,
			sessionId: order.sessionId,
			userId: order.userId,
			status: order.status,
			orderLines: orderLines,
			totalPrice: totalPrice
		}
		return result
	}

	isOrderEditable(order: OrderOutput){
		return order.status == "DRAFT"
	}

	async getDraftOrder(session: SessionOutput): Promise<OrderOutput | null>{
		let order = await this.prisma.order.findFirst({
			where: {
				status: "DRAFT",
				sessionId: session.key
			}
		})
		if (!order){
			return null
		}
		let result = await this.convertOrderToOrderOutput(order)
		return result
	}

	async createDraftOrder(session: SessionOutput): Promise<OrderOutput>{
		type createValuesType = {
			sessionId: string,
			userId: string | null,
			email?: string | null,
			phoneNumber?: string | null,
		}
		const userModel = new UserModel(this.prisma)
		let createValues: createValuesType = {
			sessionId: session.key,
			userId: session.userId
		}
		if (session.userId){
			const user = await userModel.getById(session.userId)
			createValues.email = user.email
			createValues.phoneNumber = user.phoneNumber
		}
		const order = await this.prisma.order.create({
			data: createValues
		})
		return this.convertOrderToOrderOutput(order)
	}

	async getById(id: string): Promise<OrderOutput>{
		const order = await this.prisma.order.findUniqueOrThrow({
			where: {
				id: id
			}
		})
		const result = await this.convertOrderToOrderOutput(order)
		return result
	}

	async getOrCreateSessionsDraftOrder(session: SessionOutput): Promise<OrderOutput>{
		type createValuesType = {
			sessionId: string,
			userId: string | null,
			email?: string | null,
			phoneNumber?: string | null,
		}

		const userModel = new UserModel(this.prisma)
		const orderOutput = await this.getDraftOrder(session)
		if (orderOutput){
			return orderOutput
		}
		const orderOuput = await this.createDraftOrder(session)
		return orderOuput
	}

	async findMany(args: Prisma.OrderFindManyArgs): Promise<OrderOutput[]>{
		const orders = await this.prisma.order.findMany(args)
		let result: OrderOutput[] = []
		for (const order of orders){
			result.push(
				await this.convertOrderToOrderOutput(order)
			)
		}
		return result
	}

	isOrderEmpty(order: OrderOutput){
		return order.orderLines.length === 0
	}

	async updateOrderProductQuantity(
		session: SessionOutput,
		order: OrderOutput,
		product: ProductOutput,
		quantityInterval: number
	): Promise<OrderOutput>{
		const orderLineModel = new OrderLineModel(this.prisma)
		const line = await orderLineModel.getOrCreateOrderLine(order.id, product)

		// updating quantity
		const newQuantity = line.quantity + quantityInterval
		const shouldRemoveOrderLine = newQuantity < 1
		if (shouldRemoveOrderLine){
			await this.prisma.orderLine.delete({
				where: {
					id: line.id
				}
			})
		} else {		
			await this.prisma.orderLine.update({
				where: {
					id: line.id
				},
				data: {
					quantity: newQuantity,
				}
			})
		}
		const updatedOrder = await this.getOrCreateSessionsDraftOrder(session)
		return updatedOrder
	}

	async confirmOrder(orderId: string, requestBody: RequestBodyType | null=null): Promise<OrderOutput>{

		await this.prisma.order.update({
			where: {
				id: orderId
			},
			data: {
				status: "CONFIRMED",
				...requestBody
			}
		})
		let result = this.getById(orderId)
		return result
	}
}