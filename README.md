# Prisma + Express E-Commerce API
This API is built to handle users and sessions authentication and to link them with related orders

## Installation
```
echo "DATABASE_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>" > .env
echo "SECRECT_KEY=$(openssl rand -base64 32)" >> .env
npm install
npm install prisma --save-dev 
npx prisma migrate dev
```

## Run Server
```
npm run server
```

## Run script
To run script on the database, write the code you want to the `script.ts` file and than run
```
npm run script
```

## Overview
- At first, the front-end must send a POST request at `/session` to return a session key

- All requests must have the session key in the header with header's key `session_id` and value `<session-key>`

- You can see your basket by using the endpoint `/order/basket`

- To update the basket you can use the endpoint `/order/basket/update` (more details on below)

- To confirm your basket, you can use endpoint `/order/basket/confirm` (more details on below)

- When you register as a user with a session that was used for processing order without loggin in, the session will be linked to the newly registered user and all previous orders which have the same email address as the new user will be linked to the user's record

## Endpoints

### `/session | Method: POST`
Create a new session that is not linked to a user

Request Body is: empty

Response is:
```
{
	"key": "501935810598",
	"email": null,
	"phoneNumber": null,
	"firstName": null,
	"lastName": null
}
```

### `/info | Method: GET`
Return info regarding the current session

Response is:
```
{
	"key": "501935810598",
	"email": "new@email.com", // if logged in 
	"phoneNumber": "+964 771 1111 111", // if logged in
	"firstName": "new", // if logged in
	"lastName": "user // if logged in
}
```

### `/register | Method: POST`
Register a new user with the current session

Request Body is:
```
{
	"email": "demo@email.com",
	"password": "secretPasswor",
	"phoneNumber": "0798124",
	"firstName": "another",
	"lastName": "usre"
}
```


Response is:
```
{
	"key": "501935810598",
	"email": "new@email.com", 
	"phoneNumber": "+964 771 1111 111",
	"firstName": "new",
	"lastName": "user
}
```

### `/login | Method: POST`
login with an existing user with the current session

Request Body is:
```
{
	"email": "demo@email.com",
	"password": "secretPasswor",
}
```


Response is:
```
{
	"key": "501935810598",
	"email": "new@email.com",
	"phoneNumber": "+964 771 1111 111",
	"firstName": "new",
	"lastName": "user
}
```

### `/order | Method: GET`
Get all orders in the database, you can filter by the ID or the status like so `/order?id=<id>` or `/order?status=CONFIRMED`

Response is:
```
[
  {
    "id": "e1773622-7eff-406f-bb16-3284b640242e",
    "email": "admin",
    "phoneNumber": "123",
    "sessionId": "1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3",
    "userId": "fffa964d-484a-4ab1-8ffe-66c15f3e348c",
    "status": "CONFIRMED",
    "orderLines": [
      {
        "id": "e3c25aab-3a0a-4128-bf03-5fdc7bfd42e5",
        "product": {
          "id": "b18730bc-a616-4993-96b4-8849fbf31a14",
          "name": "Books",
          "unitPrice": 100
        },
        "quantity": 2,
        "unitPrice": 100,
        "totalPrice": 200
      }
    ],
    "totalPrice": 200
  },
  {
    "id": "0c479f9c-697b-42fa-9f5c-c1237ff82777",
    "email": "admin",
    "phoneNumber": "123",
    "sessionId": "1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3",
    "userId": "fffa964d-484a-4ab1-8ffe-66c15f3e348c",
    "status": "DRAFT",
    "orderLines": [
      {
        "id": "123f273c-26e9-4470-a797-f0f9674792cf",
        "product": {
          "id": "02d16528-c199-4079-9215-f62aa24486d7",
          "name": "I Phone",
          "unitPrice": 200
        },
        "quantity": 3,
        "unitPrice": 200,
        "totalPrice": 600
      }
    ],
    "totalPrice": 600
  },
]
```

### `/order/basket | Method: GET`
Get the basket of the current session

Response is:
```
{
	"id": "e1773622-7eff-406f-bb16-3284b640242e",
	"email": "new@email.com",
	"phoneNumber": "+964 771 1111 111",
	"sessionId": "1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3",
	"userId": "fffa964d-484a-4ab1-8ffe-66c15f3e348c",
	"status": "DRAFT",
	"orderLines": [],
	"totalPrice": 0
}
```

### `/order/basket/update | Method: POST`
Updated the current basket by sending the product and it quantity to update

Request body is:
```
{
  "productId": "02d16528-c199-4079-9215-f62aa24486d7",
  "amount": 3 // you use a minus number to remove from the basket
}
```
Response is:
```
{
	"id": "e1773622-7eff-406f-bb16-3284b640242e",
	"email": "new@email.com",
	"phoneNumber": "+964 771 1111 111",
	"sessionId": "1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3",
	"userId": "fffa964d-484a-4ab1-8ffe-66c15f3e348c",
	"status": "DRAFT",
	"orderLines": [
		{
		"id": "e3c25aab-3a0a-4128-bf03-5fdc7bfd42e5",
		"product": {
			"id": "b18730bc-a616-4993-96b4-8849fbf31a14",
			"name": "Books",
			"unitPrice": 100
		},
		"quantity": 3,
		"unitPrice": 100,
		"totalPrice": 200
		}
	],
	"totalPrice": 200
}
```


### `/order/basket/confirm | Method: POST`
Change the order's (basket) status from `DRAFT` to `CONFIRMED`

Request body is:
```
{
	// this body must be filled even if the user is logged in
	// however, the values will only be used if no user was authenticated
	"email": "new@email.com",
	"phoneNumber": "+964 771 1111 111"
}
```
Response is:
```
{
	"id": "e1773622-7eff-406f-bb16-3284b640242e",
	"email": "new@email.com",
	"phoneNumber": "+964 771 1111 111",
	"sessionId": "1ae4d313-be35-4cc9-a9ca-ff03d93eb6c3",
	"userId": "fffa964d-484a-4ab1-8ffe-66c15f3e348c",
	"status": "CONFIRMED",
	"orderLines": [
		{
		"id": "e3c25aab-3a0a-4128-bf03-5fdc7bfd42e5",
		"product": {
			"id": "b18730bc-a616-4993-96b4-8849fbf31a14",
			"name": "Books",
			"unitPrice": 100
		},
		"quantity": 3,
		"unitPrice": 100,
		"totalPrice": 200
		}
	],
	"totalPrice": 200
}
```
