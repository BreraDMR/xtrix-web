import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisitForm from '../components/VisitForm'
import api from '../api/client'
import type { VisitOut } from '../api/types'
import { renderWithProviders, resetStores, routes, signIn } from '../test/render'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))
const jana = { id: 3, full_name: 'Jana Nováková' }
const massage = { id: 5, name: 'Massage', duration_minutes: 60, price: 900, is_active: true, specialist_id: 7 }
const facial = { ...massage, id: 6, name: 'Facial', duration_minutes: 40, price: 500 }
const hidden: VisitOut = {
  id: 21, client_id: 3, specialist_id: 7, service_id: 5, service_name: 'Massage',
  date_start: '2030-05-06T08:00:00Z', date_end: '2030-05-06T09:00:00Z',
  created_at: '2030-05-01T08:00:00Z', status: 'completed', note: 'Before', price: null, payment_method: null,
  items: [{ id: 101, position: 1, service_id: 5, service_name: 'Massage', specialist_id: 7,
    duration_minutes: 60, price: null, date_start: '2030-05-06T08:00:00Z', date_end: '2030-05-06T09:00:00Z' }],
}
const chain: VisitOut = { ...hidden, service_id: null, date_end: '2030-05-06T09:40:00Z', items: [
  hidden.items![0],
  { ...hidden.items![0], id: 102, position: 2, service_id: 6, service_name: 'Facial', duration_minutes: 40,
    date_start: '2030-05-06T09:00:00Z', date_end: '2030-05-06T09:40:00Z' },
] }

beforeEach(() => { vi.stubEnv('TZ', 'Europe/Prague'); vi.clearAllMocks(); resetStores(); signIn({ id: 7, role: 'employee' }) })
function serve(visit = hidden) {
  vi.mocked(api.get).mockImplementation(routes({ '/clients/': [jana], '/services/': [massage, facial],
    '/services/5': { ...massage, specialists: [{ id: 7, full_name: 'Eva' }] },
    '/services/6': { ...facial, specialists: [{ id: 7, full_name: 'Eva' }] },
    '/visits/21': visit, '/businesses/me': { currency: 'EUR' },
  }))
  vi.mocked(api.put).mockResolvedValue({ data: { id: 21 } })
  vi.mocked(api.post).mockResolvedValue({ data: { id: 22 } })
}
function priceInput() { return screen.getByText('Price', { selector: 'label' }).parentElement!.querySelector('input')! }
async function noteEdit() {
  const note = screen.getByText('Notes', { selector: 'label' }).parentElement!.querySelector('textarea')!
  await waitFor(() => expect(note).toHaveValue('Before'))
  await userEvent.clear(note)
  await userEvent.type(note, 'After')
}
async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Update Visit' }))
  await waitFor(() => expect(api.put).toHaveBeenCalledOnce())
  return vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>
}

it('saves a completed single visit note without sending redacted prices, payment or read-only item snapshots', async () => {
  serve()
  const success = vi.fn()
  renderWithProviders(<VisitForm visitId={21} onSuccess={success} onCancel={() => {}} />)
  await noteEdit()
  expect(priceInput()).toHaveValue(null)
  const payload = await save()
  expect(payload).toMatchObject({ note: 'After', status: 'completed', service_id: 5 })
  expect(payload).not.toHaveProperty('price')
  expect(payload).not.toHaveProperty('payment_method')
  expect(payload).not.toHaveProperty('items')
  await waitFor(() => expect(success).toHaveBeenCalledOnce())
})

it('saves a completed redacted chain note without clearing payment or rebuilding prices from the service catalogue', async () => {
  serve(chain)
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await screen.findByLabelText('Service 2')
  await noteEdit()
  const payload = await save()
  expect(payload).toMatchObject({ note: 'After', status: 'completed' })
  expect(payload).not.toHaveProperty('price')
  expect(payload).not.toHaveProperty('payment_method')
  expect(payload).not.toHaveProperty('items')
})

it('lets an employee explicitly write a zero price after loading redacted financials', async () => {
  serve()
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await noteEdit()
  await userEvent.type(priceInput(), '0')
  const payload = await save()
  expect(payload.price).toBe(0)
  expect(payload).not.toHaveProperty('payment_method')
})

it('does not fill a hidden existing price when reselecting its service from a priced catalogue', async () => {
  serve()
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await noteEdit()
  const service = (await screen.findByRole('option', { name: 'Massage (60 min)' })).closest('select')!
  await userEvent.selectOptions(service, '5')
  await waitFor(() => expect(api.get).toHaveBeenCalledWith('/services/5'))
  expect(priceInput()).toHaveValue(null)
  expect(await save()).not.toHaveProperty('price')
})

it('keeps hidden chain item prices unknown when reselecting an unchanged service', async () => {
  serve(chain)
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await screen.findByLabelText('Service 2')
  await noteEdit()
  await userEvent.selectOptions(screen.getByLabelText('Service 1'), '5')
  expect(screen.queryByText(/900\.00 €/)).not.toBeInTheDocument()
  expect(await save()).not.toHaveProperty('items')
})

it('does not restore an unknown single visit price from the catalogue when adding a service', async () => {
  serve()
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await noteEdit()
  await userEvent.click(screen.getByRole('button', { name: /add service/i }))
  await userEvent.selectOptions(screen.getByLabelText('Service 2'), '6')
  expect(screen.queryByText(/900\.00 €/)).not.toBeInTheDocument()
  const payload = await save()
  expect(payload.items).toEqual([{ service_id: 5, specialist_id: 7 }, { service_id: 6, specialist_id: 7 }])
  expect(payload).not.toHaveProperty('price')
  expect(payload).not.toHaveProperty('payment_method')
})

it('preserves a known zero when a service is selected instead of silently applying its catalogue price', async () => {
  serve({ ...hidden, price: 0 })
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await noteEdit()
  const service = (await screen.findByRole('option', { name: 'Massage (60 min)' })).closest('select')!
  await userEvent.selectOptions(service, '5')
  expect(priceInput()).toHaveValue(0)
  expect((await save()).price).toBe(0)
})

it('still fills a new visit price from its selected service and submits an explicit payment change', async () => {
  serve()
  renderWithProviders(<VisitForm onSuccess={() => {}} onCancel={() => {}} />)
  const client = await screen.findByRole('option', { name: 'Jana Nováková' })
  await userEvent.selectOptions(client.closest('select')!, '3')
  const service = await screen.findByRole('option', { name: 'Massage (60 min)' })
  await userEvent.selectOptions(service.closest('select')!, '5')
  expect(priceInput()).toHaveValue(900)
  const status = screen.getByText('Status', { selector: 'label' }).parentElement!.querySelector('select')!
  await userEvent.selectOptions(status, 'completed')
  const payment = screen.getByRole('option', { name: 'Cash' }).closest('select')!
  await userEvent.selectOptions(payment, 'cash')
  await userEvent.click(screen.getByRole('button', { name: 'Create Visit' }))
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/visits/', expect.objectContaining({ price: 900, payment_method: 'cash' })))
})

it('preserves known chain snapshots and payment on a note-only edit even if catalogue prices differ', async () => {
  serve({ ...chain, price: 335, payment_method: 'card', items: chain.items!.map((item, index) => ({ ...item, price: index ? 223 : 112 })) })
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await screen.findByLabelText('Service 2')
  await noteEdit()
  await userEvent.selectOptions(screen.getByLabelText('Service 1'), '5')
  expect(screen.getByText(/112\.00 €/)).toBeInTheDocument()
  const payload = await save()
  expect(payload).toMatchObject({ note: 'After', payment_method: 'card' })
  expect(payload).not.toHaveProperty('items')
  expect(payload).not.toHaveProperty('price')
})

it('still permits an explicit price and payment write after loading unknown financials', async () => {
  serve()
  renderWithProviders(<VisitForm visitId={21} onSuccess={() => {}} onCancel={() => {}} />)
  await noteEdit()
  await userEvent.type(priceInput(), '25')
  await userEvent.selectOptions(screen.getByRole('option', { name: 'Cash' }).closest('select')!, 'cash')
  expect(await save()).toMatchObject({ price: 25, payment_method: 'cash', note: 'After' })
})

it('saves a custom zero-price visit without echoing its nullable read-only item as a service input', async () => {
  serve({ ...hidden, service_id: null, service_name: 'Custom consultation', price: 0,
    items: [{ ...hidden.items![0], service_id: null, service_name: 'Custom consultation', price: 0 }],
  })
  const success = vi.fn()
  renderWithProviders(<VisitForm visitId={21} onSuccess={success} onCancel={() => {}} />)
  await noteEdit()
  const payload = await save()
  expect(payload).toMatchObject({ service_name: 'Custom consultation', price: 0, note: 'After' })
  expect(payload).not.toHaveProperty('items')
  expect(payload).not.toHaveProperty('service_id')
  expect(payload).not.toHaveProperty('payment_method')
  await waitFor(() => expect(success).toHaveBeenCalledOnce())
})

afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs()})
it('DST proof creates a 60 minute service across the autumn fold using real UTC endpoints', async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-25T00:15:00Z'));serve();
 renderWithProviders(<VisitForm onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/visits/',expect.objectContaining({date_start:'2026-10-25T00:15:00.000Z',date_end:'2026-10-25T01:15:00.000Z'})));
});
it('DST proof preserves second-fold start passed from calendar when creating a visit',async()=>{
 serve();renderWithProviders(<VisitForm initialDateStart={new Date('2026-10-25T01:15:00Z')} onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/visits/',expect.objectContaining({date_start:'2026-10-25T01:15:00.000Z',date_end:'2026-10-25T02:15:00.000Z'})));
});
it('DST proof preserves both original instants on second-fold note-only edit',async()=>{
 serve({...hidden,date_start:'2026-10-25T01:15:00Z',date_end:'2026-10-25T02:15:00Z'});
 renderWithProviders(<VisitForm visitId={21} onSuccess={()=>{}} onCancel={()=>{}}/>);await noteEdit();
 expect(await save()).toMatchObject({date_start:'2026-10-25T01:15:00.000Z',date_end:'2026-10-25T02:15:00.000Z'});
});

it('DST proof preserves the current second-fold instant on a new default-time visit', async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-25T01:15:00Z'));serve();
 renderWithProviders(<VisitForm onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/visits/',expect.objectContaining({date_start:'2026-10-25T01:15:00.000Z',date_end:'2026-10-25T02:15:00.000Z'})));
});

it('DST control preserves second-fold chain start on a note-only edit',async()=>{
 serve({...chain,date_start:'2026-10-25T01:15:00Z',date_end:'2026-10-25T02:55:00Z'});
 renderWithProviders(<VisitForm visitId={21} onSuccess={()=>{}} onCancel={()=>{}}/>);await screen.findByLabelText('Service 2');await noteEdit();
 expect(await save()).toMatchObject({date_start:'2026-10-25T01:15:00.000Z'});
});
it('DST control keeps a sixty-minute UTC service across the spring gap',async()=>{
 serve();renderWithProviders(<VisitForm initialDateStart={new Date('2026-03-29T00:30:00Z')} onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/visits/',expect.objectContaining({date_start:'2026-03-29T00:30:00.000Z',date_end:'2026-03-29T01:30:00.000Z'})));
});
it('DST control honors manual start and manual end instead of stale saved instants',async()=>{
 serve();renderWithProviders(<VisitForm initialDateStart={new Date('2030-05-06T08:00:00Z')} initialDateEnd={new Date('2030-05-06T09:00:00Z')} onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 const inputs=document.querySelectorAll('input[type="datetime-local"]');
 fireEvent.change(inputs[0],{target:{value:'2030-05-07T11:00'}});fireEvent.change(inputs[1],{target:{value:'2030-05-07T12:45'}});
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalledWith('/visits/',expect.objectContaining({date_start:new Date('2030-05-07T11:00').toISOString(),date_end:new Date('2030-05-07T12:45').toISOString()})));
});
it('DST control rejects a manual end that is not after the start',async()=>{
 serve();renderWithProviders(<VisitForm initialDateStart={new Date('2030-05-06T08:00:00Z')} initialDateEnd={new Date('2030-05-06T09:00:00Z')} onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 const dates=document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
 fireEvent.change(dates[1],{target:{value:dates[0].value}});
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 expect(screen.getByText('End time must be after start time')).toBeInTheDocument();expect(api.post).not.toHaveBeenCalled();
});

it.each(['start','end'] as const)('rejects a manually entered spring-gap %s instead of silently booking another hour',async endpoint=>{
 serve();renderWithProviders(<VisitForm initialDateStart={new Date('2026-03-29T00:30:00Z')} onSuccess={()=>{}} onCancel={()=>{}}/>);
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Jana Nováková'})).closest('select')!,'3');
 await userEvent.selectOptions((await screen.findByRole('option',{name:'Massage (60 min)'})).closest('select')!,'5');
 fireEvent.change(document.querySelectorAll('input[type="datetime-local"]')[endpoint==='start'?0:1],{target:{value:'2026-03-29T02:30'}});
 await userEvent.click(screen.getByRole('button',{name:'Create Visit'}));
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('This local time does not exist. Choose another time.'));
 expect(api.post).not.toHaveBeenCalled();
})
