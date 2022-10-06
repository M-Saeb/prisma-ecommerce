import { 
	PrismaClient,
	Session as SessionType,
} from '@prisma/client'
import {Request} from 'express'
import {UserOutput} from './user'

export type SessionOutput = {
	key: string,
	userId: string | null,
	email: string | null,
	firstName: string | null,
	lastName: string | null,
}

export class SessionModel {
	constructor(private readonly prisma: PrismaClient) {}

	async create(): Promise<SessionOutput>{
		const session = await this.prisma.session.create({
			data: {}
		})
		return {
			key: session.key,
			userId: null,
			email: null,
			firstName: null,
			lastName: null,
		}
	}

	async getSessionFromHeader(req: Request): Promise<SessionOutput | null> {
		const sessionKey = req.headers.session_id as string || ""
		const session = await this.prisma.session.findUnique({
			where: {
				key: sessionKey
			}
		})
		if(!session){
			return null
		}
		let result: SessionOutput = {
			key: session.key,
			userId: null,
			email: null,
			firstName: null,
			lastName: null,
		}
		if (session.userId){
			const user = await this.prisma.user.findFirstOrThrow({
				where: {
					id: session.userId
				}
			})
			result.userId = user.id
			result.email = user.email
			result.firstName = user.firstName
			result.lastName = user.lastName
		}
		return result
	}

	async userIsAuthenticated(session: SessionType){
		return Boolean(session?.userId)
	}

	async linkSessionToUser(session: SessionType | SessionOutput, user: UserOutput){
		this.prisma.session.update({
			where: {
				key: session.key
			},
			data: {
				userId: user.id
			}
		})
		this.prisma.order.updateMany({
			where: {
				sessionId: session.key,
				userId: null
			},
			data: {
				userId: user.id
			}
		})
	}
}