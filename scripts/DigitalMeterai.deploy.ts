import { ethers, network } from 'hardhat';
import { verify } from '../utils/verify';

const main = async () => {
	console.log('Deploying contract...');

	const DigitalMeteraiFactory = await ethers.getContractFactory('DigitalMeterai');
	const DigitalMeterai = await DigitalMeteraiFactory.deploy();
	await DigitalMeterai.deployed();

	console.log('Contract deployed to:', DigitalMeterai.address);

	// Verifying to Etherscan
	if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
		await DigitalMeterai.deployTransaction.wait(10);
		await verify(DigitalMeterai.address, []);
	}
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

