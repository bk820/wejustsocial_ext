require('dotenv').config()
// eslint-disable-next-line
const { RedisCacheDS, PersistentMongoDS, CerberusApi } = require('cerberus-api')
const models = require('./models')
const controllers = require('./controllers')

const api = new CerberusApi({
	dataStores: {
		persistent: new PersistentMongoDS(),
		cache: new RedisCacheDS(),
	},
})

api.addModels(models)
api.addControllers(controllers)
api.run()
