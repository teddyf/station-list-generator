const mysql = require('mysql');
const axios = require("axios");
const dotenv = require('dotenv');

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: "mysql"
});


const axiosInstant = axios.create({
    baseURL: 'https://api.wmata.com',
    headers: {'api_key': process.env.WMATA_KEY}
})

const getStationList = () => {
    axiosInstant.get('/Rail.svc/json/jStations');
}

const generateSql = (list) => {
    var query = '';
    list.forEach(element => {
        query += '(' + "'" + element['Code'] + "'" + ',' + "'" + element['Name'].replace(/'/,'') + "'" + ',' + "'" + element['Lat'] + "'" + ',' + "'" + element['Lon'] + "'" + ','
        + "'" + element['LineCode1'] + "'" + ',' + "'" + element['LineCode2'] + "'" + ',' + "'" + element['LineCode3'] + "'" + ',' + "'" + element['LineCode4'] + "'"
        + ',' + "'" + element['LineCode4'] + "'" + '),';
    });
    if (query.length > 1) {
        return query.substring(0,query.length-1);
    } else {
        console.log("Failed to generate query");
    }
}


const updateDatabase = (payload) => {
    console.log("update database!");
    connection.connect((err) => {
        if (err) {
            console.log("failed to connect");
        } else {
            console.log("connected!");
            connection.query('DELETE FROM metro_schema.station_table');
            connection.query('INSERT INTO metro_schema.station_table(station_ID, station_name, latitude, longitude, color_1, color_2, color_3, color_4, color_5) VALUES '
             + generateSql(payload), (result) => {
                console.log(result);
            });
            connection.end();
        }
    })
}

exports.handler = (event, context, callback) => {
    axiosInstant.get('/Rail.svc/json/jStations').then((response => {
        updateDatabase(Array.prototype.slice.call(response['data']['Stations']));
    })).catch((err) => {
        console.log("failed to get response");
    })
};