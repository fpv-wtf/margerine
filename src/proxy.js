 const http = require('http');
 const https = require('https')
 var url  = require('url')

 //process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;


 const server = http.createServer(function(request, response) {
    var url = request.url
    const options = {
        /*hostname: request.headers['host'],
        port: 443,
        path: request.url,*/
        followAllRedirects: true,
        method: request.method,
        headers: request.headers,
        rejectUnauthorized: false
    }
    if(request.url.startsWith("http://")) {
        url = "https://"+request.url.substring("http://".length)
    }
    console.log("proxy serving request to "+url, options)
    
    const proxy_request = https.request(url, options, (res) => {
        console.log("got response "+res.statusCode)

        res.on('data', function(chunk) {
            console.log("got response data")
            response.write(chunk, 'binary');
        });
        res.on('end', function() {
            console.log("response ended")
            response.end();
        });
        res.on('error', error => {
            console.error(error)
        })
        if(res.statusCode === 302) {
            if(res.headers.location.startsWith("https://")) {
                res.headers.location = "http://"+res.headers.location.substring("https://".length)
            }
        }
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
        console.log("request end")
        proxy_request.end();
    })
})

module.exports.listen = (port) => {
    server.listen(port, '0.0.0.0')
    console.log("proxy listening on port: "+port)
}