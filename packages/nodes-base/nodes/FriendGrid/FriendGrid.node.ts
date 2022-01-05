import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	OptionsWithUri,
} from 'request';

export class FriendGrid implements INodeType {
	description: INodeTypeDescription = {
			displayName: 'FETIAS',
			name: 'FETIAS',
			icon: 'file:friendGrid.png',
			group: ['transform'],
			version: 1,
			description: 'Consume FETIAS API',
			defaults: {
					name: 'FETIAS',
					color: '#1A82e2',
			},
			inputs: ['main'],
			outputs: ['main'],
			credentials: [
				{
					name: 'friendGridApi',
					required: true,
				},
			],
			properties: [
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					displayOptions: {
						show: {

						},
					},
					options: [
						{
							name: 'Create Entry',
							value: 'create',
							description: 'Create an Entry',
						},
						{
							name: 'Read Entry',
							value: 'read',
							description: 'Read an Entry',
						},
					],
					default: 'create',
					description: 'The operation to perform.',
				},
				{
					displayName: 'Workspace',
					name: 'workspace',
					type: 'string',
					required: true,
					displayOptions: {
						show: {
							operation: [
								'create',
							],

						},
					},
					default:'',
					description:'Workspace to acess',
				},
				{
					displayName: 'Module',
					name: 'module',
					type: 'string',
					required: true,
					displayOptions: {
						show: {
							operation: [
								'create',
							],

						},
					},
					default:'',
					description:'Module to acess',
				},
				{
					displayName: 'Additional Fields',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					displayOptions: {
						show: {

							operation: [
								'create',
							],
						},
					},
					options: [
						{
							displayName: 'First Name',
							name: 'firstName',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Last Name',
							name: 'lastName',
							type: 'string',
							default: '',
						},
					],
				},
			],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let responseData;
		const returnData = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		//Get credentials the user provided for this node
		const credentials = await this.getCredentials('friendGridApi') as IDataObject;
		let endpoint = ''

		for (let i = 0; i < items.length; i++) {
				if (operation === 'create') {
					// get module input
					const workspace = this.getNodeParameter('workspace', i) as string;
					const module = this.getNodeParameter('module', i) as string;

					// get additional fields input
					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					const data: IDataObject = {
						workspace,
						module,
					};

					Object.assign(data, additionalFields);

					//Make http request according to <https://sendgrid.com/docs/api-reference/>
					const options: OptionsWithUri = {
						headers: {
							'Accept': 'application/json',
							'Authorization': `Bearer ${credentials.apiKey}`,
						},
						method: 'POST',
						body: {
							contacts: [
								data,
							],
						},
						uri: `https://app01.fetias.com/api/profile/${endpoint}`,
						json: true,
					};

					responseData = await this.helpers.request(options);
					returnData.push(responseData);
				}

		}
		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}


}
