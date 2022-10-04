import { ethers } from 'hardhat';
import { assert } from 'chai';
import { BasicNFT, BasicNFT__factory } from '../typechain-types';

describe('BasicNFT functionality tests', () => {
	let basicNFTFactory: BasicNFT__factory;
	let basicNFT: BasicNFT;

	beforeEach(async () => {
		basicNFTFactory = (await ethers.getContractFactory('BasicNFT')) as BasicNFT__factory;
		basicNFT = await basicNFTFactory.deploy();
		await basicNFT.deployed();
	});

	it('Initilizes the NFT Correctly.', async () => {
		const name = await basicNFT.name();
		const symbol = await basicNFT.symbol();
		assert.equal(name, 'Dogie');
		assert.equal(symbol, 'DOG');
	});

	it('Should start with initial token counter of 0', async () => {
		const currentValue = await basicNFT.getTokenCounter();
		const expectedValue = 0;
		assert.equal(currentValue.toString(), expectedValue.toString());
	});

	it('Should mint an NFT, and updates appropriately', async () => {
		const txResponse = await basicNFT.mintNFT();
		await txResponse.wait(1);

		const tokenCounter_result = await basicNFT.getTokenCounter();
		const tokenCounter_expected = 1;
		assert.equal(tokenCounter_result.toString(), tokenCounter_expected.toString());

		const tokenURI_result = await basicNFT.tokenURI(0);
		const tokenURI_expected = await basicNFT.TOKEN_URI();
		assert.equal(tokenURI_result, tokenURI_expected);
	});
});

