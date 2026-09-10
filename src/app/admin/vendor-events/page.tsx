import Link from 'next/link'

import { VENDOR_EVENTS } from '@/lib/vendor-events'

import styles from './vendor-events.module.css'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function displayRange(start: string, end: string) {
  const first = new Date(`${start}T12:00:00Z`)
  const last = new Date(`${end}T12:00:00Z`)
  return start === end
    ? dateFormatter.format(first)
    : `${dateFormatter.format(first)}–${dateFormatter.format(last)}`
}

function daysUntil(date: string) {
  const today = new Date()
  today.setUTCHours(12, 0, 0, 0)
  return Math.ceil((new Date(`${date}T12:00:00Z`).valueOf() - today.valueOf()) / 86_400_000)
}

export const dynamic = 'force-dynamic'

export default function VendorEventsPage() {
  const events = [...VENDOR_EVENTS].sort((a, b) => a.startsOn.localeCompare(b.startsOn))
  const tribalCount = events.filter(event => event.tribalSpecific).length
  const deadlines = events.filter(event => event.registrationDeadline)

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Opportunity Radar</p>
          <h1>Vendor Events</h1>
          <p className={styles.intro}>Upcoming places to meet tribal, government, and procurement buyers.</p>
        </div>
        <div className={styles.summary} aria-label="Event summary">
          <span><strong>{events.length}</strong> upcoming</span>
          <span><strong>{tribalCount}</strong> tribal focused</span>
          <span><strong>{deadlines.length}</strong> dated deadlines</span>
        </div>
      </header>

      {deadlines.length > 0 && (
        <section className={styles.alert} aria-labelledby="deadline-heading">
          <div>
            <p className={styles.alertLabel}>Registration watch</p>
            <h2 id="deadline-heading">{deadlines[0].name}</h2>
            <p>Deadline {displayRange(deadlines[0].registrationDeadline!, deadlines[0].registrationDeadline!)} · {daysUntil(deadlines[0].registrationDeadline!)} days remaining</p>
          </div>
          <Link href={deadlines[0].sourceUrl} target="_blank" rel="noreferrer">Review registration</Link>
        </section>
      )}

      <section className={styles.list} aria-label="Upcoming vendor events">
        {events.map(event => (
          <article className={styles.event} key={event.id}>
            <div className={styles.dateBlock} aria-label={displayRange(event.startsOn, event.endsOn)}>
              <span>{displayRange(event.startsOn, event.endsOn)}</span>
              <strong>{new Date(`${event.startsOn}T12:00:00Z`).getUTCFullYear()}</strong>
            </div>
            <div className={styles.details}>
              <div className={styles.titleRow}>
                <h2>{event.name}</h2>
                {event.tribalSpecific && <span className={styles.badge}>Tribal</span>}
              </div>
              <p className={styles.meta}>{event.organizer} · {event.location}</p>
              <p>{event.fit}</p>
              <div className={styles.footer}>
                <span>{event.registration}{event.registrationDeadline ? ` · deadline ${displayRange(event.registrationDeadline, event.registrationDeadline)}` : ''}</span>
                <Link href={event.sourceUrl} target="_blank" rel="noreferrer">Official event page</Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      <p className={styles.verification}>Sources last verified September 10, 2026. Registration details should be checked before purchase or travel.</p>
    </main>
  )
}
