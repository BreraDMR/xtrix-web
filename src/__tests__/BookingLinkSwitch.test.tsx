import {beforeEach,it,expect,vi} from 'vitest'
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom'
import {screen,act,waitFor,fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ManageBookingPage from '../pages/booking/ManageBooking'
import QuestionnairePage from '../pages/booking/Questionnaire'
import api from '../api/client'
import {apiError,renderWithProviders,resetStores} from '../test/render'
vi.mock('../api/client',()=>({default:{get:vi.fn(),post:vi.fn()}}))
const booking=(token:string)=>({booking_id:token==='token-A'?1:2,business_name:token==='token-A'?'Business A':'Business B',business_address:'Test address',business_phone:null,service_name:'Service',staff_name:'Master',start:'2030-06-01T10:00:00Z',end:'2030-06-01T11:00:00Z',timezone:'UTC',status:'planned',confirmed_at:null,price:30,currency:'EUR',token_expires_at:'2030-06-01T09:00:00Z'})
const form=(token:string)=>({version:1,name:token==='token-A'?'Questionnaire A':'Questionnaire B',description:'',fields:[{key:'preference',label:'Preference',type:'text',required:true,max_length:200}],expires_at:'2030-01-01T00:00:00Z',submitted_at:null})
function mount(path:string){window.history.replaceState({idx:0,key:'seed'},'',path+'#token=token-A');return renderWithProviders(<BrowserRouter><Link to={path+'#token=token-B'}>Open B link</Link><Routes><Route path={path} element={path==='/manage'?<ManageBookingPage/>:<QuestionnairePage/>}/></Routes></BrowserRouter>,{router:false})}
async function next(method:'native'|'router'){if(method==='router')await userEvent.click(screen.getByRole('link',{name:'Open B link'}));else await act(async()=>{window.location.hash='token=token-B';await new Promise(resolve=>setTimeout(resolve,10))})}
function deferred(){let resolve!:(value:unknown)=>void;let reject!:(value:unknown)=>void;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}}
beforeEach(()=>{vi.clearAllMocks();resetStores();sessionStorage.clear();vi.mocked(api.get).mockImplementation(async(url,config)=>{const token=String(config?.headers?.[url==='/public/questionnaires'?'X-Questionnaire-Token':'X-Booking-Token']);return{data:url==='/public/questionnaires'?form(token):booking(token)}});vi.mocked(api.post).mockImplementation(async(_url,_body,config)=>({data:booking(String(config?.headers?.['X-Booking-Token']))}))})
it.each([['native','confirm'],['native','cancel'],['native','reschedule'],['router','confirm'],['router','cancel'],['router','reschedule']] as const)('uses the new manage token for %s link then %s',async(method,action)=>{
 mount('/manage');await screen.findByText('Business A');await next(method);
 expect(screen.queryByText('Business A')).not.toBeInTheDocument();await screen.findByText('Business B');
 if(action==='confirm')await userEvent.click(screen.getByRole('button',{name:'Confirm booking'}));
 if(action==='cancel'){await userEvent.click(screen.getByRole('button',{name:'Cancel booking'}));await userEvent.click(screen.getByRole('button',{name:'Yes, cancel'}))}
 if(action==='reschedule'){await userEvent.click(screen.getByRole('button',{name:'Reschedule'}));fireEvent.change(document.querySelector('#manage-new-start')!,{target:{value:'2030-06-02T10:00'}});await userEvent.click(screen.getByRole('button',{name:'Move booking'}))}
 await waitFor(()=>expect(api.post).toHaveBeenCalled());
 const call=vi.mocked(api.post).mock.calls[0];expect(call[0]).toBe('/public/booking-management/'+action);expect(call[2]).toEqual({headers:{'X-Booking-Token':'token-B'}});
})
it.each(['success','403'] as const)('does not let late questionnaire A %s change B draft or submitted state',async result=>{
 const pending=deferred();vi.mocked(api.post).mockImplementation(()=>pending.promise as never);
 const{queryClient}=mount('/questionnaire');await screen.findByText('Questionnaire A');await userEvent.type(screen.getByRole('textbox'),'A submitted answer');await userEvent.click(screen.getByRole('button',{name:'Send answers'}));await waitFor(()=>expect(api.post).toHaveBeenCalled());
 await next('native');await screen.findByText('Questionnaire B');
 expect(screen.getByRole('textbox')).toHaveValue('');await userEvent.type(screen.getByRole('textbox'),'B draft answer');
 await act(async()=>{if(result==='success')pending.resolve({data:{version:1,submitted_at:'2026-10-24T10:00:00Z'}});else pending.reject(apiError(403,'A expired error'));await Promise.resolve()});
 expect(screen.getByText('Questionnaire B')).toBeInTheDocument();expect(screen.getByRole('textbox')).toHaveValue('B draft answer');expect(screen.getByRole('button',{name:'Send answers'})).toBeEnabled();expect(screen.queryByText('A expired error')).not.toBeInTheDocument();expect(queryClient.getQueryData(['public-questionnaire','token-B'])).toEqual(form('token-B'));
})

it.each(['success','403'] as const)('does not let late manage A %s mutate B cache or action state',async result=>{
 const pending=deferred();vi.mocked(api.post).mockImplementation(()=>pending.promise as never);
 const{queryClient}=mount('/manage');await screen.findByText('Business A');await userEvent.click(screen.getByRole('button',{name:'Confirm booking'}));await waitFor(()=>expect(api.post).toHaveBeenCalled());
 await next('router');await screen.findByText('Business B');expect(screen.getByRole('button',{name:'Confirm booking'})).toBeEnabled();
 await act(async()=>{if(result==='success')pending.resolve({data:{...booking('token-A'),confirmed_at:'2026-10-24T10:00:00Z'}});else pending.reject(apiError(403,'A stale manage error'));await Promise.resolve()});
 expect(screen.getByText('Business B')).toBeInTheDocument();expect(screen.getByRole('button',{name:'Confirm booking'})).toBeEnabled();expect(screen.queryByText('A stale manage error')).not.toBeInTheDocument();expect(screen.queryByRole('status')).not.toBeInTheDocument();expect(queryClient.getQueryData(['manage-booking','token-B'])).toEqual(booking('token-B'));
})
it.each(['/questionnaire','/manage'])('scrubs tokens without losing the router history index at %s',async path=>{
 mount(path);await screen.findByText(path==='/manage'?'Business A':'Questionnaire A');
 expect(window.location.hash).toBe('');expect(window.history.state).toMatchObject({idx:0,key:'seed'});
 await next('router');await screen.findByText(path==='/manage'?'Business B':'Questionnaire B');
 expect(window.location.hash).toBe('');expect(window.history.state).toMatchObject({idx:1});
})
it.each(['/questionnaire','/manage'])('clears the old guest session for an explicitly empty token at %s',async path=>{
 mount(path);const oldTitle=path==='/manage'?'Business A':'Questionnaire A';await screen.findByText(oldTitle);
 await act(async()=>{window.location.hash='token=';await new Promise(resolve=>setTimeout(resolve,10))});
 await waitFor(()=>expect(screen.queryByText(oldTitle)).not.toBeInTheDocument());
 expect(sessionStorage.getItem(path==='/manage'?'booking_manage_token':'questionnaire_token')).toBeNull();
 expect(screen.queryByRole('button',{name:path==='/manage'?'Confirm booking':'Send answers'})).not.toBeInTheDocument();expect(api.post).not.toHaveBeenCalled();
 expect(vi.mocked(api.get).mock.calls.every(call=>String(call[1]?.headers?.[path==='/manage'?'X-Booking-Token':'X-Questionnaire-Token'])==='token-A')).toBe(true);
})
