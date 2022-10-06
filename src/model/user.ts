import { sha256 } from 'js-sha256';
import { getSeceretKey } from "../util";
import { 
	PrismaClient,
	User as UserType
} from '@prisma/client'

export type UserOutput = {
	id: string,
	email: string,
	phoneNumber: string,
	firstName: string | null,
	lastName: string | null
}

export class UserModel {
	constructor(private readonly prisma: PrismaClient) {}

	convertUserToUserOutput(user: UserType): UserOutput{
		const result: UserOutput = {
			id: user.id,
			email: user.email,
			phoneNumber: user.phoneNumber,
			firstName: user.firstName,
			lastName: user.lastName
		}
		return result
	}

	async register(
		email: string,
		password: string,
		phoneNumber: string,
		firstName: string | null = null,
		lastName: string | null = null
	): Promise<UserOutput>{
		let encryptedPassword = this.encryptPassword(password)
		let user = await this.prisma.user.create({
			data: {
				email: email,
				password: encryptedPassword,
				phoneNumber: phoneNumber,
				firstName: firstName,
				lastName: lastName
			}
		})
		let result = this.convertUserToUserOutput(user)
		await this.linkOrdersToUser(result)
		return result
	}

	encryptPassword(raw_password: string){
		const secret_key = getSeceretKey()
		const hashedPassword = sha256(raw_password + secret_key)
		return hashedPassword
	}

	checkPassword(user: UserType, rawPassword: string){
		const encryptedPassword = this.encryptPassword(rawPassword)
		return user.password == encryptedPassword
	}

	async logIn(email: string, password: string): Promise<UserOutput | null>{
		const user = await this.prisma.user.findUnique({
			where: {
				email: email
			}
		})
		if (!user){
			return null
		}
		const passwordIsCorrect = this.checkPassword(user, password)
		if (!passwordIsCorrect){
			return null
		}
		return this.convertUserToUserOutput(user)
	}

	async getById(id: string): Promise<UserOutput>{
		let user = await this.prisma.user.findUniqueOrThrow({
			where: {
				id: id
			}
		})
		let result = this.convertUserToUserOutput(user)
		return result
	}

	async linkOrdersToUser(user: UserOutput){
		await this.prisma.order.updateMany({
			where: {
				email: user.email,
				userId: null,
			},
			data: {
				userId: user.id,
			}
		})
	}
}