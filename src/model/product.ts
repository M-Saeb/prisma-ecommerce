import { 
	PrismaClient,
	Product as ProductType
} from '@prisma/client'

export type ProductOutput = {
	id: string,
	name: string,
	unitPrice: number
}

export class ProductModel {
	constructor(private readonly prisma: PrismaClient) {}

	convertProductToProductOutput(product: ProductType){
		let result: ProductOutput = {
			id: product.id,
			name: product.name,
			unitPrice: product.unitPrice
		}
	}

	async getById(id: string): Promise<ProductOutput>{
		const product = await this.prisma.product.findUniqueOrThrow({
			where: {
				id: id
			}
		})
		return product
	}
}