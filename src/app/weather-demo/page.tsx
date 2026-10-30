import { notFound } from 'next/navigation'
import { readWeatherSnapshot } from '@/lib/weather-demo'
import { SITE } from '@/lib/constants'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Weather intelligence | Aetheris Vision', robots: { index: false, follow: false } }
const time = (value: string) => new Date(value).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
export default async function WeatherDemo() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const data = await readWeatherSnapshot()
  const sources = Object.entries(data?.sources ?? {})
  const all = sources.flatMap(([,s]) => s.points).filter(p => Number.isFinite(p.temperatureF))
  const minTime = Math.min(...all.map(p=>Date.parse(p.time)))
  const maxTime = Math.max(...all.map(p=>Date.parse(p.time)))
  const low = Math.floor(Math.min(...all.map(p=>p.temperatureF))/10)*10-5
  const high = Math.ceil(Math.max(...all.map(p=>p.temperatureF))/10)*10+5
  const x = (v:string) => 65+(Date.parse(v)-minTime)/Math.max(1,maxTime-minTime)*960
  const y = (v:number) => 260-(v-low)/Math.max(1,high-low)*220
  const old = !!data && (data?.evaluatedAt ?? 0)-Date.parse(data.retrievedAt)>6*3600000
  return <main style={{minHeight:'100vh',background:'#071421',color:'#e5edf5',padding:'40px clamp(16px,5vw,80px)',fontFamily:'Arial, sans-serif'}}>
    <header style={{display:'flex',justifyContent:'space-between',gap:20,flexWrap:'wrap',borderBottom:'1px solid #294152',paddingBottom:24}}>
      <div><p style={{color:'#64d7c6',letterSpacing:3,fontSize:12,textTransform:'uppercase'}}>{SITE.name} / Weather intelligence</p><h1 style={{fontSize:'clamp(30px,4vw,48px)',fontWeight:650,margin:'14px 0'}}>Denton forecasting desk</h1><p style={{color:'#a8bbc9'}}>Live-source demonstration · North Texas · America/Chicago</p></div>
      <div style={{alignSelf:'center'}}><a href='/api/weather-demo?format=csv' style={{background:'#65dfc7',color:'#06202a',padding:'12px 20px',borderRadius:8,fontWeight:700}}>Download forecast CSV</a><p style={{fontSize:12,marginTop:16,color:'#a8bbc9'}}>Refresh the page after a data refresh.</p></div>
    </header>
    {!data ? <p role='alert' style={{padding:40}}>No forecast snapshot available. Run the weather ingestion script.</p> : <>
      <div style={{display:'flex',gap:12,flexWrap:'wrap',margin:'24px 0'}}><span style={{color:old?'#ffc77b':'#65dfc7'}}>{old?'Snapshot needs refresh':'Recently retrieved snapshot'}</span><span style={{color:'#a8bbc9'}}>Retrieved {time(data.retrievedAt)}</span><span style={{color:'#a8bbc9'}}>Manual ingestion · no automatic refresh yet</span></div>
      {Object.keys(data.errors).length>0 && <p role='alert' style={{color:'#ffc77b'}}>Some sources could not be retrieved: {Object.keys(data.errors).join(', ')}. Available sources are shown below.</p>}
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>{sources.map(([key,s],i)=><article key={key} style={{background:'#102435',padding:24,border:'1px solid #294152',borderRadius:12}}><p style={{color:i===0?'#65dfc7':'#ffbd70',fontWeight:700}}>{s.name}</p><h2 style={{fontSize:32,margin:'12px 0'}}>{s.points.find(p=>Date.parse(p.time)>=(data?.evaluatedAt ?? 0))?.temperatureF.toFixed(0) ?? '—'}°F</h2><p style={{color:'#a8bbc9',fontSize:13}}>Next available forecast sample</p><p style={{fontSize:13,marginTop:12}}>Source timestamp {time(s.issuedAt)}</p><p style={{color:'#a8bbc9',fontSize:13}}>{s.points.length} samples · through {time(s.points.at(-1)!.time)}</p></article>)}</section>
      <section style={{marginTop:24,padding:24,background:'#102435',border:'1px solid #294152',borderRadius:12}}><h2 style={{fontSize:23,fontWeight:650}}>Temperature outlook</h2><p style={{color:'#a8bbc9',fontSize:14,marginTop:8}}>NOAA hourly forecast alongside ECMWF sampled guidance. Lines connect native samples; they do not imply hourly ECMWF precision.</p>
      {all.length>1 && <svg viewBox='0 0 1060 310' role='img' aria-label='Forecast temperature in Fahrenheit over time' style={{width:'100%',marginTop:16}}>{[0,1,2,3,4].map(i=>{const t=low+(high-low)*i/4;return <g key={i}><line x1='65' x2='1025' y1={y(t)} y2={y(t)} stroke='#294152'/><text x='8' y={y(t)+5} fill='#a8bbc9' fontSize='14'>{t.toFixed(0)}°F</text></g>})}{sources.map(([key,s],i)=><polyline key={key} points={s.points.map(p=>`${x(p.time)},${y(p.temperatureF)}`).join(' ')} fill='none' stroke={i===0?'#65dfc7':'#ffbd70'} strokeWidth='3'/>)}{[0,1,2,3,4,5].map(i=><text key={i} x={65+i*192} y='295' textAnchor={i===5?'end':'start'} fill='#a8bbc9' fontSize='13'>{new Date(minTime+(maxTime-minTime)*i/5).toLocaleDateString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric'})}</text>)}</svg>}
      <div style={{display:'flex',gap:24}}>{sources.map(([key,s],i)=><span key={key} style={{color:i===0?'#65dfc7':'#ffbd70'}}>{s.name}</span>)}</div></section>
      <section style={{marginTop:24}}><h2 style={{fontSize:23}}>Next 12 NOAA forecast hours</h2><div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse',textAlign:'left'}}><thead><tr>{['Valid time','Temperature','Wind','Precipitation probability','Conditions'].map(h=><th key={h} style={{padding:12,color:'#a8bbc9'}}>{h}</th>)}</tr></thead><tbody>{data.sources.noaa?.points.filter(p=>Date.parse(p.time)>=(data?.evaluatedAt ?? 0)).slice(0,12).map(p=><tr key={p.time} style={{borderTop:'1px solid #294152'}}><td style={{padding:12}}>{time(p.time)}</td><td>{p.temperatureF.toFixed(0)}°F</td><td>{p.wind}</td><td>{p.precipitationProbability==null?'Unavailable':`${p.precipitationProbability}%`}</td><td>{p.description}</td></tr>)}</tbody></table></div></section>
      <footer style={{marginTop:32,borderTop:'1px solid #294152',paddingTop:20,color:'#a8bbc9',fontSize:13}}><p>NOAA/NWS forecasts and ECMWF model guidance retain their separate identities. No AV calibration or forecast validation has been applied.</p>{sources.map(([key,s])=><p key={key} style={{marginTop:10}}><a href={s.url} style={{textDecoration:'underline'}}>{s.name}: source</a> · {s.resolution ?? 'Hourly NWS forecast periods'}{s.attribution && ` · ${s.attribution}`}</p>)}<p style={{marginTop:12}}>Development preview. Historical queries, regional weighting, seasonal products, automated refresh and customer authentication are not implemented in this first slice.</p></footer>
    </>}
  </main>
}
