import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Only contract owner can register new pets with traits",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;
        const traits = types.list([
            types.ascii("friendly"),
            types.ascii("energetic"),
            types.ascii("loyal"),
            types.ascii("smart"),
            types.ascii("playful")
        ]);

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456),
                traits
            ], deployer.address),
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Labrador"),
                types.uint(789012),
                traits
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr(types.uint(100)); // err-not-authorized
    }
});

Clarinet.test({
    name: "Cannot breed same pet with itself",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const traits = types.list([
            types.ascii("friendly"),
            types.ascii("energetic"),
            types.ascii("loyal"),
            types.ascii("smart"),
            types.ascii("playful")
        ]);

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456),
                traits
            ], deployer.address)
        ]);

        let petId = block.receipts[0].result.expectOk();

        let breedBlock = chain.mineBlock([
            Tx.contractCall('pet-registry', 'breed-pets', [
                petId,
                petId
            ], deployer.address)
        ]);

        breedBlock.receipts[0].result.expectErr(types.uint(106)); // err-same-pet
    }
});

Clarinet.test({
    name: "Cannot set invalid pet price",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const traits = types.list([
            types.ascii("friendly"),
            types.ascii("energetic"),
            types.ascii("loyal"),
            types.ascii("smart"),
            types.ascii("playful")
        ]);

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456),
                traits
            ], deployer.address)
        ]);

        let petId = block.receipts[0].result.expectOk();

        let priceBlock = chain.mineBlock([
            Tx.contractCall('pet-registry', 'set-pet-price', [
                petId,
                types.some(types.uint(0))
            ], deployer.address)
        ]);

        priceBlock.receipts[0].result.expectErr(types.uint(105)); // err-invalid-price
    }
});

Clarinet.test({
    name: "Can breed two owned pets and inherit traits",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const traits1 = types.list([
            types.ascii("friendly"),
            types.ascii("energetic"),
            types.ascii("loyal"),
            types.ascii("smart"),
            types.ascii("playful")
        ]);
        const traits2 = types.list([
            types.ascii("brave"),
            types.ascii("gentle"),
            types.ascii("patient"),
            types.ascii("alert"),
            types.ascii("curious")
        ]);

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456),
                traits1
            ], deployer.address),
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(789012),
                traits2
            ], deployer.address)
        ]);

        let pet1Id = block.receipts[0].result.expectOk();
        let pet2Id = block.receipts[1].result.expectOk();

        let breedBlock = chain.mineBlock([
            Tx.contractCall('pet-registry', 'breed-pets', [
                pet1Id,
                pet2Id
            ], deployer.address)
        ]);

        breedBlock.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Can list and buy pets through marketplace",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const buyer = accounts.get('wallet_1')!;
        const traits = types.list([
            types.ascii("friendly"),
            types.ascii("energetic"),
            types.ascii("loyal"),
            types.ascii("smart"),
            types.ascii("playful")
        ]);

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456),
                traits
            ], deployer.address)
        ]);

        let petId = block.receipts[0].result.expectOk();

        let marketBlock = chain.mineBlock([
            Tx.contractCall('pet-registry', 'set-pet-price', [
                petId,
                types.some(types.uint(1000000))
            ], deployer.address),
            Tx.contractCall('pet-registry', 'buy-pet', [
                petId
            ], buyer.address)
        ]);

        marketBlock.receipts[0].result.expectOk();
        marketBlock.receipts[1].result.expectOk();
    }
});
