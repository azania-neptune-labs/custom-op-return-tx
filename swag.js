/* Has a file through ipfs before pinging them to the decentralised network */
'use strict'

const IPFS = require('ipfs')
const all = require('it-all')

async function main () {
  const node = await IPFS.create()
  const version = await node.version()

  console.log('Version:', version.version)

  for await (const file of await node.add({
    path: 'hello.txt',
    content: Buffer.from('Hello World 101')
  })) {
    console.log('Added file:', file.path, file.cid.toString())

    const data = Buffer.concat(await all(node.cat(file.cid)))

    console.log('Added file contents:', data.toString())
  }
}

main()

/*Take hash and Op_return, this hash will be pinged to all members of the bitcoin network*/
var request = require('request');
var Q = require('q');
var bitcoin = require('bitcoinjs-lib');


var PAYMENT_OUT_AMOUNT = 1;
var TX_FEE = 9000;

var priv = '';
var pub = '1DK9de3h3NVzWuLoHwiNeu2Ni9GyhWcPwD';
var OP_RETURN_ATTACHED_DATA = 'jnk';


var balanceInBits = 0;
var inputTx = '';

function bitcoinsToSatoshis(bitcoins) {
	return bitcoins / 0.00000001;
}

function getBalanceAndTxsForAddress() {
	var dfd = new Q.defer();

	var options = {
		url: "http://btc.blockr.io/api/v1/address/txs/" + pub
	}
	request(options, function(error, response, body) {
		var data = JSON.parse(body);
		dfd.resolve(data);
	});

	return dfd.promise;
}


getBalanceAndTxsForAddress()
.then(function(balanceAndTxs) {
	var txs = balanceAndTxs.data.txs;
	txs.sort(function compare(a, b){
		return b.amount - a.amount;
	});

	var chosenTx = txs[0];
	inputTx = chosenTx.tx;
	balanceInBits = bitcoinsToSatoshis(chosenTx.amount);

	console.log("Loaded transaction "+inputTx+"\n with " + balanceInBits + " satoshis");
})
.then(function(){
try{

	var tx = new bitcoin.TransactionBuilder();
	var data = new Buffer(OP_RETURN_ATTACHED_DATA);
	var dataScript = bitcoin.script.nullDataOutput(data);

	tx.addInput(inputTx, 1);
	tx.addOutput(dataScript, PAYMENT_OUT_AMOUNT);
	var changeAmount = balanceInBits - PAYMENT_OUT_AMOUNT - TX_FEE;
	console.log("Outputs: "+changeAmount);
	tx.addOutput(pub, changeAmount);

	var keyPair = bitcoin.ECPair.fromWIF(priv)
	tx.sign(0, keyPair);


	console.log(tx.build().toHex());

}catch(err){console.error(err)}
})


/*create session user credentials will be encrypted at this stage */
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();

app.get('/api', (req, res) => {
    res.json({
        message: 'welcome to the API'
    });
});

app.post('/api/posts', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secret', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            res.json({
                message: "post created...",
                authData
            });
        }
    });
});

app.post('/api/login', (req, res) => {
    // Mock user
    const user = {
        id: 1, 
        username: 'colin',
        email: 'colin@gmail.com'
    }

    jwt.sign({user: user}, 'secret', {expiresIn: '30s'}, (err, token) => {
        res.json({
            token: token
        });
    });
});

// FORMAT of token
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
    // Get the auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined 
    if (typeof bearerHeader !== "undefined") {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }
}

app.listen(3000, () => console.log('Server started on port 3000'))
