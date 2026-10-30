# Live Denton forecast demonstration

Local development slice using the existing Next.js application. Public NOAA NWS hourly forecasts and ECMWF IFS forecast GRIB2 temperature fields are downloaded directly from their providers. There is no third-party forecast aggregator.

Run with Node 24.15.x, Python 3, curl and ECMWF ecCodes (`grib_get`) installed:

```sh
python3 scripts/weather-demo/refresh.py
npm run dev -- --webpack --hostname 127.0.0.1 --port 3017
```

Open `/weather-demo` and use the existing AV preview login if configured. JSON and CSV are served at `/api/weather-demo` and `/api/weather-demo?format=csv`. Both routes intentionally return 404 outside development. No production database, migration, billing or customer account creation is involved.

Snapshots and raw GRIB messages reside in ignored `.weather-demo/`. Run the refresh script again to obtain a new snapshot, then reload the page. Each source retains its issue time; retrieval time is separate. Partial-source failures are explicitly shown. Both-source failure preserves the existing snapshot, whose age remains visible.

ECMWF samples are taken at 12-hour intervals through hour 144 and daily thereafter through hour 360. The plotted line connects samples; it is not an hourly forecast. NOAA is the NWS human-issued hourly forecast, not GFS. The ECMWF run is selected from 00/12 UTC cycles with a seven-hour availability allowance and fallback to earlier cycles. GRIB nearest-point extraction and Kelvin-to-Fahrenheit conversion are applied. ECMWF data attribution: CC BY 4.0, https://www.ecmwf.int/en/forecasts/datasets/open-data.

Validation must cover variable semantics, representative grid location and interpolation before expanding fields. The first slice does not implement bias correction, probabilistic calibration, historical archives, seasonal guidance, regional weighting, automatic refresh or production continuity. This demo does not establish the RFP's proven-service qualification.
