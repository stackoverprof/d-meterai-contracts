import { ethers, network } from 'hardhat';
import { verify } from '../utils/verify';

const main = async () => {
	console.log('Deploying contract...');

	const BasicNFTFactory = await ethers.getContractFactory('BasicNFT');
	const basicNFT = await BasicNFTFactory.deploy();
	await basicNFT.deployed();

	console.log('Contract deployed to:', basicNFT.address);

	if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
		await basicNFT.deployTransaction.wait(4);
		await verify(basicNFT.address, []);
	}
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

