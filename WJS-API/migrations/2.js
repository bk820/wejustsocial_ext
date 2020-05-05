const db = true
const ObjectId = () => {}

/* Action limits */
db.getCollection('actionlimits').insert([{
	_id: ObjectId('5cc33b4e3e232305e480ac1f'),
	name: 'Follows',
	shortcode: 'follows',
}, {
	_id: ObjectId('5cc33b543e232305e480ac20'),
	name: 'Likes',
	shortcode: 'likes',
}, {
	_id: ObjectId('5cc33b5a3e232305e480ac21'),
	name: 'Comments',
	shortcode: 'comments',
}, {
	_id: ObjectId('5cc33b633e232305e480ac22'),
	name: 'Unfollows',
	shortcode: 'unfollows',
}])

/* Action types */
db.getCollection('actiontypes').insert([{
	_id: ObjectId('5cc330e004c9e503202a9dc3'),
	shortcode: 'follow',
	name: 'Follow Profiles',
	parameters: [{
		shortcode: 'active',
		name: 'Active',
	},
	{
		shortcode: 'amount',
		name: 'Amount',
	}, {
		shortcode: 'tags',
		name: 'By tags',
	}, {
		shortcode: 'follow_following',
		name: 'Follow user following',
	}],
}, {
	_id: ObjectId('5cc330fc04c9e503202a9dc4'),
	shortcode: 'like',
	name: 'Like Posts',
	parameters: [{
		shortcode: 'active',
		name: 'Active',
	},
	{
		shortcode: 'amount',
		name: 'Amount',
	}, {
		shortcode: 'tags',
		name: 'By tags',
	}],
}, {
	_id: ObjectId('5cc3310d04c9e503202a9dc5'),
	shortcode: 'comment',
	name: 'Comment Posts',
	parameters: [{
		shortcode: 'active',
		name: 'Active',
	},
	{
		shortcode: 'percentage',
		name: 'Percentage',
	}, {
		shortcode: 'tags',
		name: 'By tags',
	}],
}, {
	_id: ObjectId('5cc3314604c9e503202a9dc6'),
	shortcode: 'unfollow',
	name: 'Unfollow Profiles',
	parameters: [{
		shortcode: 'active',
		name: 'Active',
	},
	{
		shortcode: 'amount',
		name: 'Amount',
	},
	{
		shortcode: 'all',
		name: 'Unfollow All',
	}],
}])

/* Plans */
db.getCollection('plans').insert([{
	_id: ObjectId('5cc3337dd0153303e8e79072'),
	name: 'Basic',
	description: 'Everything you need to kickstart your instagram account growth including:',
	features: [
		'Targeted IG likes by our team',
		'Targeted your IG follows by our team',
		'High number of actions per day (high growth rate)',
	],
	price: 24.99,
	default: true,
	currency: 'USD',
	actions: {
		follow: {
			active: true,
			amount: 2,
			tags: true,
		},
		like: {
			active: true,
			amount: 3,
			tags: true,
		},
	},
}, {
	_id: ObjectId('5cc33408d0153303e8e79073'),
	name: 'Premium',
	description: 'Boost your growth with our premium account including everything from the basic account plus:',
	features: [
		'Our team unfollow Instagram users that do not follow you back',
		'Our team comment on pictures to increase your engagement',
		'Very high number of actions per day (very high growth rate)',
	],
	price: 49.99,
	currency: 'USD',
	actions: {
		follow: {
			active: true,
			amount: 4,
			tags: true,
		},
		like: {
			active: true,
			amount: 5,
			tags: true,
		},
		comment: {
			active: true,
			percentage: 7,
			tags: true,
		},
		unfollow: {
			active: true,
			amount: 25,
			tags: true,
		},
	},
}, {
	_id: ObjectId('5cc33483d0153303e8e79074'),
	name: 'Business',
	description: 'The ultimate solution to grow your Instagram account including everything from the basic & premium account plus:',
	features: [
		'Dedicated Support',
		'AI Generated Growth Hashtags',
		'Extreme number of actions per day (extreme growth rate)',
	],
	price: 99.99,
	currency: 'USD',
	actions: {
		follow: {
			active: true,
			amount: 6,
			tags: true,
		},
		like: {
			active: true,
			amount: 7,
			tags: true,
		},
		comment: {
			active: true,
			percentage: 12,
			tags: true,
		},
		unfollow: {
			active: true,
			amount: 35,
			tags: true,
		},
	},
}])

/* Stages */
db.getCollection('stages').insert([{
	_id: ObjectId('5cc33c023e232305e480ac23'),
	name: 'Cold',
	default: true,
	limits: {
		likes: 70,
		follows: 0,
		comments: 0,
		unfollows: 0,
	},
}, {
	_id: ObjectId('5cc33c153e232305e480ac24'),
	name: 'Warm',
	limits: {
		likes: 70,
		follows: 20,
		comments: 10,
		unfollows: 0,
	},
}, {
	_id: ObjectId('5cc33c4e3e232305e480ac25'),
	name: 'Growth',
	limits: {
		likes: 80,
		follows: 40,
		comments: 20,
		unfollows: 0,
	},
}, {
	_id: ObjectId('5cc33c5b3e232305e480ac26'),
	name: 'Mature',
	limits: {
		likes: 90,
		follows: 60,
		comments: 30,
		unfollows: 0,
	},
}])

/* Update profiles */
db.getCollection('profiles').update({}, {
	$unset: {
		actions: 1,
	},
	$set: {
		plan: ObjectId('5cc3337dd0153303e8e79072'),
		stage: ObjectId('5cc33c023e232305e480ac23'),
	},
}, { multi: true })
