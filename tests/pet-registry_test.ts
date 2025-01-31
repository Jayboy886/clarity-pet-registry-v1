import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Only contract owner can register new pets",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456)
            ], deployer.address),
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Labrador"),
                types.uint(789012)
            ], wallet1.address)
        ]);

        block.receipts[0].result.expectOk();
        block.receipts[1].result.expectErr(types.uint(100)); // err-not-authorized
    }
});

Clarinet.test({
    name: "Can breed two owned pets",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456)
            ], deployer.address),
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(789012)
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
    name: "Can transfer owned pets",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const wallet1 = accounts.get('wallet_1')!;

        let block = chain.mineBlock([
            Tx.contractCall('pet-registry', 'register-pet', [
                types.ascii("Golden Retriever"),
                types.uint(123456)
            ], deployer.address)
        ]);

        let petId = block.receipts[0].result.expectOk();

        let transferBlock = chain.mineBlock([
            Tx.contractCall('pet-registry', 'transfer-pet', [
                petId,
                types.principal(wallet1.address)
            ], deployer.address)
        ]);

        transferBlock.receipts[0].result.expectOk();
    }
});
