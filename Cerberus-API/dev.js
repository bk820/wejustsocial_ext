require('dotenv-extended').load()
const { CerberusApi, PersistentMongoDS, RedisCacheDS } = require('./index')

const api = new CerberusApi({
	dataStores: {
		persistent: new PersistentMongoDS(),
		cache: new RedisCacheDS(),
	},
})

api.run()
