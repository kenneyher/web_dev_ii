const express = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  WEATHER_API_KEY,
  WEATHER_API_URI,
  MAX_TEMP_AGE,
  APP_PORT,
  DB_HOST,
  DB_NAME,
  DB_PORT,
} = process.env;

mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);
const server = express();

server.use(express.json());
server.use(express.urlencoded());

const tempSchema = new Schema(
  {
    value: Number,
    city: String,
    weather: String,
    weather_description: String,
  },
  { timestamps: true },
);

const Temp = mongoose.model("Temp", tempSchema);

/**
 * https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}
 */
async function fetchWeather(city) {
  try {
    const resp = await fetch(
      `${WEATHER_API_URI}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`,
    );
    const data = await resp.json();
    temp = data;
  } catch (err) {
    console.log(err);
    temp = null;
  } finally {
    return temp;
  }
}

server.get("/", async (req, res) => {
  let last = await Temp.findOne().sort({createdAt: 'desc'});
  if (last) {
    if (Date.now() - last.createdAt.getTime() <= MAX_TEMP_AGE * 60 * 1000) {
      res.json(last);
      return
    }
    const {
      main: { temp },
      name,
      weather,
    } = await fetchWeather("Managua");

    last = {
      value: temp,
      city: name,
      weather: weather[0].main,
      weather_description: weather[0].description,
    };
    await Temp.create(last);
  } else {
    const {
      main: { temp },
      name,
      weather,
    } = await fetchWeather("Managua");
    last = {
      value: temp,
      city: name,
      weather: weather[0].main,
      weather_description: weather[0].description,
    };
    await Temp.create(last);
  }

  res.json(last);
});

server.listen(APP_PORT, () => {
  console.log(`Server listening on port ${APP_PORT}.`);
});
