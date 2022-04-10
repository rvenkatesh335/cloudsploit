var expect = require('chai').expect;
var auth = require('./checkSecretsExpiry');

const listKeyVaults = [
    {
        "id": "/subscriptions/abcdef123-ebf6-437f-a3b0-28fc0d22117e/resourceGroups/Default-ActivityLogAlerts/providers/Microsoft.KeyVault/vaults/testvault",
        "name": "testvault",
        "type": "Microsoft.KeyVault/vaults",
        "location": "eastus",
        "tags": {},
        "sku": {
            "family": "A",
            "name": "Standard"
        }
    },
    {
        "id": "/subscriptions/abcdef123-ebf6-437f-a3b0-28fc0d22117e/resourceGroups/Default-ActivityLogAlerts/providers/Microsoft.KeyVault/vaults/testvault",
        "name": "testvault",
        "type": "Microsoft.KeyVault/vaults",
        "location": "eastus",
        "tags": {},
        "sku": {
            "family": "A",
            "name": "Standard"
        }
    }
];

const getSecrets = [
    {
        '/subscriptions/abcdef123-ebf6-437f-a3b0-28fc0d22117e/resourceGroups/Default-ActivityLogAlerts/providers/Microsoft.KeyVault/vaults/testvault': {
            data: [
                {
                    "id": "https://testvault.vault.azure.net/secrets/mysecret",
                    "attributes": {
                        "enabled": true,
                        "expiry": null,
                        "created": 1572289869,
                        "updated": 1572290380,
                        "recoveryLevel": "Recoverable+Purgeable"
                    },
                    "tags": {}
                }
            ]
        }
    },
    {
        '/subscriptions/abcdef123-ebf6-437f-a3b0-28fc0d22117e/resourceGroups/Default-ActivityLogAlerts/providers/Microsoft.KeyVault/vaults/testvault': {
            data: [
                {
                    "id": "https://testvault.vault.azure.net/secrets/mysecret",
                    "attributes": {
                        "enabled": true,
                        "expiry": '2022-12-10T21:08:47.684Z',
                        "created": 1572289869,
                        "updated": 1572290380,
                        "recoveryLevel": "Recoverable+Purgeable"
                    },
                    "tags": {}
                }
            ]
        }
    },
    {
        '/subscriptions/abcdef123-ebf6-437f-a3b0-28fc0d22117e/resourceGroups/Default-ActivityLogAlerts/providers/Microsoft.KeyVault/vaults/testvault': {
            data: [
                {
                    "id": "https://testvault.vault.azure.net/secrets/mysecret",
                    "attributes": {
                        "enabled": false,
                        "expiry": 1635448252,
                        "created": 1572289869,
                        "updated": 1572290380,
                        "recoveryLevel": "Recoverable+Purgeable"
                    },
                    "tags": {}
                }
            ]
        }
    }
];

const createCache = (err, list, get) => {
    return {
        vaults: {
            list: {
                'eastus': {
                    err: err,
                    data: list
                }
            },
            getSecrets: {
                'eastus': get
            }
        }
    }
};

describe('checkSecretsExpiry', function() {
    describe('run', function() {
        it('should give passing result if no secrets found', function(done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('No Key Vaults found');
                expect(results[0].region).to.equal('eastus');
                done()
            };

            auth.run(createCache(null, [], {}), {}, callback);
        });

        it('should give failing result if expiration is not set on secrets', function(done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(2);
                expect(results[0].message).to.include('Expiry date is not set for the secret');
                expect(results[0].region).to.equal('eastus');
                done()
            };

            auth.run(createCache(null, [listKeyVaults[0]], getSecrets[0]), {}, callback);
        });

        it('should give passing result if expiration is set on keys', function(done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('Expiry date is set for the secret');
                expect(results[0].region).to.equal('eastus');
                done()
            };

            auth.run(createCache(null, [listKeyVaults[0]], getSecrets[1]), {}, callback);
        });

        it('should give passing result if key is disabled', function(done) {
            const callback = (err, results) => {
                expect(results.length).to.equal(1);
                expect(results[0].status).to.equal(0);
                expect(results[0].message).to.include('The secret is disabled');
                expect(results[0].region).to.equal('eastus');
                done()
            };

            auth.run(createCache(null, [listKeyVaults[0]], getSecrets[2]), {}, callback);
        });
    })
});
