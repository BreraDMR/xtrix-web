import {it,expect,vi} from 'vitest'
import {BrowserRouter,Routes,Route} from 'react-router-dom'
import {screen,act,waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionnairePage from '../pages/booking/Questionnaire'
import api from '../api/client'
import {renderWithProviders,resetStores} from '../test/render'
vi.mock('../api/client',()=>({default:{get:vi.fn(),post:vi.fn()}}))
it('replaces the old questionnaire token when another visit link is opened in the same tab',async()=>{
 resetStores();sessionStorage.clear();window.history.replaceState(null,'','/questionnaire#token=token-A');
 vi.mocked(api.get).mockImplementation(async(_url,config)=>({data:{version:1,name:config?.headers?.['X-Questionnaire-Token']==='token-A'?'Questionnaire A':'Questionnaire B',description:'',fields:[{key:'preference',label:'Preference',type:'text',required:true,max_length:200}],expires_at:'2030-01-01T00:00:00Z',submitted_at:null}}));
 vi.mocked(api.post).mockResolvedValue({data:{version:1,submitted_at:'2026-10-24T10:00:00Z'}});
 renderWithProviders(<BrowserRouter><Routes><Route path='/questionnaire' element={<QuestionnairePage/>}/></Routes></BrowserRouter>,{router:false});
 await screen.findByText('Questionnaire A');
 await act(async()=>{window.location.hash='token=token-B';await new Promise(resolve=>setTimeout(resolve,10));});
 expect(screen.queryByText('Questionnaire A')).not.toBeInTheDocument();await screen.findByText('Questionnaire B');
 await userEvent.type(screen.getByRole('textbox'),'B intended answer');
 await userEvent.click(screen.getByRole('button',{name:'Send answers'}));
 await waitFor(()=>expect(api.post).toHaveBeenCalled());
 expect(api.post).toHaveBeenCalledWith('/public/questionnaires/answers',{answers:{preference:'B intended answer'}},{headers:{'X-Questionnaire-Token':'token-B'}});
});
