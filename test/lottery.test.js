const path = require('path');
const fs = require('fs');
const solc = require('solc');
const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

let accounts;
let lottery;

beforeEach(async ()=> {
    //get a list of all accounts
    
    accounts =   await web3.eth.getAccounts();
    
    lottery = await new web3.eth.Contract(JSON.parse(interface))
    
    .deploy({ data: bytecode})
    .send({ from: accounts[0], gas: '1000000'});
    
    lottery.setProvider(provider);
    //use one of the accounts to deploy the contract
    
});

describe('Lottery Contract:', () => {

    it('Deploys Lottery contract', () => {
        assert.ok(lottery.options.address);
    });

    it('Allows one user to enter lottery', async () =>  {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.011', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(accounts[0],players[0]);
        assert.equal(1, players.length);
    });

    it('Allows multiple users to enter lottery', async () =>  {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.011', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.11', 'ether')
        })

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        assert.equal(accounts[1],players[1]);
        assert.equal(2, players.length);
    });

    it('Requires minimum ether to enter lottery', async ()=>{
        try {
            await lottery.methods.enter().send({
            from: accounts[0],
            value: 10000
        });
        assert(false);  
    }   catch (err) {
        assert(err);
    }

    });

    it('Requires manager to pick winner', async ()=>{
        try {
            await lottery.methods.pickWinner().call({
                from: accounts[1]
            });
            assert(false);
        } catch(err)    {
            assert(err);
        }
    });

    it('Sends money to winner and resets list of players', async ()=>{
        
        var i=0;
        var Balance=0;
        console.log("\nBefore entering lottery:\n");
        for(i=0;i<4;i++)    {
            Balance = await web3.eth.getBalance(accounts[i]);
            console.log("Player " + (i+1) + ": " + accounts[i] + " Balance: " + Balance);
        }
        
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('2', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('2', 'ether')
        });
        
        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei('2', 'ether')
        });
        i=0;
        Balance=0;
        const players=await lottery.methods.getPlayers().call({
            from: accounts[0]
        });
        console.log("\nAfter entering lottery:\n");
        for(i=0;i<4;i++)    {
            Balance = await web3.eth.getBalance(players[i]);
            console.log("Player " + (i+1) + ": " + players[i] + " Balance: " + Balance);
        }
        const fullPot = await lottery.methods.getPot().call({
            from: accounts[0]
        });

        await lottery.methods.pickWinner().send({
            from: accounts[0]
        });
        
        i=0;Balance=0;
        console.log("\nAfter picking winner:\n");
        for(i=0;i<4;i++)    {
            Balance = await web3.eth.getBalance(accounts[i]);
            console.log("Player " + (i+1) + ": " + accounts[i] + " Balance: " + Balance);
        }
        const emptyPot = await lottery.methods.getPot().call({
            from: accounts[0]
        });

        console.log("\n" + fullPot + "\n" + emptyPot + "\n");
        //assert.equal(true, difference > web3.utils.toWei('1.8','ether'));
    });

});