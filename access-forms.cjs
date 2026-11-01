'use strict';
// Compatibility entry point for prior native integrations.
const {addReports}=require('./access-reports.cjs');
module.exports={addForms:addReports,addReports};
