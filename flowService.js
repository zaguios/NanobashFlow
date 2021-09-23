require('dotenv').config()

const t = require("@onflow/types")
const fs = require('fs')
const path = require('path')


const fcl = require("@onflow/fcl")

const EC = require("elliptic")
const SHA3 = require('sha3')
const ec = new EC.ec("p256");

class FlowService {
    constructor (mainContractAddress, privateKey) {
        this.mainContractAddress = mainContractAddress
        this.privateKey = privateKey
    }

    getAccount = async (addr) => {
        const { account } = await fcl.send([fcl.getAccount(addr)]);
        return account;
    };

    admin = () => {
        return async (account) => {
            const user = await this.getAccount(this.mainContractAddress);
            const key = user.keys[0] //this.minterAccountIndex]

            const sign = this.signWithKey;
            const pk = this.privateKey

            return {
                ...account,
                tempId: `${user.address}-${key.index}`,
                addr: fcl.sansPrefix(user.address),
                keyId: Number(key.index),
                signingFunction: (signable) => {
                    return {
                        addr: fcl.withPrefix(user.address),
                        keyId: Number(key.index),
                        signature: sign(pk, signable.message),
                    };
                },
            };
        };
    };

    signWithKey = (privateKey, msg) => {
        const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
        const sig = key.sign(this.hashMsg(msg));
        const n = 32;
        const r = sig.r.toArrayLike(Buffer, "be", n);
        const s = sig.s.toArrayLike(Buffer, "be", n);
        return Buffer.concat([r, s]).toString("hex");
    };

    hashMsg = (msg) => {
        const sha = new SHA3.SHA3(256);
        sha.update(Buffer.from(msg, "hex"));
        return sha.digest();
    };

    adminTx = async (cadenceFileName, args) => {
        const authorization = this.admin()

        const transaction = fs
            .readFileSync(
                path.join(
                    __dirname,
                    `./transactions/${cadenceFileName}.cdc`
                ),
                "utf8"
            )


        return this.sendTx({
            transaction,
            args,
            authorizations: [authorization],
            payer: authorization,
            proposer: authorization
        });
    }

    sendTx = async ({
                              transaction,
                              args,
                              proposer,
                              authorizations,
                              payer,
                          }) => {
        const response = await fcl.send([
            fcl.transaction`
        ${transaction}
      `,
            fcl.args(args),
            fcl.proposer(proposer),
            fcl.authorizations(authorizations),
            fcl.payer(payer),
            fcl.limit(9999),
        ]);
        return await fcl.tx(response).onceSealed();
    };

    runScript = async(cadenceFileName, args) => {
        const script = fs
            .readFileSync(
                path.join(
                    __dirname,
                    `./scripts/${cadenceFileName}.cdc`
                ),
                "utf8"
            )

        const response = await fcl.send([fcl.script`${script}`, fcl.args(args)]);
        return await fcl.decode(response);
    }

    getLatestBlockHeight = async() => {
        const block = await fcl.send([fcl.getBlock(true)]);
        const decoded = await fcl.decode(block);
        return decoded.height;
    }
}

module.exports = FlowService;