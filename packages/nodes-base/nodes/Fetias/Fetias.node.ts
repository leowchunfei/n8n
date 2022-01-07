import { read } from 'fs';
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

import {
	apiRequest,
} from './GenericFunctions';

export class Fetias implements INodeType {
	description: INodeTypeDescription = {
			displayName: 'FETIAS',
			name: 'FETIAS',
			icon: 'file:fetias.png',
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
					name: 'fetiasApi',
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
							name: 'Read Username',
							value: 'read',
							description: 'Read username',
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
				// {
				// 	displayName: 'Additional Fields',
				// 	name: 'additionalFields',
				// 	type: 'collection',
				// 	placeholder: 'Add Field',
				// 	default: {},
				// 	displayOptions: {
				// 		show: {

				// 			operation: [
				// 				'create',
				// 			],
				// 		},
				// 	},
				// 	options: [
				// 		{
				// 			displayName: 'First Name',
				// 			name: 'firstName',
				// 			type: 'string',
				// 			default: '',
				// 		},
				// 		{
				// 			displayName: 'Last Name',
				// 			name: 'lastName',
				// 			type: 'string',
				// 			default: '',
				// 		},
				// 	],
				// },
			],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		let responseData;

		const operation = this.getNodeParameter('operation', 0) as string;
		let returnAll = false;
		let endpoint = '';
		let requestMethod = '';

		const body: IDataObject = {};
		const qs: IDataObject = {};

		if (operation === 'create') {
			// ----------------------------------
			//         CREATE ENTRY
			// ----------------------------------
			const workspace = this.getNodeParameter('workspace', 0) as string;
			const module = encodeURI(this.getNodeParameter('module', 0) as string);
			requestMethod = 'POST';
			endpoint = `Activity/Form`;

			let fields: string[];
			let options: IDataObject;

			const rows: IDataObject[] = [];

			for (let i = 0; i < items.length; i++) {
				try {
					options = this.getNodeParameter('options', i, {}) as IDataObject;

					const row: IDataObject = {};

						// Add all the fields the item has
						row.fields = { ...items[i].json };
						// tslint:disable-next-line: no-any
						delete (row.fields! as any).id;

					rows.push(row);
					body['records'] = rows;
					responseData = await apiRequest.call(this, requestMethod, endpoint, body, qs);
					returnData.push(...responseData.records);
					// empty rows

					rows.length = 0;
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					}
					throw error;
				}
			}

		}

		else if (operation === 'read') {
			// ----------------------------------
			//         read username
			// ----------------------------------

			requestMethod = 'GET';
			endpoint = `profile`;
			try {
				const username = await apiRequest.call(this, requestMethod, endpoint, body, qs);
				returnData.push(username);
				return [this.helpers.returnJsonArray(returnData)];
			} catch (error) {
				if (this.continueOnFail()) {
					return [this.helpers.returnJsonArray({ error: error.message })];
				}
				throw error;
			}

		}

		return [this.helpers.returnJsonArray(returnData)];
	}



}
