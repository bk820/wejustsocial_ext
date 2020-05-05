module.exports = {
	// Authentication Errors
	ERROR_AUTH_BADCREDENTIALS: 'Invalid email or password',
	ERROR_AUTH_UNRECOGNIZED_LOGINSTRATEGY: 'Unrecognized login strategy {{0}}',
	ERROR_AUTH_USERWITHOUTROLE: 'User {{}} doesn\'t a role',
	ERROR_AUTH_ACCESSDENIED: 'Access denied',

	// Query Errors
	ERROR_QUERY_LIMIT_TOOLOW: 'Limit parameter must be greater than 0, value passed is {{0}}',
	ERROR_QUERY_LIMIT_TOOHIGH: 'Limit parameter must be lower or equal to {{0}}, value passed is {{1}}',
	ERROR_QUERY_FILTER_BADOPERATOR: '[{{0}}] is not a valid operator',

	// DataAccess Errors
	ERROR_DATAACCESS_NOPERSISTENT: 'Cerberus data access needs a persistent database',
	ERROR_DATAACCESS_LOCK_NOCACHE: 'Cerberus data access needs a cache database for locks',
	ERROR_DATAACCESS_ENTRY_NOTFOUND: '{{0}} "{{1}}" not found',
	ERROR_DATAACCESS_NEWENTRIES_BADREQUEST: 'Error when creating new {{0}}',
	ERROR_DATAACCESS_NEWENTRY_BADREQUEST: 'Error when creating a new {{0}}',
	ERROR_DATAACCESS_UPDATEENTRIES_BADREQUEST: 'Error when updating {{0}}',
	ERROR_DATAACCESS_UPDATEENTRY_BADREQUEST: 'Error when updating a {{0}}',

	// Validation Errors
	VALIDATION_BOUNDARY_MIN_STRING: 'Must be at least {{0}} characters',
	VALIDATION_BOUNDARY_MIN_OBJECT: 'Must be at least {{0}} items',
	VALIDATION_BOUNDARY_MIN_NUMBER: 'Must greater or equal to {{0}}',
	VALIDATION_BOUNDARY_MAX_STRING: 'Must be at most {{0}} characters',
	VALIDATION_BOUNDARY_MAX_OBJECT: 'Must be at most {{0}} items',
	VALIDATION_BOUNDARY_MAX_NUMBER: 'Must lesser or equal to {{0}}',
	VALIDATION_BADTYPE: 'Must be of type {{0}}',
	VALIDATION_FORMAT_EMAIL: 'Must be a valid email',
	VALIDATION_REQUIRED: 'Is required',
	VALIDATION_NOT_ALLOWED: 'Is not allowed',
}
