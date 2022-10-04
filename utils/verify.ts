import { run } from 'hardhat';

export const verify = async (contractAddress: string, args: any[]) => {
	console.log('Verifying contract...');

	await run('verify:verify', {
		address: contractAddress,
		constructorArguments: args,
	}).catch((err: any) => {
		if (err.message.toLowerCase().includes('already verified'))
			console.log('Contract already verified');
		else console.error('error verifying:', err);
	});
};

