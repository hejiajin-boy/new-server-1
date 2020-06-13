var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
    console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
    process.exit(1)
}

var server = http.createServer(function(request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''

    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery);
    //登录的后端逻辑
    if (path === "/sign_in" && method === "POST") {
        response.setHeader('content-Type', 'text/html;charset =utf-8');

        //读数据库
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        const array = []
            //监听请求的上传事件，每上传一点，就PUSH一点
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString() //把其他类型合并成字符串
            const obj = JSON.parse(string);
            const user = userArray.find((user) => user.name === obj.name && user.password === obj.password)
            if (user === undefined) {
                response.statusCode = 400
                response.setHeader('content-Type', 'text/json;charset =utf-8');
                response.end(`{"errorCode":4001}`)
            } else {
                response.statusCode = 200
                const random = Math.random()

                const session = JSON.parse(fs.readFileSync('./session.json').toString())

                session[random] = { user_id: user.id }
                fs.writeFileSync(`./session.json`, JSON.stringify(session))

                response.setHeader('Set-Cookie', `session_id= ${random()};HttpOnly`);
                response.end("匹配成功");
            }

        });


        //Cookie 门票
    } else if (path === "/home.html") {
        const cookie = request.headers['cookie']
        let userId

        //在 cookie里找到自己的想要的
        try {
            console.log(cookie.split(';'))
            userId = cookie.split(';').filter(s => s.indexOf('user_id') >= 0)[0].split('=')[1]
        } catch (error) {}




        if (userId) {
            const userArray = JSON.parse(fs.readFileSync("./db/users.json"));


            const user = userArray.find(user => user.id.toString() === userId)


            const homeHtml = fs.readFileSync("./public/home.html").toString();

            //判断user 是否存在
            let string
            if (user) {
                string = homeHtml.replace('{{loginStatus}}', '已登录')
                    .replace('{{user.name}}', user.name)



            } else {
                string = homeHtml.replace('{{loginStatus}}', '未登录')

                .replace('{{user.name}}', '')

            }

            response.write(string);
        } else {

            const homeHtml = fs.readFileSync("./public/home.html").toString();
            const string = homeHtml.replace('{{loginStatus}}', '未登录')
                .replace('{{user.name}}', '')
            response.write(string);

        }

        response.end()
    }
    //注册的后端逻辑
    else if (path === "/register" && method === "POST") {
        console.log("来了，老弟！");
        //要设置好类型，防止乱码
        response.setHeader('content-Type', 'text/html;charset =utf-8');

        //读数据库
        const userArray = JSON.parse(fs.readFileSync("./db/users.json"));
        const array = []
            //监听请求的上传事件，每上传一点，就PUSH一点
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString() //把其他类型合并成字符串
            const obj = JSON.parse(string);
            const lastUser = userArray[userArray.length - 1];
            console.log(obj.name)
            console.log(obj.password)

            //增加一个数据
            const newUser = {
                //得到最大的那个，在其后加入新的数据
                // id 为新用户的ID
                id: lastUser ? lastUser.id + 1 : 1,
                name: obj.name,
                password: obj.password

            };

            //存数据到数据库

            userArray.push(newUser)
            fs.writeFileSync('./db/users.json', JSON.stringify(userArray))
            console.log(string)


            response.end("good good study,day day up!");
        })
        response.end()

    } else {
        response.statusCode = 200
            // 默认首页
        const filePath = path === '/' ? '/index.html' : path
            //获取请求的路径类型
        const index = filePath.lastIndexOf('.')
            // suffix 是后缀
        const suffix = filePath.substring(index)
            //文件类型哈希表
        const fileTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        response.setHeader('Content-Type',
            `${fileTypes[suffix] || 'text/html'};charset=utf-8`)
        let content
        try {
            content = fs.readFileSync(`./public${filePath}`)
        } catch (error) {
            content = '文件不存在'
            response.statusCode = 404
        }
        response.write(content)
        response.end()

    };


    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)