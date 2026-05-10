import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTrades } from '@/stores/trades-store'
import type { Trade } from '@/features/trades/data/schema'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function fmtKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function Calendar() {
  const trades = useTrades()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const map = useMemo(() => {
    const m = new Map<string, { pnl: number; count: number; trades: Trade[] }>()
    for (const t of trades) {
      const key = fmtKey(t.closedAt)
      const cur = m.get(key) ?? { pnl: 0, count: 0, trades: [] }
      cur.pnl += t.pnl
      cur.count += 1
      cur.trades.push(t)
      m.set(key, cur)
    }
    return m
  }, [trades])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: { pnl: number; count: number }[] = []
  for (let i = 0; i < cells.length; i += 7) {
    const slice = cells.slice(i, i + 7)
    const agg = slice.reduce(
      (acc, d) => {
        if (!d) return acc
        const v = map.get(fmtKey(d))
        if (v) { acc.pnl += v.pnl; acc.count += v.count }
        return acc
      },
      { pnl: 0, count: 0 }
    )
    weeks.push(agg)
  }

  const monthStats = cells.reduce(
    (acc, d) => {
      if (!d) return acc
      const v = map.get(fmtKey(d))
      if (v) {
        acc.pnl += v.pnl
        acc.count += v.count
        if (v.pnl > 0) acc.greenDays++
        else if (v.pnl < 0) acc.redDays++
      }
      return acc
    },
    { pnl: 0, count: 0, greenDays: 0, redDays: 0 }
  )

  const monthName = cursor.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })

  function shift(delta: number) {
    setCursor(new Date(year, month + delta, 1))
  }

  const selectedEntry = selectedKey ? map.get(selectedKey) : null
  const selectedDate = selectedKey ? new Date(selectedKey + 'T12:00:00') : null

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>P&L Calendar</h2>
            <p className='text-muted-foreground'>
              See how your daily and weekly results stack up. Click a day to
              view its trades.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' size='icon' onClick={() => shift(-1)}>
              <ChevronLeft className='size-4' />
            </Button>
            <div className='min-w-[160px] text-center font-medium'>
              {monthName}
            </div>
            <Button variant='outline' size='icon' onClick={() => shift(1)}>
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-4'>
          <SummaryCard label='Month P&L' value={monthStats.pnl} format='money' />
          <SummaryCard label='Trading Days' value={monthStats.count} format='int' />
          <SummaryCard label='Green Days' value={monthStats.greenDays} format='int' tone='positive' />
          <SummaryCard label='Red Days' value={monthStats.redDays} format='int' tone='negative' />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{monthName}</CardTitle>
            <CardDescription>
              Each tile shows the net P&L and number of trades for that day.
              Click a trading day for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-8 gap-1.5 text-xs'>
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className='py-1 text-center font-medium text-muted-foreground'
                >
                  {d}
                </div>
              ))}
              <div className='py-1 text-center font-medium text-muted-foreground'>
                Week
              </div>

              {Array.from({ length: weeks.length }).map((_, w) => {
                const weekCells = cells.slice(w * 7, w * 7 + 7)
                const weekly = weeks[w]
                return (
                  <div key={w} className='contents'>
                    {weekCells.map((d, idx) => (
                      <DayCell
                        key={idx}
                        date={d}
                        entry={d ? map.get(fmtKey(d)) : undefined}
                        onClick={
                          d && map.get(fmtKey(d))
                            ? () => setSelectedKey(fmtKey(d))
                            : undefined
                        }
                      />
                    ))}
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center rounded-md border bg-muted/40 p-2 text-center',
                        weekly.pnl > 0 && 'border-emerald-500/30 bg-emerald-500/10',
                        weekly.pnl < 0 && 'border-red-500/30 bg-red-500/10'
                      )}
                    >
                      {weekly.count > 0 ? (
                        <>
                          <span
                            className={cn(
                              'text-xs font-semibold tabular-nums',
                              weekly.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {weekly.pnl >= 0 ? '+' : ''}$
                            {Math.abs(weekly.pnl).toFixed(0)}
                          </span>
                          <span className='text-[10px] text-muted-foreground'>
                            {weekly.count} trades
                          </span>
                        </>
                      ) : (
                        <span className='text-[10px] text-muted-foreground'>
                          —
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
              <LegendSwatch className='bg-emerald-500/80' label='Big winning day' />
              <LegendSwatch className='bg-emerald-500/30' label='Winning day' />
              <LegendSwatch className='bg-muted' label='No trades' />
              <LegendSwatch className='bg-red-500/30' label='Losing day' />
              <LegendSwatch className='bg-red-500/80' label='Big losing day' />
            </div>
          </CardContent>
        </Card>
      </Main>

      {/* Day detail popup */}
      <Dialog
        open={!!selectedKey && !!selectedEntry}
        onOpenChange={(open) => { if (!open) setSelectedKey(null) }}
      >
        <DialogContent className='sm:max-w-md'>
          {selectedEntry && selectedDate && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </DialogTitle>
                <DialogDescription asChild>
                  <div className='flex items-center gap-2'>
                    <span>
                      {selectedEntry.count} trade
                      {selectedEntry.count !== 1 ? 's' : ''}
                    </span>
                    <span>·</span>
                    <span
                      className={cn(
                        'font-semibold',
                        selectedEntry.pnl >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      )}
                    >
                      {selectedEntry.pnl >= 0 ? '+' : ''}$
                      {selectedEntry.pnl.toFixed(2)} net P&L
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className='max-h-[60vh]'>
                <ul className='divide-y'>
                  {selectedEntry.trades.map((t) => (
                    <li key={t.id} className='py-3 first:pt-0'>
                      <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-[10px] capitalize',
                              t.direction === 'long'
                                ? 'border-emerald-500/40 text-emerald-600'
                                : 'border-red-500/40 text-red-600'
                            )}
                          >
                            {t.direction}
                          </Badge>
                          <span className='font-medium text-sm'>{t.pair}</span>
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            t.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                          )}
                        >
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                        </span>
                      </div>

                      <div className='mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground'>
                        <span>
                          <span className='font-medium text-foreground'>
                            {t.lotSize}
                          </span>{' '}
                          lots
                        </span>
                        {t.status && (
                          <span
                            className={cn(
                              'capitalize font-medium',
                              t.status === 'win'
                                ? 'text-emerald-600'
                                : t.status === 'loss'
                                  ? 'text-red-600'
                                  : 'text-foreground'
                            )}
                          >
                            {t.status}
                          </span>
                        )}
                        {t.strategy && <span>{t.strategy}</span>}
                        {t.session && <span>{t.session} session</span>}
                      </div>

                      {t.notes && (
                        <p className='mt-1.5 text-[11px] text-muted-foreground line-clamp-2'>
                          {t.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DayCell({
  date,
  entry,
  onClick,
}: {
  date: Date | null
  entry: { pnl: number; count: number } | undefined
  onClick?: () => void
}) {
  if (!date)
    return <div className='aspect-square rounded-md border border-transparent' />

  const pnl = entry?.pnl ?? 0
  const count = entry?.count ?? 0
  const intensity = Math.min(1, Math.abs(pnl) / 400)
  const hasTrades = count > 0
  const bgColor =
    !hasTrades
      ? undefined
      : pnl >= 0
        ? `rgba(16,185,129,${(0.12 + intensity * 0.55).toFixed(2)})`
        : `rgba(239,68,68,${(0.12 + intensity * 0.55).toFixed(2)})`

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={cn(
        'relative flex aspect-square flex-col justify-between overflow-hidden rounded-md p-1.5 text-[10px]',
        !hasTrades && 'bg-muted/40 border',
        hasTrades && 'border',
        hasTrades && pnl >= 0 && 'border-emerald-500/30',
        hasTrades && pnl < 0 && 'border-red-500/30',
        onClick && 'cursor-pointer transition-transform hover:scale-[1.06] active:scale-100'
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className='flex items-center justify-between'>
        <span className='font-medium text-foreground'>{date.getDate()}</span>
        {count > 0 && (
          <Badge variant='outline' className='h-4 px-1 text-[9px]'>
            {count}
          </Badge>
        )}
      </div>
      {count > 0 && (
        <div
          className={cn(
            'text-xs font-semibold tabular-nums',
            pnl >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
          )}
        >
          {pnl >= 0 ? '+' : ''}${Math.abs(pnl).toFixed(0)}
        </div>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  format: fmt,
  tone,
}: {
  label: string
  value: number
  format: 'money' | 'int'
  tone?: 'positive' | 'negative'
}) {
  const display =
    fmt === 'money'
      ? `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`
      : value.toString()
  const colored =
    tone === 'positive'
      ? 'text-emerald-600'
      : tone === 'negative'
        ? 'text-red-600'
        : fmt === 'money'
          ? value >= 0
            ? 'text-emerald-600'
            : 'text-red-600'
          : ''
  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-xs font-medium text-muted-foreground'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tabular-nums', colored)}>
          {display}
        </div>
      </CardContent>
    </Card>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className='inline-flex items-center gap-1.5'>
      <span className={cn('inline-block size-3 rounded-sm border', className)} />
      {label}
    </span>
  )
}
