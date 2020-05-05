const FileSystemUtility = require('../utilities/filesystem')

module.exports = FileSystemUtility.loadAllModulesFromFolder(`${__dirname}`, ['template.js'])
