// import node framework
const express = require('express');
const app = express();
const fs = require('fs');
const StreamArray = require('stream-json/streamers/StreamArray');
const {Writable} = require('stream');
const transform = require('json-2-csv');

// create read stream for request
const fileStream = fs.createReadStream('./data/request.json');
// create jsonstream parser
const jsonStream = StreamArray.withParser();
// create write stream for response
const outputStreamCsv = fs.createWriteStream('./data/response.csv');

app.get('/', function (req, res) {
    res.send("Health Checkup");
    processRequestData();
});

const processRequestData = () => {
    // processing stream to write result data to csv
    const processingStream = new Writable({
        write({key, value}, encoding, callback) {
            // convert json to csv asynchronously
            setTimeout(() => {
                //console.log(key,value);
                jsonToCsv(value);
                //Runs one at a time, need to use a callback for that part to work
                callback();
            }, 10);
        },
        //Don't skip this, as we need to operate with objects, not buffers
        objectMode: true
    });

    // traverse data and prepare result
    jsonStream.on('data', ({key, value}) => {
        value = getResult(value);
        return {key, value};
    });

    // Add headers to CSV
    writeData('Gender,HeightCm,WeightKg,Bmi,BmiRange,BmiCategory,HealthRisk');

    //Pipe the streams as follows
    fileStream.pipe(jsonStream.input);
    jsonStream.pipe(processingStream);

    //So we're waiting for the 'finish' event when everything is done.
    processingStream.on('finish', () => console.log('Success'));
}

const jsonToCsv = (data) => {
    transform.json2csvAsync(data, {prependHeader: false}).then(function (csv) {
        // write data to file
        writeData(csv);
    });
}

const writeData = (value) => {
    if (typeof value !== 'string') {
        //console.log("value not string " + value);
        return;
    }
    let result = outputStreamCsv.write(value + "\n");
    if (!result) {
        outputStreamCsv.once('drain', write);
    }
}

const getResult = (item) => {
    // calculate bmi for item
    bmi = getBmi(item);
    // add bmi to item
    item.Bmi = bmi;
    // find range for bmi and push to item
    bmiRange = getBmiRange(bmi);
    item.BmiRange = bmiRange;
    // find bmi category and push to item
    item.BmiCategory = getBmiCategory(bmiRange);
    // find health risk and push to item
    item.HealthRisk = getHealthRisk(bmiRange);

    return item;
}

const getBmi = (item) => {
    const weight = item.WeightKg;
    const height = item.HeightCm / 100;
    bmi = weight / Math.pow(height, 2);
    // round off to 1 decimal
    return Math.round(bmi * 10) / 10;
}

const getBmiRange = (bmi) => {
    const range = [
        18.5,
        25,
        30,
        35,
        40
    ];
    for (r in range) {
        if (bmi < range[r]) {
            return r;
        }
    }

    return r + 1;
}

const getBmiCategory = (range) => {
    const category = [
        "Underweight",
        "Normal weight",
        "Overweight",
        "Moderately obese",
        "Severely obese",
        "Very severely obese"
    ];

    return (range <= 5) ? category[range] : '';
}

const getHealthRisk = (range) => {
    const riskLevel = [
        "Malnutrition risk",
        "Low risk",
        "Enhanced risk",
        "Medium risk",
        "High risk",
        "Very high risk"
    ];

    return (range <= 5) ? riskLevel[range] : '';
}


//listen to port 3000 by default
app.listen(3000);

module.exports = app;
