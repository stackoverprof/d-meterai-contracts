import { ethers } from 'hardhat';
import { assert } from 'chai';
import { SimpleStorage, SimpleStorage__factory } from '../typechain-types';

describe('SimpleStorage functionality', () => {
	let simpleStorageFactory: SimpleStorage__factory;
	let simpleStorage: SimpleStorage;

	beforeEach(async () => {
		simpleStorageFactory = (await ethers.getContractFactory(
			'SimpleStorage'
		)) as SimpleStorage__factory;
		simpleStorage = await simpleStorageFactory.deploy();
		await simpleStorage.deployed();
	});

	it('Should start with initial number of 0', async () => {
		const currentValue = await simpleStorage.retrieve();
		const expectedValue = 0;
		assert.equal(currentValue.toString(), expectedValue.toString());
	});

	it('Should update stored number to 5', async () => {
		await (await simpleStorage.store(5)).wait(1);
		const updatedValue = await simpleStorage.retrieve();
		const expectedValue = 5;
		assert.equal(updatedValue.toString(), expectedValue.toString());
	});
});

