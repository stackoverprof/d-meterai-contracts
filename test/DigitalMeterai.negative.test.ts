import { ethers } from 'hardhat';
import { assert, expect } from 'chai';
import { DigitalMeterai, DigitalMeterai__factory } from '../typechain-types';

describe('DigitalMeterai negative and prevention tests', () => {
	let DigitalMeteraiFactory: DigitalMeterai__factory;
	let DigitalMeterai: DigitalMeterai;

	beforeEach(async () => {
		DigitalMeteraiFactory = (await ethers.getContractFactory(
			'DigitalMeterai'
		)) as DigitalMeterai__factory;
		DigitalMeterai = await DigitalMeteraiFactory.deploy();
		await DigitalMeterai.deployed();
	});

	it('Should fail to mint if not contract owner', async () => {
		const [owner, addr1] = await ethers.getSigners();

		const OwnerMinting = DigitalMeterai.connect(owner).mint(1, ethers.utils.parseEther('4'));
		await expect(OwnerMinting).to.not.be.reverted;

		const NonOwnerMinting = DigitalMeterai.connect(addr1).mint(1, ethers.utils.parseEther('4'));
		await expect(NonOwnerMinting).to.be.reverted;
	});

	it('Should fail to buy if balance is insufficient', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		const tokenId = 0;
		const [_, buyer] = await ethers.getSigners();

		const call = DigitalMeterai.connect(buyer).buy(tokenId, {
			value: 1,
		});

		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___InvalidTransactionIncorrectValue'
		);
	});

	it('Should fail to buy if token is already sold', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		const tokenId = 0;
		const [_, buyer1, buyer2] = await ethers.getSigners();
		const price = await DigitalMeterai.getTokenPrice(tokenId);

		const txResponse2 = await DigitalMeterai.connect(buyer1).buy(tokenId, {
			value: price,
		});
		await txResponse2.wait(1);

		const status = await DigitalMeterai.getTokenStatus(tokenId);
		assert.equal(status, 1);

		const call = DigitalMeterai.connect(buyer2).buy(tokenId, {
			value: price,
		});

		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotAvailable'
		);
	});

	it('Should fail to bind if not yet bought', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		const tokenId = 0;
		const [_, buyer] = await ethers.getSigners();

		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';

		const call = DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotPaid'
		);
	});

	it('Should fail to bind if already bound', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		const tokenId = 0;
		const [_, buyer] = await ethers.getSigners();
		const price = await DigitalMeterai.getTokenPrice(tokenId);

		const txResponse2 = await DigitalMeterai.connect(buyer).buy(tokenId, {
			value: price,
		});
		await txResponse2.wait(1);

		const sampleDocument1 = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';
		const sampleDocument2 = 'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm';
		const txResponse3 = await DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument1);
		await txResponse3.wait(1);

		const status = await DigitalMeterai.getTokenStatus(tokenId);
		assert.equal(status, 2);

		const call = DigitalMeterai.connect(buyer).bind(tokenId, sampleDocument2);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___UnmatchedStatusNotPaid'
		);
	});

	it('Should fail to bind if not token owner', async () => {
		const txResponse = await DigitalMeterai.mint(1, ethers.utils.parseEther('4'));
		await txResponse.wait(1);

		const tokenId = 0;
		const [_, binder1, binder2] = await ethers.getSigners();
		const price = await DigitalMeterai.getTokenPrice(tokenId);

		const txResponse2 = await DigitalMeterai.connect(binder1).buy(tokenId, {
			value: price,
		});
		await txResponse2.wait(1);
		assert.equal(await DigitalMeterai.ownerOf(tokenId), binder1.address);

		const sampleDocument = 'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo';

		const call = DigitalMeterai.connect(binder2).bind(tokenId, sampleDocument);
		await expect(call).to.be.revertedWithCustomError(
			DigitalMeterai,
			'DMT___ForbiddenActionsNotOwner'
		);
	});
});

