import { 
	PrismaClient,
	OrderLine as OrderLineType
} from '@prisma/client'
import {ProductOutput, ProductModel} from "./product"

export type OrderLineOutput = {
	id: string,
	product: ProductOutput,
	unitPrice: number,
	quantity: number,
	totalPrice: number
}


export class OrderLineModel {
	constructor(private readonly prisma: PrismaClient) {}

	async convertOrderLineToOrderLineOutput(orderLine: OrderLineType){
		const productModel = new ProductModel(this.prisma)

		const product = await productModel.getById(orderLine.productId)
		let result: OrderLineOutput = {
			id: orderLine.id,
			product: product,
			quantity: orderLine.quantity,
			unitPrice: orderLine.unitPrice,
			totalPrice: orderLine.unitPrice * orderLine.quantity
		}
		return result
	}

	async getOrCreateOrderLine(orderId: string, product: ProductOutput): Promise<OrderLineOutput>{
		let orderLine = await this.prisma.orderLine.findFirst({
			where: {
				orderId: orderId,
				productId: product.id
			}
		})
		if (!orderLine){
			orderLine = await this.prisma.orderLine.create({
				data: {
					orderId: orderId,
					productId: product.id,
					quantity: 0,
					unitPrice: product.unitPrice,
				}
			})
		}
		const result = this.convertOrderLineToOrderLineOutput(orderLine)
		return result
	}

	async getById(id: string): Promise<OrderLineOutput>{
		const orderLine = await this.prisma.orderLine.findUniqueOrThrow({
			where: {
				id: id
			}
		})
		const result = await this.convertOrderLineToOrderLineOutput(orderLine)
		return result
	}
}