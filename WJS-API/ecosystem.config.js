module.exports = {
	// Applications part
	apps: [{
		name: 'API',
		script: 'index.js',
		env_production: {
			NODE_ENV: 'production',
		},
	}],
	deploy: {
		production: {
			user: 'ubuntu',
			host: 'api.wejustsocial.com',
			key: '~/smartflowlabs.pem',
			ref: 'origin/master',
			repo: 'git@gitlab.com:smartflowlabs/wjs-api.git',
			path: '/home/ubuntu/wjs-api',
			'pre-deploy-local': 'scp -i ~/smartflowlabs.pem .env.production ubuntu@api.wejustsocial.com:/home/ubuntu/wjs-api/.env',
			'post-deploy': 'cp ../.env .env && git submodule update --init --recursive && npm install && pm2 startOrRestart ecosystem.config.js --env production',
		},
	},
}
