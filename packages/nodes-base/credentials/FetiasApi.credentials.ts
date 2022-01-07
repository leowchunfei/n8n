import {
	ICredentialType,
	INodeProperties
} from 'n8n-workflow';


export class FetiasApi implements ICredentialType {
	name = 'fetiasApi';
	displayName = 'FETIAS API';
	documentationUrl = 'fetias'; //documentation URL to let user refer how to create credential, generate API in FETIAS...
	properties : INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
}
