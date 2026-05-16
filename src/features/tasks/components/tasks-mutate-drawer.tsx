'use client'

  import { useRef, useState } from 'react'
  import { z } from 'zod'
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { ImagePlus, Loader2, X } from 'lucide-react'
  import { toast } from 'sonner'
  import { useActiveAccount } from '@/stores/accounts-store'
  import { useTradesStore } from '@/stores/trades-store'
  import {
    EMOTIONS,
    PAIRS,
    SESSIONS,
    STRATEGIES,
    TIMEFRAMES,
    type Trade,
    type TradeDirection,
    type TradeStrategy,
    type TradeSession,
    type TradeStatus,
    type TradeTimeframe,
    type TradeEmotion,
  } from '@/features/trades/data/schema'
  import { Button } from '@/components/ui/button'
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@/components/ui/form'
  import { Input } from '@/components/ui/input'
  import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
  import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
  } from '@/components/ui/sheet'
  import { Textarea } from '@/components/ui/textarea'
  import { SelectDropdown } from '@/components/select-dropdown'

  type TradeMutateDrawerProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentRow?: Trade
  }

  const formSchema = z.object({
    pair: z.string().min(1, 'Select a pair.'),
    direction: z.string().min(1, 'Pick a side.'),
    strategy: z.string().min(1, 'Pick a strategy.'),
    session: z.string().min(1, 'Pick a session.'),
    timeframe: z.string().optional(),
    emotion: z.string().optional(),
    entry: z.coerce.number({ message: 'Entry must be a number.' }),
    exit: z.coerce.number({ message: 'Exit must be a number.' }),
    lotSize: z.coerce.number({ message: 'Lot size must be a number.' }).positive(),
    pnl: z.coerce.number({ message: 'P&L must be a number.' }),
    riskAmount: z.coerce.number().optional(),
    stopLoss: z.coerce.number().optional(),
    takeProfit: z.coerce.number().optional(),
    notes: z.string().optional(),
    mistakes: z.string().optional(),
    lessons: z.string().optional(),
    screenshotUrl: z.string().optional(),
  })
  type TradeForm = z.infer<typeof formSchema>

  export function TasksMutateDrawer({ open, onOpenChange, currentRow }: TradeMutateDrawerProps) {
    const isUpdate = !!currentRow
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | undefined>(currentRow?.screenshotUrl)
    const [uploading, setUploading] = useState(false)
    const [lastRowId, setLastRowId] = useState<string | null>(currentRow?.id ?? null)
    const currentRowId = currentRow?.id ?? null
    if (currentRowId !== lastRowId) {
      setLastRowId(currentRowId)
      setPreview(currentRow?.screenshotUrl)
    }

    const form = useForm<z.input<typeof formSchema>, any, z.output<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: currentRow ? {
        pair: currentRow.pair, direction: currentRow.direction,
        strategy: currentRow.strategy, session: currentRow.session,
        timeframe: currentRow.timeframe ?? '', emotion: currentRow.emotion ?? '',
        entry: currentRow.entry, exit: currentRow.exit,
        lotSize: currentRow.lotSize, pnl: currentRow.pnl,
        riskAmount: currentRow.riskAmount, stopLoss: currentRow.stopLoss,
        takeProfit: currentRow.takeProfit, notes: currentRow.notes ?? '',
        mistakes: currentRow.mistakes ?? '', lessons: currentRow.lessons ?? '',
        screenshotUrl: currentRow.screenshotUrl ?? '',
      } : {
        pair: '', direction: '', strategy: '', session: '',
        timeframe: '', emotion: '', entry: 0, exit: 0, lotSize: 0.1, pnl: 0,
        riskAmount: undefined, stopLoss: undefined, takeProfit: undefined,
        notes: '', mistakes: '', lessons: '', screenshotUrl: '',
      },
    })

    const account = useActiveAccount()
    const addTradesForAccount = useTradesStore((s) => s.addTradesForAccount)
    const updateTrade = useTradesStore((s) => s.updateTrade)

    const onSubmit = (data: TradeForm) => {
      if (!account) { toast.error('Add a trading account first.'); return }
      if (isUpdate && currentRow) {
        updateTrade(buildTradeFromForm(data, account.id, account.name, currentRow))
        toast.success('Trade updated.')
      } else {
        const result = addTradesForAccount(account.id, account.name, [buildTradeFromForm(data, account.id, account.name)])
        if (result.added > 0) toast.success(`Trade logged on "${account.name}".`)
        else toast.error('Could not save trade.')
      }
      onOpenChange(false)
      form.reset()
      setPreview(undefined)
    }

    const handleFile = async (file: File) => {
      if (file.size > 5_000_000) { toast.error('Screenshot must be under 5 MB.'); return }
      const localUrl = URL.createObjectURL(file)
      setPreview(localUrl)
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/trades/upload', { method: 'POST', body: fd })
        if (!res.ok) {
          const j = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(j.error ?? 'Upload failed')
        }
        const { data } = await res.json()
        setPreview(data.url)
        form.setValue('screenshotUrl', data.url, { shouldDirty: true })
      } catch (e) {
        toast.warning(e instanceof Error ? `Upload failed: ${e.message}` : 'Upload failed — trade saved without screenshot.')
        form.setValue('screenshotUrl', '', { shouldDirty: true })
      } finally {
        setUploading(false)
      }
    }

    const resetForm = () => { form.reset(); setPreview(undefined); setUploading(false) }

    return (
      <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
        <SheetContent className='flex flex-col sm:max-w-xl'>
          <SheetHeader className='text-start'>
            <SheetTitle>{isUpdate ? 'Update' : 'Log'} Trade</SheetTitle>
            <SheetDescription>
              {isUpdate ? 'Update this trade with the latest details and learnings.' : 'Record a new trade with execution details, screenshot and review.'}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form id='tasks-form' onSubmit={form.handleSubmit(onSubmit)} className='flex-1 space-y-5 overflow-y-auto px-4'>
              <div className='grid grid-cols-2 gap-3'>
                <FormField control={form.control} name='pair' render={({ field }) => (
                  <FormItem><FormLabel>Pair</FormLabel>
                    <SelectDropdown defaultValue={field.value} onValueChange={field.onChange} placeholder='Select pair' items={PAIRS.map((p) => ({ label: p, value: p }))} />
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='timeframe' render={({ field }) => (
                  <FormItem><FormLabel>Timeframe</FormLabel>
                    <SelectDropdown defaultValue={field.value} onValueChange={field.onChange} placeholder='Select timeframe' items={TIMEFRAMES.map((t) => ({ label: t, value: t }))} />
                    <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name='direction' render={({ field }) => (
                <FormItem><FormLabel>Direction</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className='flex gap-4'>
                      <FormItem className='flex items-center gap-2'><FormControl><RadioGroupItem value='long' /></FormControl><FormLabel className='font-normal'>Long</FormLabel></FormItem>
                      <FormItem className='flex items-center gap-2'><FormControl><RadioGroupItem value='short' /></FormControl><FormLabel className='font-normal'>Short</FormLabel></FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage /></FormItem>
              )} />
              <div className='grid grid-cols-2 gap-3'>
                {(['entry','exit'] as const).map((name) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem><FormLabel className='capitalize'>{name}</FormLabel>
                      <FormControl><Input type='number' step='0.00001' value={typeof field.value === 'number' ? field.value : ''} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                ))}
                {(['stopLoss','takeProfit'] as const).map((name) => (
                  <FormField key={name} control={form.control} name={name} render={({ field }) => (
                    <FormItem><FormLabel>{name === 'stopLoss' ? 'Stop Loss' : 'Take Profit'}</FormLabel>
                      <FormControl><Input type='number' step='0.00001' value={typeof field.value === 'number' ? field.value : ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                      <FormMessage /></FormItem>
                  )} />
                ))}
                <FormField control={form.control} name='lotSize' render={({ field }) => (
                  <FormItem><FormLabel>Lot size</FormLabel>
                    <FormControl><Input type='number' step='0.01' value={typeof field.value === 'number' ? field.value : ''} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='riskAmount' render={({ field }) => (
                  <FormItem><FormLabel>Risk ($)</FormLabel>
                    <FormControl><Input type='number' step='0.01' value={typeof field.value === 'number' ? field.value : ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='pnl' render={({ field }) => (
                  <FormItem className='col-span-2'><FormLabel>P&L ($)</FormLabel>
                    <FormControl><Input type='number' step='0.01' value={typeof field.value === 'number' ? field.value : ''} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage /></FormItem>
                )} />
              </div>
              <div className='grid grid-cols-2 gap-3'>
                <FormField control={form.control} name='strategy' render={({ field }) => (
                  <FormItem><FormLabel>Strategy</FormLabel>
                    <SelectDropdown defaultValue={field.value} onValueChange={field.onChange} placeholder='Select strategy' items={STRATEGIES.map((s) => ({ label: s, value: s }))} />
                    <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name='session' render={({ field }) => (
                  <FormItem><FormLabel>Session</FormLabel>
                    <SelectDropdown defaultValue={field.value} onValueChange={field.onChange} placeholder='Select session' items={SESSIONS.map((s) => ({ label: s, value: s }))} />
                    <FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name='emotion' render={({ field }) => (
                <FormItem><FormLabel>How did you feel?</FormLabel>
                  <SelectDropdown defaultValue={field.value} onValueChange={field.onChange} placeholder='Select emotion'
                    items={EMOTIONS.map((e) => ({ label: e.charAt(0).toUpperCase() + e.slice(1), value: e }))} />
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name='screenshotUrl' render={() => (
                <FormItem><FormLabel>Chart screenshot</FormLabel>
                  <FormControl>
                    <div className='space-y-2'>
                      <input ref={fileInputRef} type='file' accept='image/jpeg,image/png,image/webp,image/gif' className='hidden'
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                      {preview ? (
                        <div className='relative overflow-hidden rounded-md border'>
                          <img src={preview} alt='Trade screenshot' className='max-h-64 w-full object-contain bg-muted/40' />
                          {uploading && <div className='absolute inset-0 flex items-center justify-center bg-background/60'><Loader2 className='size-6 animate-spin text-primary' /></div>}
                          {!uploading && (
                            <Button type='button' variant='secondary' size='icon' className='absolute end-2 top-2 size-7'
                              onClick={() => { setPreview(undefined); form.setValue('screenshotUrl', '', { shouldDirty: true }); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                              <X className='size-4' />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button type='button' variant='outline' className='w-full justify-center gap-2 border-dashed py-8' disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                          {uploading ? <><Loader2 className='size-4 animate-spin' /> Uploading…</> : <><ImagePlus className='size-4' /> Upload chart screenshot</>}
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage /></FormItem>
              )} />
              {(['notes','mistakes','lessons'] as const).map((name) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className='capitalize'>{name === 'notes' ? 'Trade thesis / setup' : name.charAt(0).toUpperCase() + name.slice(1)}</FormLabel>
                    <FormControl>
                      <Textarea rows={name === 'notes' ? 3 : 2} placeholder={
                        name === 'notes' ? 'What was the setup? Why did you take this trade?' :
                        name === 'mistakes' ? 'What did you do wrong? Broke a rule? Moved a stop?' :
                        'What will you do differently next time?'
                      } {...field} />
                    </FormControl>
                    <FormMessage /></FormItem>
                )} />
              ))}
            </form>
          </Form>
          <SheetFooter className='gap-2'>
            <SheetClose asChild><Button variant='outline'>Close</Button></SheetClose>
            <Button form='tasks-form' type='submit' disabled={uploading}>
              {uploading ? <><Loader2 className='me-2 size-4 animate-spin' />Uploading…</> : 'Save trade'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  function pipFactor(pair: string) { return pair.includes('JPY') || pair.startsWith('XAU') || pair.startsWith('XAG') ? 0.01 : 0.0001 }
  function computeStatus(pnl: number): TradeStatus { return pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven' }
  function newTradeId() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `trade_${Date.now()}_${Math.random().toString(36).slice(2,8)}` }

  function buildTradeFromForm(data: TradeForm, accountId: string, accountName: string, base?: Trade): Trade {
    const factor = pipFactor(data.pair)
    const pips = factor > 0 ? ((data.exit - data.entry) / factor) * (data.direction === 'long' ? 1 : -1) : 0
    const risk = data.riskAmount ?? 0
    const now = new Date()
    return {
      id: base?.id ?? newTradeId(), accountId, account: accountName,
      pair: data.pair, direction: data.direction as TradeDirection,
      strategy: data.strategy as TradeStrategy, session: data.session as TradeSession,
      timeframe: (data.timeframe || undefined) as TradeTimeframe | undefined,
      emotion: (data.emotion || undefined) as TradeEmotion | undefined,
      entry: data.entry, exit: data.exit, stopLoss: data.stopLoss, takeProfit: data.takeProfit,
      lotSize: data.lotSize, pnl: data.pnl, pips: parseFloat(pips.toFixed(1)),
      rMultiple: parseFloat((risk > 0 ? data.pnl / risk : 0).toFixed(2)),
      riskAmount: data.riskAmount, status: computeStatus(data.pnl),
      openedAt: base?.openedAt ?? now, closedAt: base?.closedAt ?? now,
      notes: data.notes || undefined, mistakes: data.mistakes || undefined,
      lessons: data.lessons || undefined, screenshotUrl: data.screenshotUrl || undefined,
      tags: base?.tags ?? [],
    }
  }
  