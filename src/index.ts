import { ofetch, $Fetch } from 'ofetch'

export class PayPal {
	private clientId: string
	private clientSecret: string
	api: string
	fetch: $Fetch

	constructor(clientId: string, clientSecret: string, sandbox?: boolean) {
		if (!clientId) throw Error('Client ID is required')
		if (!clientSecret) throw Error('Client Secret is required')

		this.clientId = clientId
		this.clientSecret = clientSecret

		// Determine API endpoint
		this.api = sandbox
			? 'https://api-m.sandbox.paypal.com'
			: 'https://api-m.paypal.com'

		// Create custom ofetch client
		this.fetch = ofetch.create({
			baseURL: this.api,
		})
	}

	/** Get access token to authenticate requests. */
	async getAccessToken() {
		const credentials = Buffer.from(
			`${this.clientId}:${this.clientSecret}`
		).toString('base64')

		const { access_token } = await this.fetch('/v1/oauth2/token', {
			params: {
				grant_type: 'client_credentials',
			},
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Authorization': `Basic ${credentials}`,
			},
			method: 'POST',
		})

		return access_token
	}

	/** Initialize new ofetch client injecting authorization header. */
	async initialize() {
		const access_token = await this.getAccessToken()

		this.fetch = ofetch.create({
			baseURL: this.api,
			headers: {
				Authorization: `Bearer ${access_token}`,
			},
		})
	}

	/** Create order.
	 * {@link https://developer.paypal.com/docs/api/orders/v2/#orders_create PayPal Docs}
	 */
	async createOrder(order: any) {
		const result = await this.fetch('/v2/checkout/orders', {
			body: order,
			method: 'POST',
		})
		return result.data
	}

	/** Capture order.
	 * {@link https://developer.paypal.com/docs/api/orders/v2/#orders_capture PayPal Docs}
	 */
	async captureOrder(orderId: string) {
		const { data } = await this.fetch(
			`/v2/checkout/orders/${orderId}/capture`,
			{ method: 'POST' }
		)
		return data
	}

	/** Verify webhook signature.
	 * {@link https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature_post PayPal Docs}
	 */
	async verifyWebhookSignature(
		{
			body,
			headers,
		}: {
			body: any
			headers: {
				'paypal-auth-algo': string
				'paypal-cert-url': string
				'paypal-transmission-id': string
				'paypal-transmission-sig': string
				'paypal-transmission-time': string
			}
		},
		webhookId: string
	) {
		const {
			data: { verification_status },
		} = await this.fetch('/v1/notifications/verify-webhook-signature', {
			body: {
				auth_algo: headers['paypal-auth-algo'],
				cert_url: headers['paypal-cert-url'],
				transmission_id: headers['paypal-transmission-id'],
				transmission_sig: headers['paypal-transmission-sig'],
				transmission_time: headers['paypal-transmission-time'],
				webhook_id: webhookId,
				webhook_event: body,
			},
			method: 'POST',
		})

		return verification_status === 'SUCCESS'
	}
}

export const createClient = async (
	clientId: string,
	clientSecret: string,
	sandbox?: boolean
) => {
	const client = new PayPal(clientId, clientSecret, sandbox)
	await client.initialize()
	return client
}
