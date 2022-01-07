import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-core';

import {
	OptionsWithUri,
} from 'request';

import {
	IBinaryKeyData,
	IDataObject,
	INodeExecutionData,
	IPollFunctions,
	NodeApiError,
	NodeOperationError,
	ICredentialType,
} from 'n8n-workflow';

interface IAttachment {
	url: string;
	filename: string;
	type: string;
}

export interface IRecord {
	fields: {
		[key: string]: string | IAttachment[],
	};
}

/**
 * Make an API request to FETIAS
 *
 * @param {IHookFunctions} this
 * @param {string} method
 * @param {string} url
 * @param {object} body
 * @returns {Promise<any>}
 */
let fsk = "fsk ";
export async function apiRequest(this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions, method: string, endpoint: string, body: object, query?: IDataObject, uri?: string, option: IDataObject = {}): Promise<any> { // tslint:disable-line:no-any
	const credentials = await this.getCredentials('fetiasApi');

	if (credentials === undefined) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned!');
	}
	if (query === undefined) {
		query = {};
	}



	// For some reason for some endpoints the bearer auth does not work
	// and it returns 404 like for the /meta request. So we always send
	// it as query string.

	//query = query || {};
	//query.api_key = credentials.apiKey;
	const options: OptionsWithUri = {
		headers: {
			Authorization:  fsk + credentials.apiKey,
		},
		method,
		body,
		qs: query,
		uri: uri || `https://app01.fetias.com/api/${endpoint}`,
		useQuerystring: true,
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	try {
		return await this.helpers.request!(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}



