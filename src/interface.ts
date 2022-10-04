import { Product } from '@prisma/client';

export interface userInfoRepsponse{
	email: string | null;
	firstName: string | null;
	lastName: string | null;
}

export interface OrderUpdateRequestType{
	product: Product,
	quantityToUpdate: number
}