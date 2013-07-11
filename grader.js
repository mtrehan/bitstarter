#!/usr/bin/env node

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://peaceful-peak-8165.herokuapp.com";
var usingUrl = false;

var assertFileExists = function(infile) {
	var instr = infile.toString();
	if(!fs.existsSync(instr)) {
		console.log("%s does not exist. Exiting.", instr);
		process.exit(1);
	}
	return instr;
};

var cheerioHtmlFile = function(htmlfile) {
	if(usingUrl) {
		return cheerio.load(new Buffer(htmlfile));
	}
	return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
	return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
	$ = cheerioHtmlFile(htmlfile);
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for(var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	}
	return out;
};

var clone = function(fn) {
	return fn.bind({});
};

var buildfn = function() {
	var response2console = function(result, response) {
		if(result instanceof Error) {
			console.error('Error: ' + util.format(response.message));
			process.exit(1);
		}
		setup(result);
	}
	return response2console;
}

var download = function(url) {
	usingUrl = true;
	//console.log('Starting download...');
	var response2console = buildfn();
	rest.get(url).on('complete', response2console);
	return url;
}

var setup = function(result) {
	//console.log('Setting up');
	program.file = result;
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);	
}

if(require.main == module) {
	//console.log('In main.');
	program
		.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
		.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <url>', 'URL to website', clone(download), URL_DEFAULT)
		.parse(process.argv);
	if(!usingUrl) {
		//console.log('Not using url');
		var checkJson = checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);		
		console.log(outJson);
	}
	//console.log('Done main - url ' + program.url);
} else {
	exports.checkHtmlFile = checkHtmlFile;
}
