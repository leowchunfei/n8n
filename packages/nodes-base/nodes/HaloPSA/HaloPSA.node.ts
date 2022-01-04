import { IExecuteFunctions } from 'n8n-core';

import {
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeCredentialTestResult,
} from 'n8n-workflow';
import { clientDescription } from './descriptions/ClientDescription';
import { invoiceDescription } from './descriptions/InvoiceDescription';
import { siteDescription } from './descriptions/SiteDescription';
import { ticketDescription } from './descriptions/TicketDescription';
import { userDescription } from './descriptions/UserDescription';

import {
	getAccessTokens,
	haloPSAApiRequest,
	processFields,
	validateCrendetials,
} from './GenericFunctions';

export class HaloPSA implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HaloPSA',
		name: 'haloPSA',
		icon: 'file:halopsa.svg',
		group: ['input'],
		version: 1,
		description: 'Consume HaloPSA API',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'HaloPSA',
			color: '#fd314e',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'haloPSAApi',
				required: true,
				testedBy: 'haloPSAApiCredentialTest',
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Client',
						value: 'client',
					},
					// {
					// 	name: 'Contract',
					// 	value: 'clientcontract',
					// },
					{
						name: 'Invoice',
						value: 'invoice',
					},
					// {
					// 	name: 'Opportunitie',
					// 	value: 'opportunities',
					// },
					// {
					// 	name: 'Project',
					// 	value: 'projects',
					// },
					// {
					// 	name: 'Quotation',
					// 	value: 'quotation',
					// },
					// {
					// 	name: 'Report',
					// 	value: 'report',
					// },
					{
						name: 'Site',
						value: 'site',
					},
					// {
					// 	name: 'Supplier',
					// 	value: 'supplier',
					// },
					{
						name: 'Ticket',
						value: 'tickets',
					},
					{
						name: 'Users',
						value: 'users',
					},
				],
				default: 'tickets',
				required: true,
				description: 'Resource to consume',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create',
						value: 'create',
					},
					{
						name: 'Delete',
						value: 'delete',
					},
					{
						name: 'Get',
						value: 'get',
					},
					{
						name: 'Get All',
						value: 'getAll',
					},
					{
						name: 'Update',
						value: 'update',
					},
				],
				default: 'getAll',
			},

			// Get, Update, Delete ----------------------------------------------------
			{
				displayName: 'Item ID',
				name: 'item_id',
				type: 'number',
				typeOptions: {
					minValue: 0,
					numberStepSize: 1,
				},
				default: 0,
				description: 'Specify item ID',
				displayOptions: {
					show: {
						operation: ['get', 'update', 'delete'],
					},
				},
			},

			// Descriptions -------------------------------------------------------------
			...ticketDescription,
			...invoiceDescription,
			...userDescription,
			...clientDescription,
			...siteDescription,

			// Create, Update --------------------------------------------------------
			{
				displayName: 'Website',
				name: 'sitesList',
				type: 'options',
				default: '',
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getHaloPSASites',
				},
				displayOptions: {
					show: {
						operation: ['create'],
						resource: ['client', 'users'],
					},
				},
			},

			{
				displayName: 'Client',
				name: 'clientsList',
				type: 'options',
				default: '',
				noDataExpression: true,
				typeOptions: {
					loadOptionsMethod: 'getHaloPSAClients',
				},
				displayOptions: {
					show: {
						operation: ['create'],
						resource: ['site', 'invoice'],
					},
				},
			},

			{
				displayName: 'Add Field',
				name: 'fieldsToCreateOrUpdate',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Field',
				},
				default: {},
				description: 'Add field and value',
				placeholder: '',
				displayOptions: {
					show: {
						operation: ['update', 'create'],
					},
				},
				options: [
					{
						displayName: 'Field:',
						name: 'fields',
						values: [
							{
								displayName: 'Field Name',
								name: 'fieldName',
								type: 'string',
								default: '',
								required: true,
							},
							{
								displayName: 'New Value',
								name: 'fieldValue',
								type: 'string',
								default: '',
								required: true,
							},
						],
					},
				],
			},

			// Delete ----------------------------------------------------------------
			{
				displayName: 'The Reason For Deleting Item',
				name: 'reasonForDeletion',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['delete'],
					},
				},
			},

			// Get All ----------------------------------------------------------------
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
				default: false,
				description: 'Whether to return all results or only up to a given limit',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						returnAll: [false],
						operation: ['getAll'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 1000,
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getHaloPSASites(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('haloPSAApi');
				const tokens = await getAccessTokens.call(this);

				const responce = (await haloPSAApiRequest.call(
					this,
					credentials?.resourceApiUrl as string,
					'site',
					'GET',
					tokens.access_token,
				)) as IDataObject[];

				const options = responce.map((site) => {
					return {
						name: site.clientsite_name as string,
						value: site.id as number,
					};
				});

				return options.sort((a, b) => a.name.localeCompare(b.name));
			},

			async getHaloPSAClients(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('haloPSAApi');
				const tokens = await getAccessTokens.call(this);

				const responce = (await haloPSAApiRequest.call(
					this,
					credentials?.resourceApiUrl as string,
					'client',
					'GET',
					tokens.access_token,
				)) as IDataObject[];

				const options = responce.map((client) => {
					return {
						name: client.name as string,
						value: client.id as number,
					};
				});

				return options.sort((a, b) => a.name.localeCompare(b.name));
			},
		},

		credentialTest: {
			async haloPSAApiCredentialTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<NodeCredentialTestResult> {
				try {
					await validateCrendetials.call(this, credential.data as ICredentialDataDecryptedObject);
				} catch (error) {
					return {
						status: 'Error',
						message: 'The API Key included in the request is invalid',
					};
				}
				return {
					status: 'OK',
					message: 'Connection successful!',
				};
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		let responseData;

		const tokens = await getAccessTokens.call(this);

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const resourceApiUrl = ((await this.getCredentials('haloPSAApi')) as IDataObject)
			.resourceApiUrl as string;

		//====================================================================
		//                        Main Loop
		//====================================================================

		for (let i = 0; i < items.length; i++) {
			try {
				// Create ----------------------------------------------------
				if (operation === 'create') {
					const data = this.getNodeParameter('fieldsToCreateOrUpdate', 0) as IDataObject;
					const item = processFields(data) || {};

					if (resource === 'tickets') {
						const summary = this.getNodeParameter('summary', 0) as string;
						item[summary] = summary;
						const details = this.getNodeParameter('details', 0) as string;
						item[details] = details;
					}

					if (resource === 'client') {
						const name = this.getNodeParameter('clientName', 0) as string;
						item['name'] = name;
						const clientIsVip = this.getNodeParameter('clientIsVip', 0) as boolean;
						item['is_vip'] = clientIsVip;
						const clientRef = this.getNodeParameter('clientRef', 0) as string;
						item['ref'] = clientRef;
						const site = this.getNodeParameter('sitesList', 0) as string;
						item['website'] = site;
					}

					if (resource === 'users') {
						const name = this.getNodeParameter('userName', 0) as string;
						item['name'] = name;
						const site = this.getNodeParameter('sitesList', 0) as string;
						item['site_id'] = site;
					}

					if (resource === 'site') {
						const siteName = this.getNodeParameter('siteName', 0) as string;
						item['name'] = siteName;
						const client = this.getNodeParameter('clientsList', 0) as number;
						item['client_id'] = client;
					}

					if (resource === 'invoice') {
						const client = this.getNodeParameter('clientsList', 0) as number;
						item['client_id'] = client;
						const invoiceDate = this.getNodeParameter('invoiceDate', 0) as number;
						item['invoice_date'] = invoiceDate;
					}

					const body = [item];
					responseData = await haloPSAApiRequest.call(
						this,
						resourceApiUrl,
						resource,
						'POST',
						tokens.access_token,
						'',
						body,
					);
				}
				// Delete ----------------------------------------------------
				if (operation === 'delete') {
					const itemID = this.getNodeParameter('item_id', 0) as string;
					const reasonForDeletion = this.getNodeParameter('reasonForDeletion', 0) as string;
					responseData = await haloPSAApiRequest.call(
						this,
						resourceApiUrl,
						resource,
						'DELETE',
						tokens.access_token,
						itemID,
						{},
						{ reason: reasonForDeletion },
					);
				}
				// Get -------------------------------------------------------
				if (operation === 'get') {
					const itemID = this.getNodeParameter('item_id', 0) as string;
					responseData = await haloPSAApiRequest.call(
						this,
						resourceApiUrl,
						resource,
						'GET',
						tokens.access_token,
						itemID,
					);
				}
				// Get All ---------------------------------------------------
				if (operation === 'getAll') {
					let count;
					const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
					if (returnAll) {
						count = {};
					} else {
						const limit = this.getNodeParameter('limit', 0) as number;
						count = { count: limit };
					}
					responseData = await haloPSAApiRequest.call(
						this,
						resourceApiUrl,
						resource,
						'GET',
						tokens.access_token,
						'',
						{},
						count,
					);
				}
				// Update ----------------------------------------------------
				if (operation === 'update') {
					const itemID = this.getNodeParameter('item_id', 0) as string;
					const data = this.getNodeParameter('fieldsToCreateOrUpdate', 0) as IDataObject;
					const body = [{ id: +itemID, ...processFields(data) }];
					responseData = await haloPSAApiRequest.call(
						this,
						resourceApiUrl,
						resource,
						'POST',
						tokens.access_token,
						'',
						body,
					);
				}

				if (Array.isArray(responseData)) {
					returnData.push.apply(returnData, responseData);
				} else if (responseData !== undefined) {
					returnData.push(responseData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as JsonObject).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
