import { run } from 'hardhat';

export const verify = async (contractAddress: string, args: any[]) => {
	// Start the process of verifying the contract
	await run('verify:verify', {
		address: contractAddress,
		constructorArguments: args,
	}).catch((err: any) => {
		// If the contract is already verified, we don't need to do anything
		if (err.message.toLowerCase().includes('already verified'))
			console.log('Contract already verified');
		// Display the error message if verification fails
		else console.error('error verifying:', err);
	});
};

