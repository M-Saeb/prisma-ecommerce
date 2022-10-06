import dotenv from 'dotenv';

const env = dotenv.config()

export function getSeceretKey(){
	return env.parsed?.SECRECT_KEY
}

export function secretKeyIsSet(){
	return Boolean(getSeceretKey())
}