const express = require('express')
const app = express()
const path = require('path');
const moment = require('moment');
const cors = require('cors');

// Enable CORS for all routes
app.use(cors());

var mysql = require('mysql2/promise');
const mysqlConnectionOption = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'iot_project'
};
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://192.168.1.101", {
    username: "sonnt",
    password: "sonnt",
    port: 1993,
});

client.on("connect", () => {
    client.subscribe("esp8266/out", (err) => {
        if (!err) {

        }
    });
    client.subscribe("temp/upstream", (err) => {
        if (!err) {

        }
    });
    client.subscribe("humid/upstream", (err) => {
        if (!err) {

        }
    });
    client.subscribe("light/upstream", (err) => {
        if (!err) {

        }
    });
});

client.on("message", async (topic, message) => {
    // message is Buffer
    console.log(topic, message.toString());
    var time = moment().format("YYYY-MM-DD HH:mm:ss");
    if (topic == 'esp8266/out') {
        var obj = JSON.parse(message);
        obj.time = time;
        var connection = await mysql.createConnection(mysqlConnectionOption);
        await connection.execute(`INSERT INTO data_sensor (temperature, humidity, light, time) 
VALUES (${obj.temperature}, ${obj.humidity}, ${obj.light}, '${obj.time}')`);
        connection.end();
        await client.publishAsync("sensor/downstream", JSON.stringify(obj));
    } else if (topic == 'temp/upstream') {
        await client.publishAsync("temp", message);
        var connection = await mysql.createConnection(mysqlConnectionOption);
        await connection.execute(`INSERT INTO history (device, action, time) 
            VALUES ("Fan", '${message}', '${time}')`);
        connection.end();
    } else if (topic == 'humid/upstream') {
        await client.publishAsync("humid", message);
        var connection = await mysql.createConnection(mysqlConnectionOption);
        await connection.execute(`INSERT INTO history (device, action, time) 
            VALUES ("Hydrometer", '${message}', '${time}')`);
        connection.end();
    } else if (topic == 'light/upstream') {
        await client.publishAsync("light", message);
        var connection = await mysql.createConnection(mysqlConnectionOption);
        await connection.execute(`INSERT INTO history (device, action, time) 
            VALUES ("Bulb", '${message}', '${time}')`);
        connection.end();
    }
});

// format time
const formatRowsWithDateTime = (rows) => {
    const formatDateTime = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');  // Thêm số 0 phía trước nếu cần
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    return rows.map(row => {
        row.time = formatDateTime(row.time);  // Chuyển đổi định dạng thời gian
        return row;
    });
};

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api', async function (req, res) {
    var connection = await mysql.createConnection(mysqlConnectionOption);
    var { search, col, start, end, skip = 0, limit = 10, sorts } = req.query;
    var sortObj = parseSorts(sorts);
    var sort = "ORDER BY ";
    sort+= sortObj.map(item=> `${item.field} ${item.direction}`).reduce((a,c)=> `${a}, ${c}`);
    if (search && col) {
        var sql =`SELECT * FROM data_sensor WHERE ${col} like '%${search}%' ${sort} LIMIT ${skip},${limit}`;
        console.log(sql);
        var [rows, fields] = await connection.execute(sql);
        connection.end();
        const formattedRows = formatRowsWithDateTime(rows);
        res.json(formattedRows);
    } else {
        var [rows, fields] = await connection.execute(`SELECT * FROM data_sensor ${sort} LIMIT ${skip},${limit}`);
        connection.end();
        const formattedRows = formatRowsWithDateTime(rows);
        res.json(formattedRows);
    }
})

app.get('/api/data-sensor/count', async function (req, res) {
    var connection = await mysql.createConnection(mysqlConnectionOption);
    var { search, col, start, end, skip = 0, limit = 10, sorts } = req.query;
    var sortObj = parseSorts(sorts);
    var sort = "ORDER BY ";
    sort+= sortObj.map(item=> `${item.field} ${item.direction}`).reduce((a,c)=> `${a}, ${c}`);
    if (search && col) {
        var sql =`SELECT count(id) as total FROM data_sensor WHERE ${col} like '%${search}%' ${sort}`;
        console.log(sql);
        var [rows, fields] = await connection.execute(sql);
        connection.end();
        res.json({
            count: rows[0].total
        });
    } else {
        var [rows, fields] = await connection.execute(`SELECT count(id) as total FROM data_sensor ${sort}`);
        connection.end();
        res.json({
            count: rows[0].total
        });
    }
})

// app.get('/api/history', async function (req, res) {
//     var connection = await mysql.createConnection(mysqlConnectionOption);
//     var { search, col, start, end, skip = 0, limit = 10, sorts } = req.query;
//     // if (!sorts) {
//     //     sorts = "-time;+action";
//     // }
//     var sortObj = parseSorts(sorts);
//     var sort = "ORDER BY "
//         sort+= sortObj.map(item=> `${item.field} ${item.direction}`).reduce((a,c)=> `${a}, ${c}`);
//     if (search && col) {
//         var sql =`SELECT * FROM history WHERE ${col} like '%${search}%' ${sort} LIMIT ${skip},${limit}`;
//         console.log(sql);
//         var [rows, fields] = await connection.execute(sql);
//         connection.end();
//         res.json(rows);
//     } else {
//         var [rows, fields] = await connection.execute(`SELECT * FROM history ${sort} LIMIT ${skip},${limit}`);
//         connection.end();
//         res.json(rows);
//     }

// })

app.get('/historyy', async function (req, res) {
    var connection = await mysql.createConnection(mysqlConnectionOption);
    var { search, col, start, end, skip = 0, limit = 10, sorts } = req.query;
    var sortObj = parseSorts(sorts);
    var sort = "ORDER BY ";
    sort+= sortObj.map(item=> `${item.field} ${item.direction}`).reduce((a,c)=> `${a}, ${c}`);
    if (search && col) {
        var sql =`SELECT * FROM history WHERE ${col} like '%${search}%' ${sort} LIMIT ${skip},${limit}`;
        console.log(sql);
        var [rows, fields] = await connection.execute(sql);
        connection.end();
        const formattedRows = formatRowsWithDateTime(rows);
        res.json(formattedRows);
    } else {
        var [rows, fields] = await connection.execute(`SELECT * FROM history ${sort} LIMIT ${skip},${limit}`);
        connection.end();
        const formattedRows = formatRowsWithDateTime(rows);
        res.json(formattedRows);
    }
})

app.get('/historyy/count', async function (req, res) {
    var connection = await mysql.createConnection(mysqlConnectionOption);
    var { search, col, start, end, skip = 0, limit = 10, sorts } = req.query;
    var sortObj = parseSorts(sorts);
    var sort = "ORDER BY ";
    sort+= sortObj.map(item=> `${item.field} ${item.direction}`).reduce((a,c)=> `${a}, ${c}`);
    if (search && col) {
        var sql =`SELECT count(id) as total FROM history WHERE ${col} like '%${search}%' ${sort}`;
        console.log(sql);
        var [rows, fields] = await connection.execute(sql);
        connection.end();
        res.json({
            count: rows[0].total
        });
    } else {
        var [rows, fields] = await connection.execute(`SELECT count(id) as total FROM history ${sort}`);
        connection.end();
        res.json({
            count: rows[0].total
        });
    }
})

function parseSorts(sorts) {
    if (!sorts) return [{ 
        field: 'time',
        direction: 'desc'
    }];
    // Split the sorts string by ';'
    return sorts.split(';').map(sort => {
        // Determine the sort direction ('+' is ascending, '-' is descending)
        let direction = sort.startsWith('-') ? 'desc' : 'asc';
        // Remove the '+' or '-' to get the field name
        let field = sort.slice(1);
        return { field, direction };
    });
}

app.get('/dashboard', async function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard.html'));
})

app.get('/data_sensor', async function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'html', 'data_sensor.html'));
})

app.get('/history', async function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'html', 'history.html'));
})

app.get('/profile', async function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html'));
})


app.listen(3000)