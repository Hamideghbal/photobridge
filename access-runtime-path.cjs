'use strict';
const path=require('node:path');
function runtimeJava(resources=__dirname){return path.join(resources,'access-runtime','bin',process.platform==='win32'?'java.exe':'java');}
function testJava(){return process.env.PB_ACCESS_TEST_JAVA||(process.platform==='win32'?runtimeJava():process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin','java'):'/usr/bin/java');}
module.exports={runtimeJava,testJava};
