 const http = require('http');
 const https = require('https')
 var url  = require('url')


 var verbosity = 0

 const server = http.createServer(function(request, response) {
    var url = request.url
    const options = {
        followAllRedirects: true,
        method: request.method,
        headers: request.headers,
        rejectUnauthorized: false
    }
    var protocol = http
    if(request.url.startsWith("http://")) {
        url = "https://"+request.url.substring("http://".length)
        protocol = https
    }
    if(request.url.startsWith("http://repo.fpv.wtf/http%3a//")) {
        url = "https://"+request.url.substring("http://repo.fpv.wtf/http%3a//".length)
        protocol = https
    }
    //sure, this could've been one less if with a regex
    //but would it really have been better?
    if(request.url.startsWith("http://repo.fpv.wtf/https%3a//")) {
        url = "https://"+request.url.substring("http://repo.fpv.wtf/https%3a//".length)
        protocol = https
    }

    if(verbosity) 
        console.log("proxy serving request to "+url, options)
    
    const proxy_request = protocol.request(url, options, (res) => {
        if(verbosity) 
            console.log("got response "+res.statusCode)

        res.on('data', function(chunk) {
            //console.log("got response data")
            response.write(chunk, 'binary');
        });
        res.on('end', function() {
            if(verbosity) 
                console.log("response ended")
            response.end();
        });
        res.on('error', error => {
            console.error(error)
        })
        if(res.statusCode === 301 || res.statusCode === 302) {
            if(res.headers.location.startsWith("https://")) {
                res.headers.location = "http://"+res.headers.location.substring("https://".length)
            }
        }
        if(verbosity) 
            console.log("responding with", res.statusCode, res.headers)
        response.writeHead(res.statusCode, res.headers);
    
    });

    proxy_request.on('error', error => {
        console.error(error)
    })
    
    request.on('data', function(chunk) {
        proxy_request.write(chunk, 'binary');
    })
    request.on('end', function() {
        if(verbosity) 
            console.log("request end")
        proxy_request.end();
    })
})

module.exports.listen = (port) => {
    server.listen(port, '0.0.0.0')
    console.log("proxy listening on port: "+port)
}
module.exports.setVerbosity = (_verbosity) => {
    verbosity = _verbosity
}