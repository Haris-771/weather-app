export default async function handler(request, response) {
    if (request.method !== 'GET') {
        response.setHeader('Allow', 'GET');
        return response.status(405).json({ error: { message: 'Method not allowed.' } });
    }

    const { type, q, days } = request.query;
    const endpoints = {
        forecast: 'forecast.json',
        search: 'search.json'
    };

    if (typeof type !== 'string' || !endpoints[type]) {
        return response.status(400).json({ error: { message: 'Invalid request type.' } });
    }

    if (typeof q !== 'string' || !q.trim()) {
        return response.status(400).json({ error: { message: 'A location query is required.' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error('API_KEY is not configured for the weather API.');
        return response.status(500).json({ error: { message: 'Weather service is not configured.' } });
    }

    const params = new URLSearchParams({ key: apiKey, q: q.trim() });
    if (type === 'forecast') {
        const forecastDays = typeof days === 'string' ? Number(days) : 7;
        if (!Number.isInteger(forecastDays) || forecastDays < 1 || forecastDays > 14) {
            return response.status(400).json({ error: { message: 'Forecast days must be between 1 and 14.' } });
        }
        params.set('days', String(forecastDays));
    }

    try {
        const apiResponse = await fetch(`https://api.weatherapi.com/v1/${endpoints[type]}?${params}`);
        const data = await apiResponse.json();
        return response.status(apiResponse.status).json(data);
    } catch (error) {
        console.error('Weather API request failed:', error);
        return response.status(502).json({ error: { message: 'Unable to reach the weather service.' } });
    }
}