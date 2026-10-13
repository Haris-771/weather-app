# Weather App

A browser-based weather app that displays current conditions, sunrise and sunset
times, hourly forecasts, and a seven-day forecast. It uses browser geolocation
when available and supports searching for cities and switching temperature units.

Weather data is provided by [WeatherAPI](https://www.weatherapi.com/). Requests
are made through a Vercel serverless function so the API key stays on the server.

## Requirements

- A [WeatherAPI](https://www.weatherapi.com/) API key
- [Node.js](https://nodejs.org/) and npm
- [Vercel CLI](https://vercel.com/docs/cli) for local development and deployment

## Run locally

1. Create a `.env.local` file in the project root:

   ```env
   API_KEY=your_weatherapi_key
   ```

2. Start the app with Vercel's local development server:

   ```sh
   npx vercel dev
   ```

3. Open the local URL printed by the command.

Do not open `index.html` directly with `file://`: the app needs Vercel to serve
the `/api/fetch-data` function.

## Deploy to Vercel

1. Import this repository into Vercel or link it using `npx vercel`.
2. In the Vercel project settings, add an environment variable named `API_KEY`
   with your WeatherAPI key. Add it to each environment where the app will run.
3. Deploy the project. The Vercel CLI can deploy a production build with:

   ```sh
   npx vercel --prod
   ```

The project root contains the static app, and Vercel automatically deploys
`api/fetch-data.js` as a serverless function.

## API endpoint

The browser calls `/api/fetch-data` for both forecast and city-search requests:

- `GET /api/fetch-data?type=forecast&q=London&days=7`
- `GET /api/fetch-data?type=search&q=Lon`

The function accepts only those request types and reads the WeatherAPI key from
the server-side `API_KEY` environment variable.
