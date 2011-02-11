var http = require('http');
var util = require('util');
var url = require('url');


// TODO: perhaps parse varnish vcl or other configuration files..
var ENDPOINTS = ['/menu','/videos']
var AUTH_TOKENS_TABLE = {
    'nick': [], // no access
    'scott': ['/menu','/videos'] // only access to these actions
}

// TODO example middleware
// naivest auth module.. 
function isAuthorized(request) {
    var reqObj = url.parse(request.url,true);
    var access_token = reqObj.query.access_token;
    var req_path = reqObj.pathname;
    if (access_token && AUTH_TOKENS_TABLE[access_token] && AUTH_TOKENS_TABLE[access_token].length > 0) {
        for (var i = 0;i < AUTH_TOKENS_TABLE[access_token].length; i++) {
            if (req_path.indexOf(AUTH_TOKENS_TABLE[access_token][i]) === 0) {
                return true;
            }
        }
    }
    return false;
}

function processRequest(request, response) {
    var reqObj = url.parse(request.url,true);
    // TODO: strip out access token, do some urlparam organization to improve cacheability on the backend.    
    var options = {
        host: 'localhost',
        port: 8887,
        path: url.format(reqObj),
        method: request.method
    }
    
    var req = http.request(options, function(res) {
      console.log(res);
      response.writeHead(res.statusCode, res.headers);
      res.pipe(response);
    });
    
    req.on('error', function() {
        response.writeHead(504, {'Content-Type': 'text/plain'});
        response.end('Gateway Timeout (the server you are hitting is not alive)');
    });
    
    req.end();
}

function rejectRequest(request, response) {
    response.writeHead(403, {'Content-Type': 'text/plain'});
    response.end('Access is Denied (go away?)');
    console.log(url.parse(request.url,true))
}


if (process.argv.length > 2) {
    SERVER_PORT = parseInt(process.argv[2], 10);
} else {
    console.log("using default port");
    SERVER_PORT = 5555;
}

http.createServer(function (request, response) {
    if (isAuthorized(request) === true) {
        processRequest(request,response);
    } else {
        rejectRequest(request, response);
    }
  }).listen(SERVER_PORT);

console.log('Server running at http://127.0.0.1:' + SERVER_PORT + "/");
