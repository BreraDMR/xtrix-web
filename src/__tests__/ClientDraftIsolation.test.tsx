import {useState} from 'react'
import {beforeEach,expect,it,vi} from 'vitest'
import {screen,waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientTags from '../components/clients/ClientTags'
import ClientNotes from '../components/clients/ClientNotes'
import api from '../api/client'
import {renderWithProviders,resetStores,signIn} from '../test/render'
vi.mock('../api/client',()=>({default:{get:vi.fn(),put:vi.fn(),post:vi.fn()}}))
beforeEach(() => { vi.clearAllMocks(); resetStores() });
function Harness({notes=false}:{notes?:boolean}){const[id,setId]=useState(1); return <><button onClick={()=>setId(2)}>Next client</button>{notes?<ClientNotes clientId={id}/>:<ClientTags clientId={id}/>}</>}
it('does not offer to save A private draft as B preferences after client changes',async()=>{
 resetStores();signIn({id:1,role:'business_owner',business_id:1});
 vi.mocked(api.get).mockImplementation(async url=>({data:{client_id:url.includes('/1/')?1:2,tags:[url.includes('/1/')?'A tag':'B tag'],preferences:url.includes('/1/')?'A saved':'B saved'}}));
 vi.mocked(api.put).mockResolvedValue({data:{client_id:2,tags:['B tag'],preferences:'B saved'}});
 renderWithProviders(<Harness/>);
 const preferences=await screen.findByRole('textbox',{name:'Preferences'});
 await userEvent.clear(preferences);await userEvent.type(preferences,'A PRIVATE UNSAVED');
 await userEvent.click(screen.getByRole('button',{name:'Next client'}));
 await screen.findByText('B tag');
 await userEvent.click(screen.getByRole('button',{name:'Save tags and preferences'}));
 expect(api.put).not.toHaveBeenCalledWith('/clients/2/profile',{tags:['B tag'],preferences:'A PRIVATE UNSAVED'});
});
it('does not carry A note draft into B on client changes',async()=>{
 resetStores();signIn({id:1,role:'business_owner',business_id:1});
 vi.mocked(api.get).mockResolvedValue({data:[]});vi.mocked(api.post).mockResolvedValue({data:{}});renderWithProviders(<Harness notes/>);
 const input=await screen.findByRole('textbox',{name:'A note only your team can see'});
 await userEvent.type(input,'A PRIVATE NOTE');
 await userEvent.click(screen.getByRole('button',{name:'Next client'}));
 await waitFor(()=>expect(api.get).toHaveBeenCalledWith('/clients/2/notes'));
 await userEvent.click(screen.getByRole('button',{name:'Add note'}));
 expect(api.post).not.toHaveBeenCalledWith('/clients/2/notes',{body:'A PRIVATE NOTE'});
});
