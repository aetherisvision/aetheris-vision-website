"""Download public NOAA and ECMWF forecasts; keep raw GRIB and provenance locally."""
import concurrent.futures as cf
import datetime as dt
import json
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / '.weather-demo'
OUT.mkdir(exist_ok=True)

def download(url, headers=()):
    args=['curl','--fail','--silent','--show-error','--location','--max-time','45','--retry','2']
    for header in headers: args += ['-H',header]
    return subprocess.check_output(args+[url])

def noaa():
    headers=['User-Agent: AetherisVision-weather-demo (marston@aetherisvision.com)']
    point=json.loads(download('https://api.weather.gov/points/33.2148,-97.1331',headers))
    url=point['properties']['forecastHourly']
    data=json.loads(download(url,headers))['properties']
    return {'name':'NOAA / NWS hourly','url':url,'issuedAt':data['updateTime'],
      'points':[{'time':p['startTime'],'temperatureF':p['temperature'] if p['temperatureUnit']=='F' else p['temperature']*9/5+32,
        'wind':p['windSpeed']+' '+p['windDirection'],'description':p['shortForecast'],
        'precipitationProbability':p['probabilityOfPrecipitation']['value']} for p in data['periods']]}

def ecmwf():
    now=dt.datetime.now(dt.timezone.utc)
    # Find the newest available 00/12 UTC run, allowing publication lag.
    cycles=[now.replace(hour=h,minute=0,second=0,microsecond=0)-dt.timedelta(days=d) for d in range(3) for h in (12,0)]
    for cycle in sorted((c for c in cycles if c<=now-dt.timedelta(hours=7)),reverse=True):
        stamp=cycle.strftime('%Y%m%d%H0000')
        base=f'https://data.ecmwf.int/forecasts/{cycle:%Y%m%d}/{cycle:%H}z/ifs/0p25/oper/{stamp}'
        try:
            first=download(base+'-0h-oper-fc.index')
            break
        except subprocess.CalledProcessError: continue
    else: raise RuntimeError('No available ECMWF forecast cycle')
    def sample(step):
        url=f'{base}-{step}h-oper-fc'
        index=first if step==0 else download(url+'.index')
        entry=next(json.loads(line) for line in index.splitlines() if json.loads(line).get('param')=='2t' and json.loads(line).get('levtype')=='sfc')
        start=entry['_offset']; length=entry['_length']
        raw=download(url+'.grib2',[f'Range: bytes={start}-{start+length-1}'])
        if len(raw)!=length or not raw.startswith(b'GRIB'): raise RuntimeError('Invalid ECMWF range response')
        path=OUT/f'ecmwf-{stamp}-{step}-2t.grib2'
        path.write_bytes(raw)
        result=subprocess.check_output(['grib_get','-l','33.2148,262.8669,1','-p','dataDate,dataTime,step,shortName',str(path)],text=True).strip().split()
        if result[3]!='2t': raise RuntimeError('Unexpected GRIB parameter')
        value=float(result[-1])
        if not 180<value<340: raise RuntimeError('Invalid temperature')
        return {'time':(cycle+dt.timedelta(hours=step)).isoformat(),'temperatureF':(value-273.15)*9/5+32,
          'stepHours':step}
    steps=list(range(0,145,12))+list(range(168,361,24))
    with cf.ThreadPoolExecutor(max_workers=3) as pool: points=list(pool.map(sample,steps))
    return {'name':'ECMWF IFS control','url':'https://www.ecmwf.int/en/forecasts/datasets/open-data','issuedAt':cycle.isoformat(),
      'attribution':'ECMWF open data, CC BY 4.0. Modified: nearest grid point; Kelvin converted to Fahrenheit.',
      'points':points,'resolution':'0.25°; sampled every 12 hours to day 6, then daily to day 15'}

result={'location':{'name':'Denton, Texas','latitude':33.2148,'longitude':-97.1331},'retrievedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'sources':{},'errors':{}}
with cf.ThreadPoolExecutor(max_workers=2) as pool:
    futures={pool.submit(fn):name for name,fn in [('noaa',noaa),('ecmwf',ecmwf)]}
    for future in cf.as_completed(futures):
        name=futures[future]
        try: result['sources'][name]=future.result()
        except Exception as error: result['errors'][name]=str(error)
if not result['sources']: raise RuntimeError('Both sources failed; existing snapshot preserved')
with tempfile.NamedTemporaryFile(mode='w',dir=OUT,delete=False) as f:
    json.dump(result,f,indent=2); temp=pathlib.Path(f.name)
temp.replace(OUT/'forecast.json')
print(json.dumps({'sources':{k:len(v['points']) for k,v in result['sources'].items()},'errors':result['errors']}))
