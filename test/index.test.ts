import { describe, it, expect } from 'vitest'
import { createClient, PayPal } from '../src'
import * as dotenv from 'dotenv'

dotenv.config()

const clientId = process.env.PAYPAL_CLIENT_ID || ''
const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''

describe('paypal-js', async () => {
	// Create sandbox client
	const client = await createClient(clientId, clientSecret, true)

	it('uses sandbox api endpoint', () => {
		expect(client.api).toBe('https://api-m.sandbox.paypal.com')
	})

	it('uses production api endpoint', () => {
		const client = new PayPal(clientId, clientSecret, false)
		expect(client.api).toBe('https://api-m.paypal.com')
	})

	it('get access token', async () => {
		const accessToken = await client.getAccessToken()
		expect(accessToken).toBeTruthy()
	})
})
