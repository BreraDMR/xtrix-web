import { useNavigate } from 'react-router-dom'
import { loginPath, rememberResume, type Resume } from './links'

// Sends the visitor to sign in again and repeats the action afterwards (5-minute rule).
export function useReauth() {
  const navigate = useNavigate()
  return (resume: Resume, back: string) => {
    rememberResume(resume)
    navigate(loginPath(back, true))
  }
}
