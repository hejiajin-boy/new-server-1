const fs = require('fs');
//读数据库
const usersString = fs.readFileSync('./db/users.json').toString();
//将字符串变换成数组
const usersArray = JSON.parse(usersString);
console.log(usersArray);

//写数据库

const user3 = { id: 3, name: 'caokun', password: 'xxx' }
usersArray.push(user3)

//文件只能存字符串转换成字符串
const string = JSON.stringify(usersArray)
fs.writeFileSync('./db/users.json', string)