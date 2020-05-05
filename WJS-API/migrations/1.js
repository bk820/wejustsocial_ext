const db = true

db.getCollection('profiles').update({}, {
	$set: {
		actions: {
			follow: 1,
			like: 1,
			comment: 1,
			unfollow: 1,
			unfollowAll: 1,
		},
	},
}, { multi: true })
