import { ethers } from 'hardhat';
import { assert } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

describe('DigitalMeterai functionality tests', () => {
	let DigitalMeteraiFactory: DigitalMeterai__factory;
	let DigitalMeterai: DigitalMeterai;

	beforeEach(async () => {
		DigitalMeteraiFactory = (await ethers.getContractFactory(
			'DigitalMeterai'
		)) as DigitalMeterai__factory;
		DigitalMeterai = await DigitalMeteraiFactory.deploy();
		await DigitalMeterai.deployed();
	});

	it('Initilizes the NFT Correctly.', async () => {
		const name = await DigitalMeterai.name();
		const symbol = await DigitalMeterai.symbol();
		assert.equal(name, 'Dogie');
		assert.equal(symbol, 'DOG');
	});

	it('Should start with initial token counter of 0', async () => {
		const currentValue = await DigitalMeterai.getTokenCounter();
		const expectedValue = 0;
		assert.equal(currentValue.toString(), expectedValue.toString());
	});

	it('Should mint an NFT, and updates appropriately', async () => {
		const txResponse = await DigitalMeterai.mintNFT();
		await txResponse.wait(1);

		const tokenCounter_result = await DigitalMeterai.getTokenCounter();
		const tokenCounter_expected = 1;
		assert.equal(tokenCounter_result.toString(), tokenCounter_expected.toString());

		const tokenURI_result = await DigitalMeterai.tokenURI(0);
		const tokenURI_expected = await DigitalMeterai.TOKEN_URI();
		assert.equal(tokenURI_result, tokenURI_expected);
	});
});

