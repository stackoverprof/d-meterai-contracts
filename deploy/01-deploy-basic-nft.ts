import { ethers, run, network } from 'hardhat';

const main = async () => {
	console.log('Deploying contract...');

	const BasicNFTFactory = await ethers.getContractFactory('BasicNFT');

	const basicNFT = await BasicNFTFactory.deploy();
	await basicNFT.deployed();

	console.log('Contract deployed to:', basicNFT.address);

	if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
		await basicNFT.deployTransaction.wait(6);
		await verify(basicNFT.address, []);
	}
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

