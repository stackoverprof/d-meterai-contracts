import { ethers, run, network } from 'hardhat';

const main = async () => {
	console.log('Deploying contract...');

	const SimpleStorageFactory = await ethers.getContractFactory('SimpleStorage');

	const simpleStorage = await SimpleStorageFactory.deploy();
	await simpleStorage.deployed();

	console.log('Contract deployed to:', simpleStorage.address);

	if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
		await simpleStorage.deployTransaction.wait(6);
		await verify(simpleStorage.address, []);
	}

	const currentValue = await simpleStorage.retrieve();
	console.log('currentValue', currentValue);

	// Update the current value
	const transactionResponse = await simpleStorage.store(5);
	await transactionResponse.wait(1);
	const updatedValue = await simpleStorage.retrieve();
	console.log('updatedValue', updatedValue);
};

const verify = async (contractAddress: string, args: any[]) => {
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

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
